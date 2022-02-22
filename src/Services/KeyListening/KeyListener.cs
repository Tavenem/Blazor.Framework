using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides listening for keyboard events.
/// </summary>
public class KeyListener : IKeyListener, IAsyncDisposable
{
    private readonly DotNetObjectReference<KeyListener> _dotNetRef;
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    private string? _elementId;
    private bool _isObserving;

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
        if (_isObserving)
        {
            return;
        }
        _elementId = elementId;
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("listenForKeyEvent", _dotNetRef, elementId, options)
                .ConfigureAwait(false);
            _isObserving = true;
        }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Stop listening for keyboard events.
    /// </summary>
    public async Task DisconnectAsync()
    {
        if (!_isObserving)
        {
            return;
        }
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("disconnectKeyEvent", _elementId)
                .ConfigureAwait(false);
        }
        catch { }
        _isObserving = false;
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
    /// <param name="options">
    /// An instance of <see cref="KeyListenerOptions"/>.
    /// </param>
    public async Task UpdateKeyAsync(KeyOptions options)
    {
        if (!_isObserving)
        {
            return;
        }
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("updateKeyEvent", _elementId, options)
            .ConfigureAwait(false);
    }
}
