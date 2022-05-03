namespace Tavenem.Blazor.Framework;

/// <summary>
/// A possible mode for an <see cref="Editor"/>.
/// </summary>
public enum EditorMode
{
    /// <summary>
    /// No specified mode.
    /// </summary>
    None = 0,

    /// <summary>
    /// The editor displays the literal text being edited.
    /// </summary>
    Text = 1,

    /// <summary>
    /// <para>
    /// The editor displays the rendered content in an editable mode.
    /// </para>
    /// <para>
    /// Only available for rendered content types, such as markdown or HTML.
    /// </para>
    /// </summary>
    WYSIWYG = 2,
}
