using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides encapsulated javascript interop for <c>Tavenem.Blazor.Framework</c>
/// </summary>
internal class FrameworkJsInterop : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

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
            await module.DisposeAsync().ConfigureAwait(false);
        }

        GC.SuppressFinalize(this);
    }

    public async ValueTask CancelScrollListener(string? selector)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("cancelScrollListener", selector);
    }

    /// <summary>
    /// Gets all the headings in the current window.
    /// </summary>
    /// <returns>An array of element ids.</returns>
    public async ValueTask<HeadingData[]> GetHeadings()
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        return await module
            .InvokeAsync<HeadingData[]>("getHeadings", Heading.HeadingClassName)
            .ConfigureAwait(false);
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
    /// Observes scrolling and resizing events to detect which of the elements
    /// with the given class is currently in view.
    /// </summary>
    /// <param name="className">
    /// The CSS class name of the elements to observe.
    /// </param>
    public async ValueTask ScrollSpy(string className)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("scrollSpy", className)
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

    public async ValueTask StartScrollListener(DotNetObjectReference<ScrollListener> dotNetRef, string? selector)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync("listenForScroll", dotNetRef, selector);
    }
}
