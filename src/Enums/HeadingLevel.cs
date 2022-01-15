namespace Tavenem.Blazor.Framework;

/// <summary>
/// A type of heading tag.
/// </summary>
public enum HeadingLevel
{
    /// <summary>
    /// Not a heading (generates a span).
    /// </summary>
    None = 0,

    /// <summary>
    /// An h1 element.
    /// </summary>
    H1 = 1,

    /// <summary>
    /// An h2 element.
    /// </summary>
    H2 = 2,

    /// <summary>
    /// An h3 element.
    /// </summary>
    H3 = 3,

    /// <summary>
    /// An h4 element.
    /// </summary>
    H4 = 4,

    /// <summary>
    /// An h5 element.
    /// </summary>
    H5 = 5,

    /// <summary>
    /// An h6 element.
    /// </summary>
    H6 = 6,
}
