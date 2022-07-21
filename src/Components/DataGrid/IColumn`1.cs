using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.DataGrid;

/// <summary>
/// A column for a <see cref="DataGrid{TDataItem}"/>
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
public interface IColumn<TDataItem> : IColumn
{
    /// <summary>
    /// An optional function which gets a CSS class for this column for a given data item (row).
    /// </summary>
    public Func<TDataItem, string?>? CellClass { get; set; }

    /// <summary>
    /// <para>
    /// An optional template which displays the content of this column in a cell.
    /// </para>
    /// <para>
    /// It receives the full data item (row value) as its context parameter.
    /// </para>
    /// <para>
    /// If omitted, the cell displays its value.
    /// </para>
    /// </summary>
    public RenderFragment<TDataItem>? ChildContent { get; set; }

    /// <summary>
    /// <para>
    /// Optional content to display when editing a cell for this column.
    /// </para>
    /// <para>
    /// This will be displayed in the cell during inline edit mode, and will also be inserted into
    /// the automatic edit dialog. It should usually be a single input component with its value
    /// bound to the displayed property.
    /// </para>
    /// </summary>
    public RenderFragment<TDataItem>? EditContent { get; set; }

    /// <summary>
    /// <para>
    /// Optional content for the footer of this column.
    /// </para>
    /// <para>
    /// Receives the entire set of current items as its context parameter. Note that this may not be
    /// all data items, if data is loaded from an external source, or is in a group.
    /// </para>
    /// </summary>
    public RenderFragment<IEnumerable<TDataItem>>? FooterContent { get; set; }

    /// <summary>
    /// Gets the value of a cell in this column for a given data item (row), as an <see
    /// cref="object"/>.
    /// </summary>
    public object? GetCellObjectValue(TDataItem item);

    /// <summary>
    /// Sets the value of a cell in this column to a given value.
    /// </summary>
    /// <param name="item">The data item (row) whose value should be set.</param>
    /// <param name="value">The value to assign.</param>
    public void SetCellObjectValue(TDataItem item, object? value);

    /// <summary>
    /// Validates the content of a cell.
    /// </summary>
    /// <param name="value">The value in the cell.</param>
    /// <param name="item">The data item (row).</param>
    /// <returns>An enumeration of validation messages.</returns>
    public IAsyncEnumerable<string> ValidateObject(object? value, TDataItem item);
}
