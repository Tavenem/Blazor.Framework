﻿using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides viewport scrolling services, including <see cref="ScrollToId(string?,
/// ScrollLogicalPosition, bool)"/> and <see cref="ScrollToTop(string?)"/>.
/// </summary>
/// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
public class ScrollService(IJSRuntime jsRuntime) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask = new(
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
}
