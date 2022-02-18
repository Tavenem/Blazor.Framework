namespace Tavenem.Blazor.Framework;

/// <summary>
/// A BoundingClientRect from JS interop.
/// </summary>
/// <param name="Top">the top Y coordinate</param>
/// <param name="Left">the left X coordinate</param>
/// <param name="Width">the width</param>
/// <param name="Height">the height</param>
/// <param name="ScrollX">the horizontal offset since the left of the page</param>
/// <param name="ScrollY">the vertical offset since the top of the page</param>
/// <param name="WindowHeight">height of the viewport</param>
/// <param name="WindowWidth">width of the viewport</param>
internal record BoundingClientRect(
    double Top,
    double Left,
    double Width,
    double Height,
    double ScrollX,
    double ScrollY,
    double WindowHeight,
    double WindowWidth)
{
    /// <summary>
    /// the left X coordinate
    /// </summary>
    public double X => Left;

    /// <summary>
    /// the top Y coordinate
    /// </summary>
    public double Y => Top;

    /// <summary>
    /// Top + Height
    /// </summary>
    public double Bottom => Top + Height;

    /// <summary>
    /// Left + Width
    /// </summary>
    public double Right => Left + Width;

    /// <summary>
    /// Left + ScrollX
    /// </summary>
    public double AbsoluteLeft => Left + ScrollX;

    /// <summary>
    /// Top + ScrollY
    /// </summary>
    public double AbsoluteTop => Top + ScrollY;

    /// <summary>
    /// Right + ScrollX
    /// </summary>
    public double AbsoluteRight => Right + ScrollX;

    /// <summary>
    /// Bottom + ScrollY
    /// </summary>
    public double AbsoluteBottom => Bottom + ScrollY;

    public bool IsOutsideBottom => Bottom > WindowHeight;

    public bool IsOutsideLeft => Left < 0;

    public bool IsOutsideTop => Top < 0;

    public bool IsOutsideRight => Right > WindowWidth;

    /// <summary>
    /// An empty bounding rect.
    /// </summary>
    public static BoundingClientRect Empty { get; } = new(0, 0, 0, 0, 0, 0, 0, 0);
}
