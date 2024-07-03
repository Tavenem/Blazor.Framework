namespace Tavenem.Blazor.Framework.Services;

/// <summary>
/// Conveys information about a boolean value change event.
/// </summary>
public class CropEventArgs : EventArgs
{
    /// <summary>
    /// The X-coordinate of the left edge of the crop area, relative to the left edge of the image.
    /// </summary>
    public double X { get; set; }

    /// <summary>
    /// The Y-coordinate of the top edge of the crop area, relative to the top edge of the image.
    /// </summary>
    public double Y { get; set; }

    /// <summary>
    /// The width of the crop area.
    /// </summary>
    public double Width { get; set; }

    /// <summary>
    /// The height of the crop area.
    /// </summary>
    public double Height { get; set; }
}
