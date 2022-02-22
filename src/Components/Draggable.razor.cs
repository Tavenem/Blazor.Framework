using Microsoft.AspNetCore.Components;
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
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// <para>
    /// An optional CSS class to be added to this element when it is being dragged.
    /// </para>
    /// <para>
    /// Defaults to <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public virtual string? DragClass { get; set; }

    /// <summary>
    /// <para>
    /// Sets the allowed drag effects for drag operations with this item.
    /// </para>
    /// <para>
    /// Defaults to <see cref="DragEffect.All"/>.
    /// </para>
    /// </summary>
    [Parameter] public virtual DragEffect DragEffectAllowed { get; set; } = DragEffect.All;

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
    [Parameter] public virtual Func<DragStartData>? GetDragData { get; set; }

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string? Id { get; set; }

    /// <summary>
    /// <para>
    /// Whether this item is currently draggable.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public virtual bool IsDraggable { get; set; } = true;

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
    [Parameter] public virtual TDragItem? Item { get; set; }

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

    [Inject] private DragDropService DragDropService { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        if (AdditionalAttributes.TryGetValue("id", out var value)
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
        else if (string.IsNullOrWhiteSpace(Id))
        {
            Id = Guid.NewGuid().ToString();
        }
    }

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
        if (firstRender)
        {
            DragDropListener.DragClass = DragClass;
            DragDropListener.ElementId = Id;
            DragDropListener.GetData = GetDragDataInner;
            DragDropListener.OnDropped += OnDroppedAsync;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
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

    private DragStartData GetDragDataInner()
    {
        if (!IsDraggable)
        {
            return DragStartData.None;
        }

        if (GetDragData is not null)
        {
            return GetDragData.Invoke();
        }

        if (Item is null)
        {
            return DragStartData.None;
        }

        return DragDropService.GetDragStartData(Item, effectAllowed: DragEffectAllowed);
    }

    private async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (IsDraggable)
        {
            await OnDropped.InvokeAsync(e);
        }
    }
}