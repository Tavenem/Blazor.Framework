using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

internal class ScrollListener : IDisposable
{
    private readonly ScrollService _scrollService;

    private bool _disposedValue;
    private DotNetObjectReference<ScrollListener>? _dotNetRef;
    private EventHandler<ScrollEventArgs>? _onScroll;

    /// <summary>
    /// The CSS selector to which the scroll event will be attached.
    /// </summary>
    public string? Selector { get; set; }

    /// <summary>
    /// Raised when the element is scrolled.
    /// </summary>
    public event EventHandler<ScrollEventArgs> OnScroll
    {
        add => Subscribe(value);
        remove => Unsubscribe(value);
    }

    public ScrollListener(ScrollService scrollService)
        => _scrollService = scrollService;

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
        => _scrollService.CancelScrollListener(Selector);

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable] public void RaiseOnScroll(ScrollEventArgs e) => _onScroll?.Invoke(this, e);

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

    /// <summary>
    /// Subscribe to scroll events.
    /// </summary>
    private ValueTask Start()
    {
        _dotNetRef = DotNetObjectReference.Create(this);
        return _scrollService.StartScrollListener(_dotNetRef, Selector);
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
