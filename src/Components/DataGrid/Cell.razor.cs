using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.InternalComponents.DataGrid;

/// <summary>
/// Represents a cell in a <see cref="DataGrid{TDataItem}"/>.
/// </summary>
/// <typeparam name="TDataItem">
/// The type of data item.
/// </typeparam>
public partial class Cell<TDataItem> where TDataItem : new()
{
    /// <summary>
    /// The column represented by this cell.
    /// </summary>
    [Parameter] public Column<TDataItem>? Column { get; set; }

    /// <summary>
    /// Whether this cell is being edited inline.
    /// </summary>
    [Parameter] public bool Editing { get; set; }

    /// <summary>
    /// The row represented by this cell.
    /// </summary>
    [Parameter] public Row<TDataItem>? Row { get; set; }
}