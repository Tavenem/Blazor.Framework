using Microsoft.JSInterop;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides encapsulated javascript interop for <c>Tavenem.Blazor.Framework</c>
/// </summary>
public class FrameworkJsInterop : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;
    private readonly List<PopoverHandler> _popoverHandlers = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    private bool _popoversInitialized;

    /// <summary>
    /// Initializes a new instance of <see cref="FrameworkJsInterop"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public FrameworkJsInterop(IJSRuntime jsRuntime) => _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-framework.js")
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
        if (_moduleTask.IsValueCreated)
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            if (_popoversInitialized)
            {
                await module.InvokeVoidAsync("popoverDispose");
            }
            await module.DisposeAsync().ConfigureAwait(false);
        }

        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Detect the current preferred color scheme (light vs dark mode).
    /// </summary>
    /// <returns>A <see cref="ThemePreference"/> value.</returns>
    public async ValueTask<ThemePreference> GetPreferredColorScheme()
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        return await module
            .InvokeAsync<ThemePreference>("getPreferredColorScheme")
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Scroll to the HTML element with the given id.
    /// </summary>
    /// <param name="elementId">The id of an HTML element.</param>
    public async ValueTask ScrollToId(string? elementId)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("scrollToId", elementId)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Scroll to the top of the element which matches the given CSS selector.
    /// </summary>
    /// <param name="selector">A CSS selector.</param>
    public async ValueTask ScrollToTop(string? selector)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("scrollToTop", selector)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Sets the current preferred color scheme (light vs dark mode).
    /// </summary>
    /// <param name="theme">A <see cref="ThemePreference"/> value.</param>
    public async ValueTask SetColorScheme(ThemePreference theme)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("setColorScheme", theme)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Horizontally shake the HTML element with the given id.
    /// </summary>
    /// <param name="elementId">The id of an HTML element.</param>
    public async ValueTask Shake(string? elementId)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("shake", elementId)
            .ConfigureAwait(false);
    }

    internal async ValueTask CancelScrollListener(string? selector)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("cancelScrollListener", selector);
    }

    /// <summary>
    /// Gets all the headings in the current window.
    /// </summary>
    /// <returns>An array of element ids.</returns>
    internal async ValueTask<HeadingData[]> GetHeadings()
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        return await module
            .InvokeAsync<HeadingData[]>("getHeadings", Heading.HeadingClassName)
            .ConfigureAwait(false);
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
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        finally
        {
            _lock.Release();
        }
    }

    internal async Task<PopoverHandler> RegisterPopoverAsync(string? anchorId = null)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        var handler = new PopoverHandler(module, anchorId);
        _popoverHandlers.Add(handler);
        return handler;
    }

    /// <summary>
    /// Observes scrolling and resizing events to detect which of the elements
    /// with the given class is currently in view.
    /// </summary>
    /// <param name="dotNetRef">
    /// A reference to the framework.
    /// </param>
    /// <param name="className">
    /// The CSS class name of the elements to observe.
    /// </param>
    internal async ValueTask ScrollSpy(DotNetObjectReference<FrameworkLayout> dotNetRef, string className)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("scrollSpy", dotNetRef, className)
            .ConfigureAwait(false);
    }

    internal async ValueTask StartScrollListener(DotNetObjectReference<ScrollListener> dotNetRef, string? selector)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("listenForScroll", dotNetRef, selector);
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
