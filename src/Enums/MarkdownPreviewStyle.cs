namespace Tavenem.Blazor.Framework;

/// <summary>
/// The style of markdown preview for an <see cref="Editor"/>.
/// </summary>
public enum MarkdownPreviewStyle
{
    /// <summary>
    /// No specified style.
    /// </summary>
    None = 0,

    /// <summary>
    /// <para>
    /// A split view, with both the text editor and a preview pane.
    /// </para>
    /// <para>
    /// Only available for rendered content types, such as markdown or HTML.
    /// </para>
    /// </summary>
    Split = 1,

    /// <summary>
    /// <para>
    /// Two tabs: the text editor, and a preview. The tabs can be toggled by the user.
    /// </para>
    /// <para>
    /// Only available for rendered content types, such as markdown or HTML.
    /// </para>
    /// </summary>
    Tabs = 2,
}
