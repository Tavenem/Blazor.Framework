namespace Tavenem.Blazor.Framework;

/// <summary>
/// A type of text syntax for an <see cref="Editor"/>.
/// </summary>
public enum EditorSyntax
{
    /// <summary>No syntax; plain text</summary>
    None = 0,

    /// <summary>C++</summary>
    Cpp = 1,

    /// <summary>C#</summary>
    CSharp = 2,

    /// <summary>CSS</summary>
    CSS = 3,

    /// <summary>Handlebars</summary>
    Handlebars = 4,

    /// <summary>
    /// <para>
    /// HTML
    /// </para>
    /// <para>
    /// Supports WYSIWYG editing.
    /// </para>
    /// </summary>
    HTML = 5,

    /// <summary>Java</summary>
    Java = 6,

    /// <summary>JavaScript</summary>
    JavaScript = 7,

    /// <summary>JSON</summary>
    JSON = 8,

    /// <summary>LaTeX</summary>
    LaTeX = 9,

    /// <summary>
    /// <para>
    /// Markdown
    /// </para>
    /// <para>
    /// Supports WYSIWYG editing.
    /// </para>
    /// </summary>
    Markdown = 10,

    /// <summary>Objective-C</summary>
    ObjectiveC = 11,

    /// <summary>Python</summary>
    Python = 12,

    /// <summary>Sass</summary>
    Sass = 13,

    /// <summary>SQL</summary>
    SQL = 14,

    /// <summary>TypeScript</summary>
    TypeScript = 15,

    /// <summary>XML</summary>
    XML = 16,

    /// <summary>YAML</summary>
    YAML = 17,
}
