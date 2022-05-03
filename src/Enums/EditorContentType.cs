namespace Tavenem.Blazor.Framework;

/// <summary>
/// The type of content edited and/or displayed by an <see cref="Editor"/>.
/// </summary>
public enum EditorContentType
{
    /// <summary>
    /// No specified type; plain text (with or without syntax highlighting).
    /// </summary>
    None = 0,

    /// <summary>
    /// HTML-formatted text.
    /// </summary>
    HTML = 1,

    /// <summary>
    /// Markdown-formatted text.
    /// </summary>
    Markdown = 2,
}
