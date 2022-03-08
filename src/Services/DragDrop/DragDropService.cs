using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides drag-drop services.
/// </summary>
public class DragDropService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    /// <summary>
    /// Initializes a new instance of <see cref="ScrollService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public DragDropService(IJSRuntime jsRuntime) => _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-dragdrop.js")
        .AsTask());

    /// <summary>
    /// Gets a <see cref="DragStartData"/> object for the given item.
    /// </summary>
    /// <typeparam name="TData">The type of data to be transferred.</typeparam>
    /// <param name="item">The data to be transferred.</param>
    /// <param name="type">
    /// <para>
    /// The mime type of the data to be transferred.
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, the inferred type depends on the type of <typeparamref
    /// name="TData"/>.
    /// </para>
    /// <para>
    /// If <typeparamref name="TData"/> is <see cref="string"/> the type will be "text/plain",
    /// unless it is a valid <see cref="Uri"/>.
    /// </para>
    /// <para>
    /// Valid <see cref="Uri"/> instances (including strings which can be parsed successfully as an
    /// absolute <see cref="Uri"/>) will be given type "text/uri-list", and a fallback copy with
    /// "text/plain" will also be added.
    /// </para>
    /// <para>
    /// All other data will be set as the internal transfer item, and also serialized as JSON and
    /// added with type "application/json". Serialization errors will be ignored. A fallback item of
    /// type "text/plain" with the value of the object's <see cref="object.ToString"/> method will
    /// also be set.
    /// </para>
    /// <para>
    /// If the item implements <see cref="IDraggable"/>, its <see cref="IDraggable.ToDraggedJson"/>
    /// and <see cref="IDraggable.ToDraggedString"/> methods will be used to get the JSON and string
    /// representations, rather than the default JSON serialization and <see
    /// cref="object.ToString"/> methods.
    /// </para>
    /// </param>
    /// <param name="effectAllowed">
    /// The drag effects allowed for the drag-drop operation.
    /// </param>
    /// <returns>
    /// A configured <see cref="DragStartData"/> instance.
    /// </returns>
    public static DragStartData GetDragStartData<TData>(TData item, string? type = null, DragEffect effectAllowed = DragEffect.All)
    {
        var data = new List<KeyValuePair<string, object>>();
        if (item is null)
        {
            return new DragStartData
            {
                Data = data,
                EffectAllowed = effectAllowed,
            };
        }

        if (typeof(TData) == typeof(string)
            || typeof(TData) == typeof(Uri))
        {
            var str = item.ToString();
            if (!string.IsNullOrEmpty(str))
            {
                if (!string.IsNullOrEmpty(type))
                {
                    data.Add(new(type, str));
                }
                if (type != "text/uri-list"
                    && Uri.IsWellFormedUriString(str, UriKind.Absolute))
                {
                    data.Add(new("text/uri-list", str));
                }
                if (type != "text/plain")
                {
                    data.Add(new("text/plain", str));
                }
            }
        }
        else
        {
            var draggable = item as IDraggable;
            var str = draggable?.ToDraggedString()
                ?? item.ToString();

            if (!string.IsNullOrEmpty(type)
                && !string.IsNullOrEmpty(str))
            {
                data.Add(new(type, str));
            }

            string? json = null;
            if (draggable is not null)
            {
                json = draggable.ToDraggedJson();
            }
            else
            {
                try
                {
                    json = JsonSerializer.Serialize(item);
                }
                catch { }
            }

            if (!string.IsNullOrEmpty(json))
            {
                if (string.IsNullOrEmpty(type))
                {
                    data.Add(new($"application/json-{typeof(TData).Name}", json));
                }

                data.Add(new("application/json", json));
            }

            if (draggable is not null)
            {
                if (!string.IsNullOrEmpty(str))
                {
                    data.Add(new("text/plain", str));
                }
            }
            else if (!string.IsNullOrEmpty(str))
            {
                data.Add(new("text/plain", str));
            }
        }

        return new DragStartData
        {
            Data = data,
            EffectAllowed = effectAllowed,
        };
    }

    /// <summary>
    /// Tries to get data of the given type.
    /// </summary>
    /// <typeparam name="TData">The type of data to retrieve.</typeparam>
    /// <param name="e">A <see cref="DropEventArgs"/> instance.</param>
    /// <param name="type">
    /// <para>
    /// The mime type of the data to retrieve.
    /// </para>
    /// <para>
    /// If the <typeparamref name="TData"/> type is not <see cref="string"/>, and an item with the
    /// correct data type is found, an attempt is made to deserialize the data from JSON into the
    /// provided type.
    /// </para>
    /// <para>
    /// If no <paramref name="type"/> parameter is provided, the data is checked for the special
    /// internal transfer type 'tavenem/drop-data' first. If found, and if the item referenced is of
    /// the <typeparamref name="TData"/> type, it is returned. <strong>Note:</strong> the item is
    /// cleared from the internal transfer cache after being returned. Subsequent calls to this
    /// method will <em>not</em> return the object again.
    /// </para>
    /// <para>
    /// If an internal transfer of the correct type is not detected, the 'application/json' type is
    /// checked next. If found, an attempt is made to deserialize the data into the provided type.
    /// </para>
    /// <para>
    /// Finally, if the <typeparamref name="TData"/> type is <see cref="string"/>, the first item
    /// which is not of type 'tavenem/drop-data' is returned.
    /// </para>
    /// <para>
    /// If the <typeparamref name="TData"/> type is not <see cref="string"/>, the default value for
    /// the <typeparamref name="TData"/> type (e.g. <see langword="null"/>) is returned.
    /// </para>
    /// </param>
    /// <returns>
    /// The requested data, if found; otherwise, the default value for the <typeparamref
    /// name="TData"/> type.
    /// </returns>
    public static TData? TryGetData<TData>(IEnumerable<KeyValuePair<string, string>> e, string? type = null)
    {
        if (string.IsNullOrEmpty(type)
            && TryGetDataOfType<TData>(e, out var jsonData))
        {
            return jsonData;
        }

        if (typeof(TData) == typeof(string))
        {
            if (!string.IsNullOrEmpty(type))
            {
                foreach (var (dataType, item) in e)
                {
                    if (dataType == type
                        && item is TData strItem)
                    {
                        return strItem;
                    }
                }
                return default;
            }

            foreach (var (dataType, item) in e)
            {
                if (dataType != "tavenem/drop-data"
                    && item is TData strItem)
                {
                    return strItem;
                }
            }
        }

        if (!string.IsNullOrEmpty(type)
            && TryGetDataOfType<TData>(e, out var data, type))
        {
            return data;
        }

        return default;
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    public async ValueTask DisposeAsync()
    {
        if (_moduleTask.IsValueCreated)
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.DisposeAsync().ConfigureAwait(false);
        }

        GC.SuppressFinalize(this);
    }

    internal async ValueTask CancelDragListener(string? elementId)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("cancelDragListener", elementId);
    }

    internal async ValueTask CancelDropListener(string? elementId)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("cancelDropListener", elementId);
    }

    internal async ValueTask StartDragListener(DotNetObjectReference<DragDropListener> dotNetRef, string? elementId)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("listenForDrag", dotNetRef, elementId);
    }

    internal async ValueTask StartDropListener(
        DotNetObjectReference<DragDropListener> dotNetRef,
        string? elementId,
        DragEffect? effect)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "listenForDrop",
            dotNetRef,
            elementId,
            effect?.ToJsString());
    }

    private static bool TryGetDataOfType<TData>(
        IEnumerable<KeyValuePair<string, string>> e,
        [NotNullWhen(true)] out TData? data,
        string? type = null)
    {
        type ??= "application/json";

        data = default;

        foreach (var (dataType, item) in e)
        {
            if (dataType == type)
            {
                try
                {
                    data = JsonSerializer.Deserialize<TData>(item);
                }
                catch
                {
                    continue;
                }
                if (data is not null)
                {
                    return true;
                }
            }
        }

        return false;
    }
}
