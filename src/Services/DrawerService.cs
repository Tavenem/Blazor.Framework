using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Manages drawer toggles.
/// </summary>
/// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
public class DrawerService(IJSRuntime jsRuntime) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-drawer.js")
        .AsTask());

    private bool _disposedValue;

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'DisposeAsync(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Closes any drawer on the given side.
    /// </summary>
    /// <param name="side">The side to close.</param>
    /// <remarks>
    /// If no drawer on the given side is open, or the drawer is permanently open due to breakpoint
    /// settings, nothing happens.
    /// </remarks>
    public async Task CloseAsync(Side side)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("closeDrawer", side.ToString().ToLowerInvariant())
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Open any drawer on the given side.
    /// </summary>
    /// <param name="side">The side to open.</param>
    /// <remarks>
    /// If no drawer on the given side is closed, or the drawer is permanently closed due to breakpoint
    /// settings, nothing happens.
    /// </remarks>
    public async Task OpenAsync(Side side)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("openDrawer", side.ToString().ToLowerInvariant())
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Toggle any drawer on the given side.
    /// </summary>
    /// <param name="side">The side to toggle.</param>
    /// <remarks>
    /// If there is no drawer on the given side, or the drawer is permanently open or closed due to
    /// breakpoint settings, nothing happens.
    /// </remarks>
    public async Task ToggleAsync(Side side)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("toggleDrawer", side.ToString().ToLowerInvariant())
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
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
            if (disposing)
            {
                if (_moduleTask.IsValueCreated)
                {
                    try
                    {
                        var module = await _moduleTask.Value;
                        await module.DisposeAsync();
                    }
                    catch { }
                }
            }

            _disposedValue = true;
        }
    }
}
