namespace Tavenem.Blazor.Framework;

/// <summary>
/// The position to which a scroll action should occur.
/// </summary>
public enum ScrollLogicalPosition
{
    /// <summary>
    /// To the center.
    /// </summary>
    Center = 0,

    /// <summary>
    /// To the end.
    /// </summary>
    End = 1,

    /// <summary>
    /// To either the end or the start, whichever is closer.
    /// </summary>
    Nearest = 2,

    /// <summary>
    /// To the start.
    /// </summary>
    Start = 3,
}
