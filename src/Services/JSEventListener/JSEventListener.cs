using Microsoft.JSInterop;
using System.Text.Json;

namespace Tavenem.Blazor.Framework.Services;

internal class JSEventListener : IJSEventListener, IAsyncDisposable
{
    private readonly Dictionary<Guid, (Type eventType, Func<object?, Task> callback)> _callbackResolver = new();
    private readonly DotNetObjectReference<JSEventListener> _dotNetRef;
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    /// <summary>
    /// Initializes a new instance of <see cref="JSEventListener"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public JSEventListener(IJSRuntime jsRuntime)
    {
        _dotNetRef = DotNetObjectReference.Create(this);
        _moduleTask = new(
            () => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-events.js")
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
            foreach (var callback in _callbackResolver)
            {
                await UnsubscribeAsync(callback.Key);
            }

            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.DisposeAsync().ConfigureAwait(false);
        }
        _dotNetRef.Dispose();

        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Invoked by javascript.
    /// </summary>
    [JSInvokable]
    public async Task OnEventOccur(Guid key, string @eventData)
    {
        if (!_callbackResolver.ContainsKey(key))
        {
            return;
        }

        var (eventType, callback) = _callbackResolver[key];

        var @event = JsonSerializer.Deserialize(eventData, eventType, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
        });

        if (callback is not null)
        {
            await callback.Invoke(@event);
        }
    }

    /// <summary>
    /// Begin listening to the given javascript event for the given element.
    /// </summary>
    /// <typeparam name="T">The type of event args expected.</typeparam>
    /// <param name="eventName">The name of the event to listen to.</param>
    /// <param name="elementId">The id of the element to add a listener to.</param>
    /// <param name="correctOffset">
    /// Whether to correct client coordinates to target coordinates.
    /// </param>
    /// <param name="throttle">
    /// If event callbacks should be throttled, the delay in milliseconds between the last event
    /// occurrence and the invocation of the callback.
    /// </param>
    /// <param name="callback">
    /// <para>
    /// The function invoked when the event is raised.
    /// </para>
    /// <para>
    /// The argument will be an object of type <typeparamref name="T"/>.
    /// </para>
    /// </param>
    /// <returns>
    /// A unique id for the subscription, which can be used to <see cref="UnsubscribeAsync(Guid)"/>.
    /// </returns>
    public async Task<Guid> SubscribeAsync<T>(
        string eventName,
        string elementId,
        bool correctOffset,
        int throttle,
        Func<object?, Task> callback)
    {
        var key = Guid.NewGuid();
        var type = typeof(T);
        var properties = type
            .GetProperties()
            .Select(x => char.ToLower(x.Name[0]) + x.Name[1..])
            .ToArray();

        _callbackResolver.Add(key, (type, callback));

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync(
                "subscribe",
                eventName,
                elementId,
                correctOffset,
                throttle,
                key.ToString(),
                properties,
                _dotNetRef)
            .ConfigureAwait(false);

        return key;
    }

    /// <summary>
    /// Stop listening for javascript events.
    /// </summary>
    /// <param name="id">
    /// An id returned by <see cref="SubscribeAsync{T}(string, string, bool, int, Func{object, Task})"/>.
    /// </param>
    public async Task UnsubscribeAsync(Guid id)
    {
        if (!_callbackResolver.ContainsKey(id))
        {
            return;
        }

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("unsubscribe", id.ToString())
                .ConfigureAwait(false);
        }
        catch { }
    }
}
