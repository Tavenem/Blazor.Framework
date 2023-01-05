using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A keyboard event handler.
/// </summary>
/// <param name="args">
/// An instance of <see cref="KeyboardEventArgs"/>.
/// </param>
public delegate void KeyboardEvent(KeyboardEventArgs args);

/// <summary>
/// Provides listening for keyboard events.
/// </summary>
public interface IKeyListener
{
    /// <summary>
    /// Invoked when a configured keydown event occurs.
    /// </summary>
    event KeyboardEvent? KeyDown;

    /// <summary>
    /// Invoked when a configured keyup event occurs.
    /// </summary>
    event KeyboardEvent? KeyUp;

    /// <summary>
    /// Begin listening for keyboard events.
    /// </summary>
    /// <param name="elementId">The id of the element to be listened to.</param>
    /// <param name="options">
    /// An instance of <see cref="KeyListenerOptions"/>.
    /// </param>
    Task ConnectAsync(string elementId, KeyListenerOptions options);

    /// <summary>
    /// Stop listening for keyboard events on all elements.
    /// </summary>
    Task DisconnectAsync();

    /// <summary>
    /// Stop listening for keyboard events.
    /// </summary>
    /// <param name="elementId">
    /// The id of the element to be disconnected.
    /// </param>
    Task DisconnectAsync(string elementId);

    /// <summary>
    /// Update the current keyboard event listener.
    /// </summary>
    /// <param name="elementId">The id of the element to be updated.</param>
    /// <param name="options">
    /// An instance of <see cref="KeyListenerOptions"/>.
    /// </param>
    Task UpdateKeyAsync(string elementId, KeyOptions options);
}