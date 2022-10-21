namespace Tavenem.Blazor.Framework;

/// <summary>
/// The proposed bounds of a crop operation.
/// </summary>
/// <param name="X">
/// The X-coordinate of the left edge of the crop area, relative to the left edge of the image.
/// </param>
/// <param name="Y">
/// The Y-coordinate of the top edge of the crop area, relative to the top edge of the image.
/// </param>
/// <param name="Width">The width of the crop area.</param>
/// <param name="Height">The height of the crop area.</param>
public record CropBounds(double X, double Y, double Width, double Height);
