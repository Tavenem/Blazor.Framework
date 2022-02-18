namespace Tavenem.Blazor.Framework;

/// <summary>
/// The type of selection from a set.
/// </summary>
public enum SelectionType
{
    /// <summary>
    /// No selection of items.
    /// </summary>
    None = 0,

    /// <summary>
    /// Only one items in the set may be selected.
    /// </summary>
    Single = 1,

    /// <summary>
    /// Any number of items may be selected.
    /// </summary>
    Multiple = 2,
}
