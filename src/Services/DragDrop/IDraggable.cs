namespace Tavenem.Blazor.Framework;

/// <summary>
/// Implement this interface to provide guidance for the JSON and/or plaintext representations of a
/// dragged item.
/// </summary>
public interface IDraggable
{
    /// <summary>
    /// Gets a string representation of this item in JSON format, for dragging operations.
    /// </summary>
    /// <returns>
    /// A string in JSON format; or <see langword="null"/> if the default JSON serializer should be
    /// used to serialize this item.
    /// </returns>
    string? ToDraggedJson();

    /// <summary>
    /// Gets a string representation of this item in plain text format, for dragging operations.
    /// </summary>
    /// <returns>
    /// A string; or <see langword="null"/> if the default <see cref="object.ToString"/> method
    /// should be used to get a string representation of this item.
    /// </returns>
    string? ToDraggedString();
}
