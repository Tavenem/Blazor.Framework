using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

internal class PopoverService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;
    private readonly List<PopoverHandler> _popoverHandlers = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    private bool _disposedValue;
    private bool _popoversInitialized;

    /// <summary>
    /// Initializes a new instance of <see cref="PopoverService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public PopoverService(IJSRuntime jsRuntime) => _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-popover.js")
        .AsTask());

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing && _moduleTask.IsValueCreated)
            {
                try
                {
                    var module = await _moduleTask.Value.ConfigureAwait(false);
                    if (_popoversInitialized)
                    {
                        await module.InvokeVoidAsync("popoverDispose");
                    }
                    await module.DisposeAsync().ConfigureAwait(false);
                }
                catch { }
            }

            _disposedValue = true;
        }
    }

    internal async Task InitializePopoversAsync()
    {
        if (_popoversInitialized)
        {
            return;
        }

        try
        {
            await _lock.WaitAsync();
            if (_popoversInitialized)
            {
                return;
            }
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync("popoverInitialize");
            _popoversInitialized = true;
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        finally
        {
            _lock.Release();
        }
    }

    internal async Task<PopoverHandler?> RegisterPopoverAsync(string? anchorId = null, string? focusId = null)
    {
        PopoverHandler? handler = null;
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            handler = new PopoverHandler(module, anchorId, focusId);
            _popoverHandlers.Add(handler);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        return handler;
    }

    internal async Task<bool> UnregisterPopoverHandler(PopoverHandler handler)
    {
        if (!_popoverHandlers.Contains(handler)
            || !handler.IsConnected)
        {
            return false;
        }

        await handler.DetachAsync();
        _popoverHandlers.Remove(handler);
        return true;
    }
}
