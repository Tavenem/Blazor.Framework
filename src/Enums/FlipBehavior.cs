namespace Tavenem.Blazor.Framework;

/// <summary>
/// Indicates when a popover will flip its orientation.
/// </summary>
public enum FlipBehavior
{
    /// <summary>
    /// Does not flip.
    /// </summary>
    Flip_Never = 0,

    /// <summary>
    /// Flips when opened.
    /// </summary>
    Flip_OnOpen = 1,

    /// <summary>
    /// Flips whenever the main body is scrolled, or the window is resized.
    /// </summary>
    Flip_Always = 2,
}
