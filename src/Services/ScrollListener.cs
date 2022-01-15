using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

internal class ScrollListener : IDisposable
{
    private readonly FrameworkJsInterop _jsInterop;

    private bool _disposedValue;
    private DotNetObjectReference<ScrollListener>? _dotNetRef;
    private EventHandler<ScrollEventArgs>? _onScroll;

    /// <summary>
    /// The CSS selector to which the scroll event will be attached.
    /// </summary>
    public string? Selector { get; set; }

    /// <summary>
    /// OnScroll event. Fired when a element is scrolled
    /// </summary>
    public event EventHandler<ScrollEventArgs> OnScroll
    {
        add => Subscribe(value);
        remove => Unsubscribe(value);
    }

    public ScrollListener(FrameworkJsInterop jsInterop)
        => _jsInterop = jsInterop;

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _dotNetRef?.Dispose();
            }

            _disposedValue = true;
        }
    }

    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Unsubscribe to scroll events.
    /// </summary>
    private ValueTask Cancel()
        => _jsInterop.CancelScrollListener(Selector);

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable] public void RaiseOnScroll(ScrollEventArgs e) => _onScroll?.Invoke(this, e);

    /// <summary>
    /// Subscribe to scroll events.
    /// </summary>
    private ValueTask Start()
    {
        _dotNetRef = DotNetObjectReference.Create(this);
        return _jsInterop.StartScrollListener(_dotNetRef, Selector);
    }

    private async void Subscribe(EventHandler<ScrollEventArgs> value)
    {
        if (_onScroll is null)
        {
            await Start();
        }
        _onScroll += value;
    }

    private async void Unsubscribe(EventHandler<ScrollEventArgs> value)
    {
        _onScroll -= value;
        if (_onScroll is null)
        {
            await Cancel().ConfigureAwait(false);
        }
    }
}
