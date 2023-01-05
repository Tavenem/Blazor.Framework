using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides listening for keyboard events.
/// </summary>
internal class KeyListener : IKeyListener, IAsyncDisposable
{
    private readonly DotNetObjectReference<KeyListener> _dotNetRef;
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    private List<string>? _elementIds;

    /// <summary>
    /// Invoked when a configured keydown event occurs.
    /// </summary>
    public event KeyboardEvent? KeyDown;

    /// <summary>
    /// Invoked when a configured keyup event occurs.
    /// </summary>
    public event KeyboardEvent? KeyUp;

    /// <summary>
    /// Initializes a new instance of <see cref="KeyListener"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public KeyListener(IJSRuntime jsRuntime)
    {
        _dotNetRef = DotNetObjectReference.Create(this);
        _moduleTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-keylistener.js")
            .AsTask());
    }

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
            await DisconnectAsync();
            await module.DisposeAsync().ConfigureAwait(false);
        }

        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Begin listening for keyboard events.
    /// </summary>
    /// <param name="elementId">The id of the element to be listened to.</param>
    /// <param name="options">
    /// An instance of <see cref="KeyListenerOptions"/>.
    /// </param>
    public async Task ConnectAsync(string elementId, KeyListenerOptions options)
    {
        (_elementIds ??= new()).Add(elementId);
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("listenForKeyEvent", _dotNetRef, elementId, options)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    /// <summary>
    /// Stop listening for keyboard events on all elements.
    /// </summary>
    public async Task DisconnectAsync()
    {
        if (_elementIds is null)
        {
            return;
        }
        foreach (var id in _elementIds)
        {
            await DisconnectAsync(id);
        }
    }

    /// <summary>
    /// Stop listening for keyboard events.
    /// </summary>
    /// <param name="elementId">
    /// The id of the element to be disconnected.
    /// </param>
    public async Task DisconnectAsync(string elementId)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("disconnectKeyEvent", elementId)
                .ConfigureAwait(false);
        }
        catch { }
        _elementIds?.Remove(elementId);
    }

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    public void OnKeyDown(KeyboardEventArgs args) => KeyDown?.Invoke(args);

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    public void OnKeyUp(KeyboardEventArgs args) => KeyUp?.Invoke(args);

    /// <summary>
    /// Update the current keyboard event listener.
    /// </summary>
    /// <param name="elementId">The id of the element to be updated.</param>
    /// <param name="options">
    /// An instance of <see cref="KeyListenerOptions"/>.
    /// </param>
    public async Task UpdateKeyAsync(string elementId, KeyOptions options)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("updateKeyEvent", elementId, options)
            .ConfigureAwait(false);
    }
}
