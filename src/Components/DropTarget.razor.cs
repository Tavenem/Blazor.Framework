using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

public partial class DropTarget<TDropItem> : IDisposable
{
    private protected bool _disposedValue;
    private protected bool _dragOver;
    private protected bool _canDrop;

    private bool _initialized;

    /// <summary>
    /// <para>
    /// This function can return a value which indicates whether a given item
    /// may be dropped onto this target.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/> if not provided.
    /// </para>
    /// </summary>
    [Parameter] public virtual Func<TDropItem, bool>? CanDrop { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// Whether this drop target is accepting drops.
    /// </summary>
    [Parameter] public virtual bool IsDropTarget { get; set; }

    /// <summary>
    /// Invoked when an item is dropped on this target.
    /// </summary>
    [Parameter] public EventCallback<TDropItem> OnDrop { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder()
        .Add("can-drop", _canDrop)
        .Add("no-drop", _dragOver && !_canDrop)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    [CascadingParameter] private protected FrameworkLayout? FrameworkLayout { get; set; }

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in the render
    /// tree, and the incoming values have been assigned to properties.
    /// </summary>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (FrameworkLayout is not null
            && !_initialized)
        {
            _initialized = true;
            FrameworkLayout.DragEnded += OnDragEnded;
            FrameworkLayout.DragStarted += OnDragStarted;
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

    internal (TDropItem?, bool) ItemCanBeDropped()
    {
        if (!IsDropTarget
            || FrameworkLayout?.CurrentDragType != typeof(TDropItem)
            || FrameworkLayout.CurrentDragItem is not TDropItem item)
        {
            return (default(TDropItem), false);
        }

        return (item, CanDrop?.Invoke(item) ?? true);
    }

    internal async Task OnDragToTargetCompleteAsync(TDropItem item)
        => await OnDropCompleteAsync(item);

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
                FrameworkLayout.DragEnded -= OnDragEnded;
                FrameworkLayout.DragStarted -= OnDragStarted;
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Invoked when a drag operation completes.
    /// </summary>
    /// <param name="item">The droped item.</param>
    protected virtual async Task OnDropCompleteAsync(TDropItem item)
        => await OnDrop.InvokeAsync(item);

    private protected void OnDragEnter()
    {
        _dragOver = true;
        (_, _canDrop) = ItemCanBeDropped();
    }

    private protected void OnDragLeave()
    {
        _dragOver = false;
        _canDrop = false;
    }

    private protected async Task OnDropAsync()
    {
        if (!IsDropTarget
            || FrameworkLayout is null)
        {
            return;
        }

        var (item, canDrop) = ItemCanBeDropped();
        if (item is null)
        {
            return;
        }

        if (!canDrop)
        {
            await FrameworkLayout.CancelDragAsync();
            return;
        }

        await FrameworkLayout.CompleteDropAsync(this);
    }

    private void OnDragEnded(object? sender, EventArgs e)
    {
        _dragOver = false;
        _canDrop = false;
        StateHasChanged();
    }

    private void OnDragStarted(object? sender, EventArgs e)
    {
        (_, _canDrop) = ItemCanBeDropped();
        StateHasChanged();
    }
}