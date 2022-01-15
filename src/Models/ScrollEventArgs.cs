namespace Tavenem.Blazor.Framework;

internal class ScrollEventArgs : EventArgs
{
    /// <summary>
    /// The BoundingClientRect for the first child of the scrolled element
    /// </summary>
    public BoundingClientRect? FirstChildBoundingClientRect { get; set; }

    /// <summary>
    /// Node name of the scrolled element.
    /// </summary>
    public string? NodeName { get; set; }

    /// <summary>
    /// This property is a measurement of the height of an element's content,
    /// including content not visible on the screen due to overflow.
    /// </summary>
    public int ScrollHeight { get; set; }

    /// <summary>
    /// This property gets or sets the number of pixels that an element's
    /// content is scrolled from its left edge.
    /// </summary>
    public double ScrollLeft { get; set; }

    /// <summary>
    /// This property gets or sets the number of pixels that an element's
    /// content is scrolled vertically.
    /// </summary>
    public double ScrollTop { get; set; }

    /// <summary>
    /// This property is a measurement of the width of an element's content,
    /// including content not visible on the screen due to overflow.
    /// </summary>
    public int ScrollWidth { get; set; }
}
