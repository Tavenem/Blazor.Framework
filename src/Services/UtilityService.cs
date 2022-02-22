using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides encapsulated javascript interop for <c>Tavenem.Blazor.Framework</c>
/// </summary>
public class UtilityService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    /// <summary>
    /// Initializes a new instance of <see cref="UtilityService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public UtilityService(IJSRuntime jsRuntime) => _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-utility.js")
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
}
