using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A target for drag-drop operations, as well as an item which can be dragged.
/// </summary>
/// <typeparam name="TDragItem">The type of data dragged from this item.</typeparam>
/// <typeparam name="TDropItem">The type of data dropped onto this target.</typeparam>
public partial class DraggableDropTarget<TDragItem, TDropItem> : DropTarget<TDropItem>
{
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

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values.
    /// </summary>
    protected override string? CssClass => new CssBuilder("border-transparent")
        .Add(CanDropClass, DragDropListener.DropValid)
        .Add(NoDropClass, !DragDropListener.DropValid)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    internal virtual DragEffect GetDragEffectAllowed() => DragEffectAllowed;

    internal virtual bool GetIsDraggable() => IsDraggable;

    /// <summary>
    /// Method invoked after each time the component has been rendered.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override void OnAfterRender(bool firstRender)
    {
        base.OnAfterRender(firstRender);
        if (firstRender)
        {
            DragDropListener.GetData = GetDragDataInner;
            DragDropListener.OnDropped += OnDroppedAsync;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                DragDropListener.OnDropped -= OnDroppedAsync;
            }
            base.Dispose(disposing);

            _disposedValue = true;
        }
    }

    private protected virtual DragStartData GetDragDataInner()
    {
        if (!GetIsDraggable() || GetDragEffectAllowed() == DragEffect.None)
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
            data = DragDropService.GetDragStartData(Item, effectAllowed: GetDragEffectAllowed());
        }

        return data;
    }

    private protected virtual async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (GetIsDraggable())
        {
            await OnDropped.InvokeAsync(e);
        }
    }
}