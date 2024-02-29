using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization.Metadata;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An item which can be dragged.
/// </summary>
/// <typeparam name="TDragItem">The type of data dragged from this item.</typeparam>
public partial class Draggable<TDragItem> : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// Sets the allowed drag effects for drag operations with this item.
    /// </para>
    /// <para>
    /// Defaults to <see cref="DragEffect.CopyMove"/>.
    /// </para>
    /// </summary>
    [Parameter] public DragEffect DragEffectAllowed { get; set; } = DragEffect.CopyMove;

    /// <summary>
    /// <para>
    /// Invoked when a drag operation starts, to get the data to be dragged, and the allowed drop
    /// type.
    /// </para>
    /// <para>
    /// If not set, defaults to returning the object assigned to <see cref="Item"/>.
    /// </para>
    /// <para>
    /// If <see cref="Item"/> is also unset, no drag event occurs.
    /// </para>
    /// </summary>
    [Parameter] public Func<DragStartData>? GetDragData { get; set; }

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// <para>
    /// Whether this item is currently draggable.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool IsDraggable { get; set; } = true;

    /// <summary>
    /// <para>
    /// An optional data item bound to this component.
    /// </para>
    /// <para>
    /// The <see cref="GetDragData"/> callback can be configured instead, for greater control over
    /// the data provided to the drag operation.
    /// </para>
    /// <para>
    /// If both this item and the <see cref="GetDragData"/> callback are unset, no drag operation
    /// occurs.
    /// </para>
    /// <para>
    /// If <typeparamref name="TDragItem"/> is <see cref="string"/> the drag data type will be
    /// "text/plain", unless it is a valid <see cref="Uri"/>.
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
    /// </summary>
    [Parameter] public TDragItem? Item { get; set; }

    /// <summary>
    /// JSON serialization metadata about the item type.
    /// </summary>
    /// <remarks>
    /// This is used to (de)serialize the value to and from a JSON string for the underlying
    /// drag-drop APIs. If omitted, the reflection-based JSON serializer will be used (unless
    /// <typeparamref name="TDragItem"/> implements <see cref="IDraggable"/>), which is not trim
    /// safe or AOT-compilation compatible.
    /// </remarks>
    [Parameter] public JsonTypeInfo<TDragItem>? JsonTypeInfo { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when a drop operation completes with this element as the dropped item (including by
    /// cancellation).
    /// </para>
    /// <para>
    /// The argument parameter indicates which drag effect was ultimately selected for the drag-drop
    /// operation.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<DragEffect> OnDropped { get; set; }

    [Inject] private DragDropListener DragDropListener { get; set; } = default!;

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            DragDropListener.ElementId = Id;
            DragDropListener.GetData = GetDragDataInner;
            DragDropListener.OnDropped += OnDroppedAsync;
        }
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                DragDropListener.OnDropped -= OnDroppedAsync;
            }

            _disposedValue = true;
        }
    }

    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Only causes dynamic access when JsonTypeInfo is missing, and a warning is provided on that member")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Only causes dynamic access when JsonTypeInfo is missing, and a warning is provided on that member")]
    private DragStartData GetDragDataInner()
    {
        if (!IsDraggable || DragEffectAllowed == DragEffect.None)
        {
            return DragStartData.None;
        }

        DragStartData data;
        if (GetDragData is not null)
        {
            data = GetDragData.Invoke();
        }
        else if (Item is null)
        {
            return DragStartData.None;
        }
        else
        {
            data = JsonTypeInfo is null
                ? DragDropService.GetDragStartData(Item, effectAllowed: DragEffectAllowed)
                : DragDropService.GetDragStartData(Item, JsonTypeInfo, effectAllowed: DragEffectAllowed);
        }

        return data;
    }

    private async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (IsDraggable)
        {
            await OnDropped.InvokeAsync(e);
        }
    }
}