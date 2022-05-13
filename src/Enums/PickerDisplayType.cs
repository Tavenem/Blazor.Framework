namespace Tavenem.Blazor.Framework;

/// <summary>
/// The way a picker's activator should be displayed.
/// </summary>
public enum PickerDisplayType
{
    /// <summary>
    /// No specified type.
    /// </summary>
    None = 0,

    /// <summary>
    /// An input field which displays the value, and shows the picker on focus.
    /// </summary>
    Field = 1,

    /// <summary>
    /// A button which shows the picker on activation.
    /// </summary>
    Button = 2,

    /// <summary>
    /// The full picker is displayed within its host page.
    /// </summary>
    Inline = 3,
}
