namespace Tavenem.Blazor.Framework;

/// <summary>
/// An origin point, usually used as an anchor or transform origin.
/// </summary>
public enum Origin
{
    /// <summary>
    /// An unspecified origin.
    /// </summary>
    None = 0,

    /// <summary>
    /// The top-left corner.
    /// </summary>
    Top_Left = 1,

    /// <summary>
    /// The center of the top edge.
    /// </summary>
    Top_Center = 2,

    /// <summary>
    /// The top-right corner.
    /// </summary>
    Top_Right = 3,

    /// <summary>
    /// The center of the left edge.
    /// </summary>
    Center_Left = 4,

    /// <summary>
    /// The center of the element.
    /// </summary>
    Center_Center = 5,

    /// <summary>
    /// The center of the right edge.
    /// </summary>
    Center_Right = 6,

    /// <summary>
    /// The bottom-left corner.
    /// </summary>
    Bottom_Left = 7,

    /// <summary>
    /// The center of the bottom edge.
    /// </summary>
    Bottom_Center = 8,

    /// <summary>
    /// The bottom-right corner.
    /// </summary>
    Bottom_Right = 9,
}
