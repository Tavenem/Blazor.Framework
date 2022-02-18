namespace Tavenem.Blazor.Framework;

/// <summary>
/// The element which should receive focus by default.
/// </summary>
public enum DefaultFocus
{
    /// <summary>
    /// No element.
    /// </summary>
    None = 0,

    /// <summary>
    /// The element itself.
    /// </summary>
    Element = 1,

    /// <summary>
    /// The element's first child.
    /// </summary>
    FirstChild = 2,

    /// <summary>
    /// The element's last child.
    /// </summary>
    LastChild = 3,
}
