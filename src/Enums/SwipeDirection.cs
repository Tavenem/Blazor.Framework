namespace Tavenem.Blazor.Framework;

/// <summary>
/// The direction of a touch swipe.
/// </summary>
[Flags]
public enum SwipeDirection
{
    /// <summary>
    /// No direction.
    /// </summary>
    None = 0,

    /// <summary>
    /// A swipe downward.
    /// </summary>
    Down = 1 << 0,

    /// <summary>
    /// A swipe from right to left.
    /// </summary>
    Left = 1 << 1,

    /// <summary>
    /// A swipe from left to right.
    /// </summary>
    Right = 1 << 2,

    /// <summary>
    /// A swipe upward.
    /// </summary>
    Up = 1 << 3,
}
