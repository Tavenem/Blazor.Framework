using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

public partial class DraggableDropTarget<TDragItem, TDropItem>
{
    private protected bool _dragOperationIsInProgress = false;

    private bool _initialized;

    /// <summary>
    /// The data item bound to this component.
    /// </summary>
    [Parameter] public TDragItem? Item { get; set; }

    /// <summary>
    /// Method invoked when the component has received parameters from its
    /// parent in the render tree, and the incoming values have been assigned to
    /// properties.
    /// </summary>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (FrameworkLayout is not null
            && !_initialized)
        {
            _initialized = true;
            FrameworkLayout.DragEnded += OnDragEndedInner;
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
            if (disposing
                && _initialized
                && FrameworkLayout is not null)
            {
                FrameworkLayout.DragEnded -= OnDragEndedInner;
            }
            base.Dispose(disposing);

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Event handler for <c>ondragend</c>
    /// </summary>
    protected async Task OnDragEndAsync()
    {
        if (_dragOperationIsInProgress)
        {
            _dragOperationIsInProgress = false;
            if (FrameworkLayout is not null)
            {
                await FrameworkLayout.CancelDragAsync();
            }
        }
    }

    /// <summary>
    /// Event handler for <c>ondragstart</c>
    /// </summary>
    protected void OnDragStart()
    {
        if (FrameworkLayout is null)
        {
            return;
        }

        _dragOperationIsInProgress = true;
        FrameworkLayout.StartDrag(Item, OnDragCompleteInnerAsync);
    }

    /// <summary>
    /// Called when a drag operation involving this item completes (including by cancellation).
    /// </summary>
    protected virtual Task OnDragCompleteAsync(DropTarget<TDragItem> target) => Task.CompletedTask;

    /// <summary>
    /// Called when any drag operation ends (including by cancellation).
    /// </summary>
    protected virtual void OnDragEnded() { }

    private async Task OnDragCompleteInnerAsync()
    {
        _dragOperationIsInProgress = false;
        if (FrameworkLayout?.CurrentDropTarget is DropTarget<TDragItem> target
            && FrameworkLayout?.CurrentDragItem is TDragItem item)
        {
            await OnDragCompleteAsync(target);
            await target.OnDragToTargetCompleteAsync(item);
        }
    }

    private void OnDragEndedInner(object? sender, EventArgs e)
    {
        _dragOperationIsInProgress = false;
        OnDragEnded();
    }
}