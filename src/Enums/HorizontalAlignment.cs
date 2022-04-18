namespace Tavenem.Blazor.Framework;

/// <summary>
/// A horizontal alignment.
/// </summary>
public enum HorizontalAlignment
{
    /// <summary>
    /// No specified alignment.
    /// </summary>
    None = 0,

    /// <summary>
    /// Left-aligned.
    /// </summary>
    Left = 1,

    /// <summary>
    /// Aligned to the start. Usually left for ltr layouts, and right for rtl layouts.
    /// </summary>
    Start = 2,

    /// <summary>
    /// Center-aligned.
    /// </summary>
    Center = 3,

    /// <summary>
    /// Aligned to the end. Usually right for ltr layouts, and left for rtl layouts.
    /// </summary>
    End = 4,

    /// <summary>
    /// Right-aligned.
    /// </summary>
    Right = 5,
}
