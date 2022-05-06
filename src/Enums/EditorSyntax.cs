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

    /// <summary>
    /// <para>
    /// HTML
    /// </para>
    /// <para>
    /// Supports WYSIWYG editing.
    /// </para>
    /// </summary>
    HTML = 4,

    /// <summary>Java</summary>
    Java = 5,

    /// <summary>JavaScript</summary>
    JavaScript = 6,

    /// <summary>JSON</summary>
    JSON = 7,

    /// <summary>LaTeX</summary>
    LaTeX = 8,

    /// <summary>Less</summary>
    Less = 9,

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

    /// <summary>PHP</summary>
    PHP = 12,

    /// <summary>Python</summary>
    Python = 13,

    /// <summary>Sass</summary>
    Sass = 14,

    /// <summary>SQL</summary>
    SQL = 15,

    /// <summary>TypeScript</summary>
    TypeScript = 16,
}
