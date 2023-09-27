using Tavenem.Blazor.Framework.Components.DataGrid;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides information about the properties which should be assigned to a <see
/// cref="DataGrid{TDataItem}"/> <see cref="IColumn"/> which is auto-generated for a property or
/// field.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = true, Inherited = true)]
public class DataGridColumnAttribute : Attribute
{
    /// <summary>
    /// <para>
    /// The horizontal alignment of this column (applies to both header and data).
    /// </para>
    /// <para>
    /// Default is <see cref="HorizontalAlignment.None"/>, which is treated as <see
    /// cref="HorizontalAlignment.Left"/> for most content, but as <see
    /// cref="HorizontalAlignment.Right"/> for numbers, and <see cref="HorizontalAlignment.Center"/>
    /// for boolean values.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), no guarantee is made
    /// regarding which value is ultimately assigned to the column.
    /// </remarks>
    public HorizontalAlignment Alignment { get; set; }

    /// <summary>
    /// <para>
    /// Whether the data in this column can be edited.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// <para>
    /// Ignored if the parent grid does not support editing.
    /// </para>
    /// </summary>
    /// <remarks>
    /// <para>
    /// If the data in a column cannot be edited, its cell will remain in read-only mode during
    /// inline edit operations. When performing an automatic dialog edit, the column's data will
    /// still be displayed is its <see cref="IColumn.IsShown"/> value is <see langword="true"/>, in
    /// case its content is important for user context during the edit process, but it will be
    /// read-only. If its <see cref="IColumn.IsShown"/> value is <see langword="false"/> it will not
    /// appear on the automatic edit dialog at all.
    /// </para>
    /// <para>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="false"/> will override any value of <see langword="true"/>.
    /// </para>
    /// </remarks>
    public bool CanEdit { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether the data can be filtered by this column (i.e. searched).
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// <para>
    /// Only columns of type <see cref="string"/>, <see cref="bool"/>, a date/time type or a numeric
    /// type can be filtered.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="false"/> will override any value of <see langword="true"/>.
    /// </remarks>
    public bool CanFilter { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether this column's visibility may be toggled by the user when filtering columns.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="false"/> will override any value of <see langword="true"/>.
    /// </remarks>
    public bool CanHide { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether the data can be sorted by this column.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="false"/> will override any value of <see langword="true"/>.
    /// </remarks>
    public bool CanSort { get; set; } = true;

    /// <summary>
    /// An optional CSS class for this column.
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), the values will be
    /// concatenated (separated by spaces), so that all indicated CSS classes will be applied to the
    /// column.
    /// </remarks>
    public string? ColumnClass { get; set; }

    /// <summary>
    /// An optional display order for this column.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Auto-generated columns without a specified display order will appear in an arbitrary order.
    /// </para>
    /// <para>
    /// If defined more than once on a member (including by inheritance), no guarantee is made
    /// regarding which value is ultimately assigned to the column, except that a value of zero (the
    /// default) will be overruled by any other value.
    /// </para>
    /// </remarks>
    public int ColumnOrder { get; set; }

    /// <summary>
    /// <para>
    /// Whether the current <see cref="IColumn.DateTimeFilter"/> refers to a date/time that all
    /// values should be equal to or before (rather than equal to or after).
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have date/time value types, or a non-<see langword="null"/>
    /// <see cref="IColumn.DateTimeFilter"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="true"/> will override any value of <see langword="false"/>.
    /// </remarks>
    public bool DateTimeFilterIsBefore { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> this column is included in exported data even if it is hidden.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="true"/> will override any value of <see langword="false"/>.
    /// </remarks>
    public bool ExportHidden { get; set; }

    /// <summary>
    /// If the value is <see cref="IFormattable"/>, this is supplied as the format parameter of <see
    /// cref="IFormattable.ToString(string?, IFormatProvider?)"/>.
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), no guarantee is made
    /// regarding which value is ultimately assigned to the column, except that the values of <see
    /// cref="Format"/> and <see cref="FormatProvider"/> are guaranteed to always be selected from
    /// the same attribute definition (even if one of those values is <see langword="null"/>), to
    /// avoid conflicts between the parameters.
    /// </remarks>
    public string? Format { get; set; }

    /// <summary>
    /// If the value is <see cref="IFormattable"/>, this is supplied as the <c>formatProvider</c>
    /// parameter of <see cref="IFormattable.ToString(string?, IFormatProvider?)"/>.
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), no guarantee is made
    /// regarding which value is ultimately assigned to the column, except that the values of <see
    /// cref="Format"/> and <see cref="FormatProvider"/> are guaranteed to always be selected from
    /// the same attribute definition (even if one of those values is <see langword="null"/>), to
    /// avoid conflicts between the parameters.
    /// </remarks>
    public IFormatProvider? FormatProvider { get; set; }

    /// <summary>
    /// <para>
    /// Whether this column is initially sorted.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// <para>
    /// If more than one column is initially sorted, their order of precedence is determined by the
    /// order they are initialized.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="true"/> will override any value of <see langword="false"/>.
    /// </remarks>
    public bool InitiallySorted { get; set; }

    /// <summary>
    /// <para>
    /// When set to <see langword="true"/> for a column whose value is of type <see cref="string"/>,
    /// a universal search box will appear in the data table header which includes this column in
    /// its filter.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="true"/> will override any value of <see langword="false"/>.
    /// </remarks>
    public bool IsQuickFilter { get; set; }

    /// <summary>
    /// <para>
    /// Whether this column is initially displayed.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="false"/> will override any value of <see langword="true"/>.
    /// </remarks>
    public bool IsShown { get; set; } = true;

    /// <summary>
    /// <para>
    /// The header for this column.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> (and <see cref="IColumn.LabelContent"/> is not provided), and
    /// the column's value is a simple property or field accessor, the name of the property is used
    /// (converted to a human-readable format).
    /// </para>
    /// <para>
    /// Note: this is still used even if <see cref="IColumn.LabelContent"/> is set, to set the label
    /// for the column filter dialog, for input components in automatic edit dialogs, and for data
    /// labels in single-column layout.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), no guarantee is made
    /// regarding which value is ultimately assigned to the column.
    /// </remarks>
    public string? Label { get; set; }

    /// <summary>
    /// <para>
    /// Gets whether this column is initially sorted in descending order.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If defined more than once on a member (including by inheritance), any value of <see
    /// langword="true"/> will override any value of <see langword="false"/>.
    /// </remarks>
    public bool SortDescending { get; set; }
}
