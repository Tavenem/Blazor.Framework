using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

internal class PopoverHandler : IDisposable
{
    private readonly IJSObjectReference _jsInterop;

    private bool _disposedValue;
    private DotNetObjectReference<PopoverHandler>? _dotNetRef;

    public string? AnchorId { get; init; }
    public string? FocusId { get; init; }
    public Guid Id { get; init; }
    public bool IsConnected { get; private set; }

    public event EventHandler? FocusLeft;

    public PopoverHandler(IJSObjectReference jsInterop, string? anchorId = null, string? focusId = null)
    {
        _jsInterop = jsInterop;
        AnchorId = anchorId;
        FocusId = focusId;
        Id = Guid.NewGuid();
    }

    public async Task DetachAsync()
    {
        try
        {
            await _jsInterop.InvokeVoidAsync("popoverDisconnect", Id);
        }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        finally
        {
            IsConnected = false;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    public async Task Initialize()
    {
        _dotNetRef = DotNetObjectReference.Create(this);
        await _jsInterop.InvokeVoidAsync("popoverConnect", Id, _dotNetRef, AnchorId, FocusId);
        IsConnected = true;
    }

    [JSInvokable]
    public void OnFocusLeft() => FocusLeft?.Invoke(this, EventArgs.Empty);

    public ValueTask SetOffsetAsync(double? x, double? y)
        => _jsInterop.InvokeVoidAsync("setPopoverOffset", Id, x, y);

    public ValueTask SetPositionAsync(double? x, double? y)
        => _jsInterop.InvokeVoidAsync("setPopoverPosition", Id, x, y);

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
    /// </summary>
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
}
