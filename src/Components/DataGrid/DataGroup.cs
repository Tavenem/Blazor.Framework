using Tavenem.Blazor.Framework.InternalComponents.DataGrid;

namespace Tavenem.Blazor.Framework.Components.DataGrid;

internal class DataGroup<TDataItem>
{
    public int Count { get; set; }

    public bool IsExpanded { get; set; }

    public object? Key { get; set; }

    public List<Row<TDataItem>>? Rows { get; set; }
}
