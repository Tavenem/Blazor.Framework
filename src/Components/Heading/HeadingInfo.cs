namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about a heading on a page.
/// </summary>
public class HeadingInfo
{
    /// <summary>
    /// The id of the HTML element.
    /// </summary>
    public string? Id { get; set; }

    /// <summary>
    /// The type of heading tag.
    /// </summary>
    public HeadingLevel Level { get; set; }

    /// <summary>
    /// The text of this heading.
    /// </summary>
    public string? Title { get; set; }
}
