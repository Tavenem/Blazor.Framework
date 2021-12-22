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
            "./_content/Tavenem.Blazor.Framework/script.js")
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

    public async ValueTask<ThemePreference> GetPreferredColorScheme()
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        return await module
            .InvokeAsync<ThemePreference>("getPreferredColorScheme")
            .ConfigureAwait(false);
    }

    public async ValueTask ScrollToId(string elementId)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("scrollToId", elementId)
            .ConfigureAwait(false);
    }

    public async ValueTask SetColorScheme(ThemePreference theme)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("setColorScheme", theme)
            .ConfigureAwait(false);
    }
}
