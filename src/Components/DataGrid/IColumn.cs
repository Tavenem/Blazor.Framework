using Microsoft.AspNetCore.Components;
using System.ComponentModel.DataAnnotations;

namespace Tavenem.Blazor.Framework.Components.DataGrid;

/// <summary>
/// A DataGrid column.
/// </summary>
public interface IColumn : IDisposable
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
    public HorizontalAlignment Alignment { get; set; }

    /// <summary>
    /// <para>
    /// The current boolean value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have <see cref="bool"/> value types.
    /// </para>
    /// </summary>
    public bool? BoolFilter { get; set; }

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
    /// still be displayed is its <see cref="IsShown"/> value is <see langword="true"/>, in case its
    /// content is important for user context during the edit process, but it will be read-only. If
    /// its <see cref="IsShown"/> value is <see langword="false"/> it will not appear on the
    /// automatic edit dialog at all.
    /// </para>
    /// <para>
    /// Can be specified for auto-generated columns with the <see
    /// cref="EditableAttribute.AllowEdit"/> property of a <see cref="EditableAttribute"/> on the
    /// property.
    /// </para>
    /// </remarks>
    public bool CanEdit { get; set; }

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
    /// Can be specified for auto-generated columns with the <see
    /// cref="DisplayAttribute.AutoGenerateFilter"/> property of a <see cref="DisplayAttribute"/> on
    /// the property.
    /// </remarks>
    public bool CanFilter { get; set; }

    /// <summary>
    /// <para>
    /// Whether this column's visibility may be toggled by the user when filtering columns.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Can be specified for auto-generated columns with the <see
    /// cref="DisplayAttribute.AutoGenerateField"/> property of a <see cref="DisplayAttribute"/> on
    /// the property.
    /// </remarks>
    public bool CanHide { get; set; }

    /// <summary>
    /// <para>
    /// Whether the data can be sorted by this column.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    public bool CanSort { get; set; }

    /// <summary>
    /// An optional CSS class for this column.
    /// </summary>
    public string? ColumnClass { get; set; }

    /// <summary>
    /// An optional display order for this column.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Can be specified for auto-generated columns with the <see cref="DisplayAttribute.Order"/>
    /// property of a <see cref="DisplayAttribute"/> on the property.
    /// </para>
    /// <para>
    /// Manually-specified columns with the default sort order (0) will appear in the order they
    /// appear in source. Auto-generated columns without a specified display order will appear in an
    /// arbitrary order.
    /// </para>
    /// </remarks>
    public int ColumnOrder { get; set; }

    /// <summary>
    /// <para>
    /// The current <see cref="DateTimeOffset"/> value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have date/time value types.
    /// </para>
    /// </summary>
    public DateTimeOffset? DateTimeFilter { get; set; }

    /// <summary>
    /// <para>
    /// Whether the current <see cref="DateTimeFilter"/> refers to a date/time that all values
    /// should be equal to or before (rather than equal to or after).
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have date/time value types, or a non-<see langword="null"/>
    /// <see cref="DateTimeFilter"/>.
    /// </para>
    /// </summary>
    public bool DateTimeFilterIsBefore { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> this column is included in exported data even if it is hidden.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    public bool ExportHidden { get; set; }

    /// <summary>
    /// If the value is <see cref="IFormattable"/>, this is supplied as the format parameter of <see
    /// cref="IFormattable.ToString(string?, IFormatProvider?)"/>.
    /// </summary>
    /// <remarks>
    /// Can be specified for auto-generated columns with the <see
    /// cref="DisplayFormatAttribute.DataFormatString"/> property of a <see
    /// cref="DisplayFormatAttribute"/> on the property.
    /// </remarks>
    public string? Format { get; set; }

    /// <summary>
    /// If the value is <see cref="IFormattable"/>, this is supplied as the <c>formatProvider</c>
    /// parameter of <see cref="IFormattable.ToString(string?, IFormatProvider?)"/>.
    /// </summary>
    public IFormatProvider? FormatProvider { get; set; }

    /// <summary>
    /// Gets a unique id for this column.
    /// </summary>
    public Guid Id { get; }

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
    public bool InitiallySorted { get; set; }

    /// <summary>
    /// Gets whether this column represents boolean data.
    /// </summary>
    public bool IsBool { get; }

    /// <summary>
    /// Gets whether this column represents date/time data.
    /// </summary>
    public bool IsDateTime { get; }

    /// <summary>
    /// Gets whether this column was generated by reflection (vs. manually).
    /// </summary>
    public bool IsDefault { get; }

    /// <summary>
    /// Gets whether this column represents an enum data type.
    /// </summary>
    public bool IsEnum { get; }

    /// <summary>
    /// Gets whether this column represents a floating-point numeric data type.
    /// </summary>
    public bool IsFloat { get; }

    /// <summary>
    /// Gets whether this column represents a nullable data type.
    /// </summary>
    public bool IsNullable { get; }

    /// <summary>
    /// Gets whether this column represents a numeric data type.
    /// </summary>
    public bool IsNumeric { get; }

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
    public bool IsQuickFilter { get; set; }

    /// <summary>
    /// <para>
    /// Whether this column is currently displayed.
    /// </para>
    /// <para>
    /// Initially defaults to <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Can be specified for auto-generated columns with the <see
    /// cref="DisplayAttribute.AutoGenerateField"/> property of a <see cref="DisplayAttribute"/> on
    /// the property.
    /// </remarks>
    public bool IsShown { get; set; }

    /// <summary>
    /// Gets whether this column represents string data.
    /// </summary>
    public bool IsString { get; }

    /// <summary>
    /// <para>
    /// The header for this column.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> (and <see cref="LabelContent"/> is not provided), and the
    /// column's value is a simple property or field accessor, the name of the property is used
    /// (converted to a human-readable format).
    /// </para>
    /// <para>
    /// Note: this is still used even if <see cref="LabelContent"/> is set, to set the label for the
    /// column filter dialog, for input components in automatic edit dialogs, and for data labels in
    /// single-column layout.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Can be specified for auto-generated columns with the <see cref="DisplayAttribute.Name"/>
    /// property of a <see cref="DisplayAttribute"/> on the property.
    /// </remarks>
    public string? Label { get; set; }

    /// <summary>
    /// Header content for this column.
    /// </summary>
    public RenderFragment? LabelContent { get; set; }

    /// <summary>
    /// The name of the member (property or field) to which this column is bound (if any).
    /// </summary>
    public string? MemberName { get; }

    /// <summary>
    /// <para>
    /// The current numeric value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have numeric value types.
    /// </para>
    /// </summary>
    public double? NumberFilter { get; set; }

    /// <summary>
    /// <para>
    /// Gets whether this column is currently sorted in descending order.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    public bool SortDescending { get; set; }

    /// <summary>
    /// <para>
    /// The current string value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have <see cref="string"/> value types.
    /// </para>
    /// </summary>
    public string? TextFilter { get; set; }

    /// <summary>
    /// <para>
    /// Gets the data type of this column.
    /// </para>
    /// <para>
    /// If the type is nullable, returns the underlying type.
    /// </para>
    /// </summary>
    public Type GetBaseDataType();

    /// <summary>
    /// Gets whether this column can be edited.
    /// </summary>
    public bool GetCanEdit();

    /// <summary>
    /// Gets whether this column should be displayed.
    /// </summary>
    /// <returns>
    /// <see langword="true"/> if this column should be displayed; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public bool GetIsShown();

    /// <summary>
    /// Gets the current sortability of this column.
    /// </summary>
    /// <returns>
    /// <see langword="true"/> if this column can be sorted; otherwise <see langword="false"/>.
    /// </returns>
    public bool GetIsSortable();

    /// <summary>
    /// Gets a label for this column.
    /// </summary>
    public string? GetLabel();

    /// <summary>
    /// Sets this column's shown/hidden value.
    /// </summary>
    /// <param name="value">Whether the column should be displayed.</param>
    public void SetIsShown(bool value);
}
