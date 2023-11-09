using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Manages popovers.
/// </summary>
/// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
public class PopoverService(IJSRuntime jsRuntime) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-popover.js")
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
    /// Sets the open state of the dropdown with the given HTML <paramref name="id"/>.
    /// </summary>
    /// <param name="id">The HTML id of the dropdown to set.</param>
    /// <param name="value">The visibility value to assign.</param>
    public async Task SetDropdownOpenAsync(string id, bool value)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("setDropdownOpen", id, value)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Sets the visibility of the tooltip with the given HTML <paramref name="id"/>.
    /// </summary>
    /// <param name="id">The HTML id of the tooltip to set.</param>
    /// <param name="value">The visibility value to assign.</param>
    public async Task SetTooltipVisibilityAsync(string id, bool value)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("setTooltipVisibility", id, value)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Toggles the dropdown with the given HTML <paramref name="id"/>.
    /// </summary>
    /// <param name="id">The HTML id of the dropdown to toggle.</param>
    public async Task ToggleDropdownAsync(string id)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("toggleDropdown", id)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Toggles the tooltip with the given HTML <paramref name="id"/>.
    /// </summary>
    /// <param name="id">The HTML id of the tooltip to toggle.</param>
    public async Task ToggleTooltipAsync(string id)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("toggleTooltip", id)
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
