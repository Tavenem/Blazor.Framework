using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An item which can be dragged.
/// </summary>
/// <typeparam name="TDragItem">The type of data dragged from this item.</typeparam>
public partial class Draggable<TDragItem> : IDisposable
{
    private protected bool _dragOperationIsInProgress = false;

    private bool _disposedValue;
    private bool _initialized;

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// The data item bound to this component.
    /// </summary>
    [Parameter] public TDragItem? Item { get; set; }

    [CascadingParameter] private protected FrameworkLayout? FrameworkLayout { get; set; }

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
            if (disposing
                && _initialized
                && FrameworkLayout is not null)
            {
                FrameworkLayout.DragEnded -= OnDragEndedInner;
            }

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