using Microsoft.JSInterop;
using System.Text.Json;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Supports tables of contents.
/// </summary>
/// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
public class ContentsService(IJSRuntime jsRuntime) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-contents.js")
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
    /// Gets the headings nested under the element with the given HTML <paramref name="id"/>.
    /// </summary>
    /// <param name="id">
    /// The HTML id of an element whose nested headings are to be retrieved.
    /// </param>
    /// <returns>An array of <see cref="HeadingInfo"/> objects.</returns>
    public async ValueTask<HeadingInfo[]> GetHeadingsAsync(string id)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            var results = await module
                .InvokeAsync<HeadingInfo[]>("getHeadings", id)
                .ConfigureAwait(false);
            Console.WriteLine(JsonSerializer.Serialize(results));
            return results;
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        return [];
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
                    await module.DisposeAsync().ConfigureAwait(false);
                }
                catch { }
            }

            _disposedValue = true;
        }
    }
}
