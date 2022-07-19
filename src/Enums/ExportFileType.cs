namespace Tavenem.Blazor.Framework;

/// <summary>
/// The type of file exported from a <see cref="DataGrid{TDataItem}"/>
/// </summary>
public enum ExportFileType
{
    /// <summary>
    /// No type.
    /// </summary>
    None = 0,

    /// <summary>
    /// Comma-separated values.
    /// </summary>
    CSV = 1,

    /// <summary>
    /// An Excel spreadsheet.
    /// </summary>
    Excel = 2,

    /// <summary>
    /// An HTML document.
    /// </summary>
    HTML = 3,

    /// <summary>
    /// A PDF file.
    /// </summary>
    PDF = 4,
}
