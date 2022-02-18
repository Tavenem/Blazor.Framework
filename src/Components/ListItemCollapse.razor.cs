using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// This class is for internal use only. It will not function properly if used directly.
/// </summary>
public partial class ListItemCollapse<TListItem>
{
    private bool _canDrop;
    private bool _dragOver;
    private bool _dragOperationIsInProgress;
    private bool _initialized;

    private bool Draggable => ListItem?.Draggable == true;

    private string HeaderClass => new CssBuilder("header")
        .Add("no-drag", !Draggable)
        .Add("can-drop", _dragOver && _canDrop)
        .Add("no-drop", _dragOver && !_canDrop)
        .Add(ListItem?.ItemDraggingClass, _dragOperationIsInProgress)
        .ToString();

    [CascadingParameter] private ListItem<TListItem>? ListItem { get; set; }

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
            FrameworkLayout.DragEnded += OnDragEnded;
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
                FrameworkLayout.DragEnded -= OnDragEnded;
            }
            base.Dispose(disposing);

            _disposedValue = true;
        }
    }

    private async Task OnDragCompleteAsync()
    {
        _dragOperationIsInProgress = false;

        if (ListItem is not null
            && FrameworkLayout?.CurrentDropTarget is DropTarget<TListItem> target
            && FrameworkLayout?.CurrentDragItem is TListItem item)
        {
            await ListItem.RemoveFromListAsync();
            await target.OnDragToTargetCompleteAsync(item);
        }
    }

    private async Task OnDragEndAsync()
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

    private void OnDragEnded(object? sender, EventArgs e)
    {
        _dragOperationIsInProgress = false;
        _canDrop = false;
        _dragOver = false;
        StateHasChanged();
    }

    private void OnDragEnter()
    {
        _dragOver = true;
        if (ListItem is not null)
        {
            (_, _canDrop) = ListItem.ItemCanBeDropped();
        }
    }

    private void OnDragLeave()
    {
        _dragOver = false;
        _canDrop = false;
    }

    private void OnDragStart()
    {
        if (FrameworkLayout is null)
        {
            return;
        }

        _dragOperationIsInProgress = true;
        if (ListItem is not null
            && ListItem.Item is not null)
        {
            FrameworkLayout.StartDrag(ListItem.Item, OnDragCompleteAsync);
        }
    }

    private async Task OnDropAsync()
    {
        if (ListItem?.IsDropTarget != true
            || FrameworkLayout is null)
        {
            return;
        }

        var (item, canDrop) = ListItem.ItemCanBeDropped();
        if (item is null)
        {
            return;
        }

        if (!canDrop)
        {
            await FrameworkLayout.CancelDragAsync();
            return;
        }

        await FrameworkLayout.CompleteDropAsync(ListItem);
    }
}