namespace Tavenem.Blazor.Framework.Components.DataGrid;

/// <summary>
/// A rich data grid for displaying collections of items in rows and columns.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
public interface IDataGrid<TDataItem>
{
    /// <summary>
    /// Adds a new column to this grid.
    /// </summary>
    /// <param name="column">The column to add.</param>
    public void AddColumn(IColumn<TDataItem> column);

    /// <summary>
    /// Notifies the grid that its state has been changed externally.
    /// </summary>
    public void InvokeStateChange();

    /// <summary>
    /// Loads the current set of asynchronous data.
    /// </summary>
    public Task LoadItemsAsync();

    /// <summary>
    /// Called internally.
    /// </summary>
    public Task OnColumnSortedAsync(IColumn<TDataItem> column);

    /// <summary>
    /// Removes a column from this grid.
    /// </summary>
    /// <param name="column">The column to remove.</param>
    public void RemoveColumn(IColumn<TDataItem> column);
}
