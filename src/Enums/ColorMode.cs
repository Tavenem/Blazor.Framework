namespace Tavenem.Blazor.Framework;

/// <summary>
/// A type of color format.
/// </summary>
public enum ColorMode
{
    /// <summary>
    /// No specified format.
    /// </summary>
    None = 0,

    /// <summary>
    /// A hexadecimal string.
    /// </summary>
    Hex = 1,

    /// <summary>
    /// Hue, saturation, and lightness.
    /// </summary>
    HSL = 2,

    /// <summary>
    /// Red, green, and blue.
    /// </summary>
    RGB = 3,
}
