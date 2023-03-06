using Microsoft.JSInterop;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides viewport scrolling services, including <see cref="ScrollToId(string?,
/// ScrollLogicalPosition, bool)"/> and <see cref="ScrollToTop(string?)"/>.
/// </summary>
public class ScrollService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    /// <summary>
    /// Initializes a new instance of <see cref="ScrollService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public ScrollService(IJSRuntime jsRuntime) => _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-scroll.js")
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

    /// <summary>
    /// Scroll to the HTML element with the given id.
    /// </summary>
    /// <param name="elementId">The id of an HTML element.</param>
    /// <param name="position">The position to which scrolling should occur.</param>
    /// <param name="setHistory">Whether to add this fragment to the current URL and history.</param>
    public async ValueTask ScrollToId(string? elementId, ScrollLogicalPosition position = ScrollLogicalPosition.Start, bool setHistory = true)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("scrollToId", elementId, position.ToString().ToLowerInvariant(), setHistory)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Scroll to the top of the element which matches the given CSS selector.
    /// </summary>
    /// <param name="selector">A CSS selector.</param>
    public async ValueTask ScrollToTop(string? selector = null)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("scrollToTop", selector)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    internal async ValueTask CancelScrollListener(string? selector)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync("cancelScrollListener", selector);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
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
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("scrollSpy", dotNetRef, className)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    /// <summary>
    /// Observes scrolling and resizing events to detect which of the elements
    /// with the given tag name(s) are currently in view.
    /// </summary>
    /// <param name="dotNetRef">
    /// A reference to the framework.
    /// </param>
    /// <param name="tagNames">
    /// The names of tags to observe.
    /// </param>
    internal async ValueTask ScrollSpyTags(DotNetObjectReference<FrameworkLayout> dotNetRef, params string[] tagNames)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("scrollSpyTags", dotNetRef, tagNames)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    internal async ValueTask StartScrollListener(DotNetObjectReference<ScrollListener> dotNetRef, string? selector)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync("listenForScroll", dotNetRef, selector);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }
}
