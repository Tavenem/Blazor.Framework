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
    private readonly Dictionary<Guid, object?> _internalTransfers = new();
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
    /// </param>
    /// <param name="effectAllowed">
    /// The drag effects allowed for the drag-drop operation.
    /// </param>
    /// <returns>
    /// A configured <see cref="DragStartData"/> instance.
    /// </returns>
    public DragStartData GetDragStartData<TData>(TData item, string? type = null, DragEffect effectAllowed = DragEffect.All)
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

        if (string.IsNullOrEmpty(type))
        {
            if (typeof(TData) == typeof(string))
            {
                var str = item as string;
                if (Uri.IsWellFormedUriString(str, UriKind.Absolute))
                {
                    data.Add(new("text/uri-list", str));
                }
                if (!string.IsNullOrEmpty(str))
                {
                    data.Add(new("text/plain", str));
                }
            }
            else
            {
                var id = SetInternalTransferData(item);
                data.Add(new($"tavenem/drop-data-{id}", id));

                string? json = null;
                if (item is IDraggable draggable)
                {
                    json = draggable.ToDraggedJson();
                }
                if (string.IsNullOrEmpty(json))
                {
                    try
                    {
                        json = JsonSerializer.Serialize(item);
                    }
                    catch { }
                }
                if (!string.IsNullOrEmpty(json))
                {
                    data.Add(new("application/json", json));
                }

                string? str = null;
                if (item is IDraggable draggable1)
                {
                    str = draggable1.ToDraggedString();
                }
                if (string.IsNullOrEmpty(str))
                {
                    str = item.ToString();
                }
                if (!string.IsNullOrEmpty(str))
                {
                    data.Add(new("text/plain", str));
                }
            }
        }
        else if (typeof(TData) == typeof(string))
        {
            var str = item.ToString();
            if (!string.IsNullOrEmpty(str))
            {
                data.Add(new(type, str));
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
        else if (typeof(TData) == typeof(Uri))
        {
            var uri = item.ToString();
            if (!string.IsNullOrEmpty(uri))
            {
                data.Add(new(type, uri));
                if (type != "text/uri-list")
                {
                    data.Add(new("text/uri-list", uri));
                }
                if (type != "text/plain")
                {
                    data.Add(new("text/plain", uri));
                }
            }
        }
        else
        {
            var id = SetInternalTransferData(item);
            data.Add(new($"tavenem/drop-data-{id}", id));

            string? json = null;
            if (item is IDraggable draggable)
            {
                json = draggable.ToDraggedJson();
            }
            if (string.IsNullOrEmpty(json))
            {
                try
                {
                    json = JsonSerializer.Serialize(item);
                }
                catch { }
            }
            if (!string.IsNullOrEmpty(json))
            {
                data.Add(new(type, json));
                if (type != "application/json")
                {
                    data.Add(new("application/json", json));
                }
            }

            string? str = null;
            if (item is IDraggable draggable1)
            {
                str = draggable1.ToDraggedString();
            }
            if (string.IsNullOrEmpty(str))
            {
                str = item.ToString();
            }
            if (!string.IsNullOrEmpty(str))
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
    /// Tries to get data of the given type from a <see cref="DropEventArgs"/> instance.
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
    public TData? TryGetData<TData>(DropEventArgs e, string? type = null)
    {
        if (e.Data is null)
        {
            return default;
        }

        if ((string.IsNullOrEmpty(type)
            || type == "tavenem/drop-data")
            && TryGetInternalDataOfType<TData>(e, out var internalData))
        {
            return internalData;
        }

        if (type == "tavenem/drop-data")
        {
            return default;
        }

        if (typeof(TData) == typeof(string))
        {
            if (!string.IsNullOrEmpty(type))
            {
                foreach (var (dataType, item) in e.Data)
                {
                    if (dataType == type
                        && item is TData strItem)
                    {
                        return strItem;
                    }
                }
                return default;
            }

            foreach (var (dataType, item) in e.Data)
            {
                if (dataType != "tavenem/drop-data"
                    && item is TData strItem)
                {
                    return strItem;
                }
            }
        }

        if (TryGetDataOfType<TData>(e, out var data, type))
        {
            return data;
        }

        return default;
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

    internal object? GetInternalTransferData(string? id)
    {
        if (Guid.TryParse(id, out var guid)
            && _internalTransfers.TryGetValue(guid, out var data))
        {
            return data;
        }
        return null;
    }

    internal string SetInternalTransferData<T>(T data)
    {
        var guid = Guid.NewGuid();
        _internalTransfers[guid] = data;
        return guid.ToString();
    }

    internal async ValueTask StartDragListener(DotNetObjectReference<DragDropListener> dotNetRef, string? elementId, string? dragClass)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("listenForDrag", dotNetRef, elementId, dragClass);
    }

    internal async ValueTask StartDropListener(
        DotNetObjectReference<DragDropListener> dotNetRef,
        string? elementId,
        DragEffect? effect,
        string? dropClass,
        string? noDropClass)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "listenForDrop",
            dotNetRef,
            elementId,
            effect?.ToJsString(),
            dropClass,
            noDropClass);
    }

    private static bool TryGetDataOfType<TData>(
        DropEventArgs e,
        [NotNullWhen(true)] out TData? data,
        string? type)
    {
        type ??= "application/json";

        data = default;
        if (e.Data is null)
        {
            return false;
        }

        foreach (var (dataType, item) in e.Data)
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

    private bool TryGetInternalDataOfType<TData>(DropEventArgs e, [NotNullWhen(true)] out TData? data)
    {
        data = default;
        if (e.Data is null)
        {
            return false;
        }

        foreach (var (dataType, item) in e.Data)
        {
            if (dataType == "tavenem/drop-data")
            {
                var internalItem = GetInternalTransferData(item);
                if (internalItem is TData dataItem)
                {
                    data = dataItem;
                    _internalTransfers.Remove(Guid.Parse(item));
                    return true;
                }
            }
        }

        return false;
    }
}
