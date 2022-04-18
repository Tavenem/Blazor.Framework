namespace Tavenem.Blazor.Framework.InternalComponents.DataGrid;

/// <summary>
/// Represents a row in a <see cref="DataGrid{TDataItem}"/>.
/// </summary>
/// <typeparam name="TDataItem">
/// The type of data item.
/// </typeparam>
public class Row<TDataItem>
{
    public bool IsExpanded { get; set; }

    public TDataItem? Item { get; set; }
}
