namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides a mechanism for listening to javascript events.
/// </summary>
public interface IJSEventListener
{
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
    Task<Guid> SubscribeAsync<T>(
        string eventName,
        string elementId,
        bool correctOffset,
        int throttle,
        Func<object, Task> callback);

    /// <summary>
    /// Stop listening for javascript events.
    /// </summary>
    /// <param name="id">
    /// An id returned by <see cref="SubscribeAsync{T}(string, string, bool, int, Func{object, Task})"/>.
    /// </param>
    Task UnsubscribeAsync(Guid id);
}
