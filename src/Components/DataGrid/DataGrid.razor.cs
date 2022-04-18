using Microsoft.AspNetCore.Components;
using System.Reflection;
using Tavenem.Blazor.Framework.Components.DataGrid;
using Tavenem.Blazor.Framework.InternalComponents.DataGrid;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Invoked when a <see cref="DataGrid{TDataItem}"/> loads items.
/// </summary>
/// <typeparam name="TDataItem">
/// The type of data item.
/// </typeparam>
/// <param name="count">The number of items requested.</param>
/// <param name="offset">The number of items to skip.</param>
/// <param name="columns">
/// <para>
/// A list of property names which should be included.
/// </para>
/// <para>
/// If omitted the results may contain all properties, or a predetermined selection of properties.
/// </para>
/// </param>
/// <param name="sortBy">
/// <para>
/// A property by which the data should be sorted.
/// </para>
/// <para>
/// If omitted the results may be unsorted, or sorted by a predetermined property.
/// </para>
/// </param>
public delegate Task<DataPage<TDataItem>> GetDataItemsDelegate<TDataItem>(int count, int offset, string[]? columns, SortInfo? sortBy);

public partial class DataGrid<TDataItem> where TDataItem : new()
{
    private readonly List<Column<TDataItem>> _columns = new();

    private bool _isColumnFilterDialogVisible;

    /// <summary>
    /// <para>
    /// When <see langword="true"/> an add button appears in the header which shows the edit dialog,
    /// and invokes the <see cref="ItemAdded"/> callback if the dialog is submitted with valid data.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowAdd { get; set; }

    /// <summary>
    /// <para>
    /// Whether all rows have expanded content.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ExpandedContent"/> is <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllRowsExpand { get; set; }

    /// <summary>
    /// <para>
    /// The breakpoint below which the grid displays in a single column.
    /// </para>
    /// <para>
    /// Default is <see cref="Breakpoint.Sm"/>.
    /// </para>
    /// </summary>
    [Parameter] public Breakpoint Breakpoint { get; set; } = Breakpoint.Sm;

    /// <summary>
    /// <para>
    /// A component to use as the edit dialog for a row.
    /// </para>
    /// <para>
    /// If a component is provided inline editing is disabled. Initiating a row edit will display
    /// this component as a dialog.
    /// </para>
    /// </summary>
    [Parameter] public ComponentBase? EditDialog { get; set; }

    /// <summary>
    /// This optional content is displayed when a row is expanded.
    /// </summary>
    [Parameter] public RenderFragment<TDataItem>? ExpandedContent { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the grouping value of a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, items are not grouped.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, object>? GroupBy { get; set; }

    /// <summary>
    /// <para>
    /// Optional content for the header of a grouping.
    /// </para>
    /// <para>
    /// Receives the grouping's shared key as its context parameter.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<object?>? GroupContent { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the labels of groupings based on their shared key.
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, the result of invoking <see cref="object.ToString"/> on each
    /// group's key is used.
    /// </para>
    /// </summary>
    [Parameter] public Func<object?, string>? GroupLabel { get; set; }

    /// <summary>
    /// <para>
    /// This optional function is used to determine which rows have expanded content.
    /// </para>
    /// <para>
    /// Alternatively, the <see cref="AllRowsExpand"/> property can be set to <see langword="true"/>
    /// to bypass case-by-case invocation of this function.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ExpandedContent"/> is <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, bool>? HasExpandedContent { get; set; }

    /// <summary>
    /// Whether the table is currently loading data via <see cref="LoadItems"/>.
    /// </summary>
    public bool IsLoading { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when a new item is added.
    /// </para>
    /// <para>
    /// This can only be invoked if <see cref="AllowAdd"/> has been set to <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public Action<TDataItem>? ItemAdded { get; set; }

    /// <summary>
    /// <para>
    /// The current set of items.
    /// </para>
    /// <para>
    /// Note that this may not represent the complete set of data, if the data is retrieved via <see
    /// cref="LoadItems"/>.
    /// </para>
    /// </summary>
    public List<TDataItem> Items { get; set; } = new();

    /// <summary>
    /// A function to load data items asynchronously.
    /// </summary>
    [Parameter] public GetDataItemsDelegate<TDataItem>? LoadItems { get; set; }

    /// <summary>
    /// <para>
    /// Optional content displayed when there are no data items (rows) to display.
    /// </para>
    /// <para>
    /// If not provided, "No Data" is displayed.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment? NoDataContent { get; set; }

    /// <summary>
    /// <para>
    /// If provided, this callback is invoked whenever the user expands a row.
    /// </para>
    /// <para>
    /// The expanded content area shows a loading spinner until this callback completes, unless it
    /// has previously been invoked. If it has been invoked before, a linear progress indicator
    /// shows that additional loading is taking place, but any existing content remains displayed.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ExpandedContent"/> is <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<TDataItem>? OnRowExpanded { get; set; }

    /// <summary>
    /// An optional function which gets a CSS class for a given data item (row).
    /// </summary>
    [Parameter] public Func<TDataItem, string?>? RowClass { get; set; }

    /// <summary>
    /// <para>
    /// The maximum number of items to show on each page.
    /// </para>
    /// <para>
    /// Default is 10.
    /// </para>
    /// <para>
    /// Note: assigning a value which is not included in <see cref="RowsPerPageOptions"/> means that
    /// users will not be able to revert to the setting after changing it.
    /// </para>
    /// </summary>
    [Parameter] public ushort RowsPerPage { get; set; } = 10;

    /// <summary>
    /// <para>
    /// The options available for <see cref="RowsPerPage"/>.
    /// </para>
    /// <para>
    /// Defaults to 10, 25, 50, and 100.
    /// </para>
    /// </summary>
    [Parameter] public ushort[] RowsPerPageOptions { get; set; } = new ushort[] { 10, 25, 50, 100 };

    /// <summary>
    /// Any CSS classes to assign to the table element.
    /// </summary>
    [Parameter] public string? TableClass { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// Optional content to display in the header.
    /// </summary>
    [Parameter] public RenderFragment? ToolbarContent { get; set; }

    /// <inheritdoc />
    protected override string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .AddStyle("width", "100%")
        .AddStyle("overflow", "auto")
        .ToString();

    /// <summary>
    /// The final value assigned to the table element's class attribute, including component values.
    /// </summary>
    protected string? TableCssClass => new CssBuilder(TableClass)
        .Add("table datagrid")
        .Add(ThemeColor.ToCSS())
        .Add($"table-{Breakpoint.ToCSS()}", Breakpoint != Breakpoint.None)
        .ToString();

    private List<DataGroup<TDataItem>>? DataGroups { get; set; }

    private DataPage<TDataItem>? CurrentDataPage { get; set; }

    private IEnumerable<TDataItem> CurrentItems
    {
        get
        {
            if (LoadItems is not null)
            {
                return Items;
            }

            IEnumerable<TDataItem> items = Items;
            foreach (var column in _columns)
            {
                if (column.FilterExpression is not null
                    && !string.IsNullOrEmpty(column.CurrentFilter))
                {
                    items = items.Where(x => column.FilterExpression.Invoke(x, column.CurrentFilter));
                }
            }

            if (SortColumn is not null && items.Any())
            {
                var sortBy = SortColumn.ActualSortBy;
                if (sortBy is not null)
                {
                    return SortColumn.SortDescending
                        ? items.OrderByDescending(sortBy)
                        : items.OrderBy(sortBy);
                }
            }

            return items;
        }
    }

    private ulong CurrentPage { get; set; }

    private IEnumerable<TDataItem> CurrentPageItems => CurrentItems
        .Skip((int)Offset)
        .Take(RowsPerPage);

    private Form? EditForm { get; set; }

    private Column<TDataItem>? EditingFilterColumn { get; set; }

    private Row<TDataItem>? EditingRow { get; set; }

    private Column<TDataItem>? GroupColumn { get; set; }

    private bool HasRowExpansion
        => ExpandedContent is not null && (AllRowsExpand || HasExpandedContent is not null);

    private string? LoadingClass => new CssBuilder("small")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private ulong Offset { get; set; }

    private ulong? PageCount { get; set; }

    private List<Row<TDataItem>> Rows { get; set; } = new();

    private Column<TDataItem>? SortColumn { get; set; }

    private bool UseEditDialog => EditDialog is not null || _columns.Any(x => !x.ActualIsShown);

    /// <inheritdoc/>
    protected override void OnInitialized()
    {
        if (_columns.Count == 0)
        {
            var dataType = typeof(TDataItem);
            dataType = Nullable.GetUnderlyingType(dataType) ?? dataType;
            foreach (var property in dataType
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(x => x.CanRead))
            {
                _columns.Add(new Column<TDataItem>
                {
                    ActualProperty = property,
                    IsDefault = true,
                });
            }
        }
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        await base.SetParametersAsync(parameters);

        if (parameters.TryGetValue<Func<TDataItem, object>?>(nameof(RowsPerPage), out _))
        {
            await OnChangeRowsPerPage(RowsPerPage);
        }
        else if (parameters.TryGetValue<Func<TDataItem, object>?>(nameof(GroupBy), out _)
            || parameters.TryGetValue<Func<TDataItem, object>?>(nameof(Items), out _))
        {
            Regroup();
        }
    }

    internal void AddColumn(Column<TDataItem> column)
    {
        _columns.RemoveAll(x => x.IsDefault && x.ActualProperty == column.ActualProperty);
        _columns.Add(column);
    }

    internal void RemoveColumn(Column<TDataItem> column) => _columns.Remove(column);

    internal void InvokeStateChange() => StateHasChanged();

    private static string? GetGroupExpandClass(DataGroup<TDataItem> group) => new CssBuilder("expand-row")
        .Add("open", group.IsExpanded)
        .ToString();

    private static string? GetRowExpandClass(Row<TDataItem> row) => new CssBuilder("expand-row")
        .Add("open", row.IsExpanded)
        .ToString();

    private async Task LoadItemsAsync()
    {
        throw new NotImplementedException();

        Regroup();
    }

    private async Task OnChangeRowsPerPage(ushort value)
    {
        if (RowsPerPage == value)
        {
            return;
        }

        var decrease = value < RowsPerPage;

        RowsPerPage = value;

        CurrentPage = Offset / value;
        if (Offset % value == 0)
        {
            CurrentPage--;
        }

        if (LoadItems is null)
        {
            PageCount = (ulong)Items.Count / value;
            if (Items.Count % value != 0)
            {
                PageCount++;
            }

            Regroup();
        }
        else
        {
            if (CurrentDataPage?.TotalCount.HasValue == true)
            {
                PageCount = CurrentDataPage.TotalCount.Value / value;
                if (CurrentDataPage.TotalCount.Value % value != 0)
                {
                    PageCount++;
                }
            }

            if (decrease)
            {
                Items = Items.Take(RowsPerPage).ToList();
                Regroup();
            }
            else
            {
                await LoadItemsAsync();
            }
        }
    }

    private Task OnColumnSortAsync(Column<TDataItem> column)
    {
        if (column == SortColumn)
        {
            column.SortDescending = !column.SortDescending;
        }
        else
        {
            SortColumn = column;
            column.SortDescending = false;
        }
        if (LoadItems is not null)
        {
            return LoadItemsAsync();
        }
        return Task.CompletedTask;
    }

    private Task OnFilterChangedAsync(Column<TDataItem> column, string? value)
    {
        column.CurrentFilter = value;
        if (LoadItems is not null)
        {
            return LoadItemsAsync();
        }
        return Task.CompletedTask;
    }

    private async Task OnLastPageAsync()
    {
        if (LoadItems is null)
        {
            CurrentPage = PageCount > 0
                ? PageCount.Value - 1
                : 0;
            Offset = CurrentPage * RowsPerPage;
        }
        else if (CurrentDataPage?.HasMore != false)
        {
            if (CurrentDataPage!.TotalCount.HasValue)
            {
                CurrentPage = PageCount > 0
                    ? PageCount.Value - 1
                    : 0;
                Offset = CurrentPage * RowsPerPage;
            }
            else if (CurrentDataPage?.HasMore != false)
            {
                CurrentPage++;
                Offset += RowsPerPage;
            }
            await LoadItemsAsync();
        }
    }

    private async Task OnNextPageAsync()
    {
        if (LoadItems is null)
        {
            Offset += RowsPerPage;
        }
        else if (CurrentDataPage?.HasMore != false)
        {
            Offset += RowsPerPage;
            await LoadItemsAsync();
        }
    }

    private async Task OnPageChangedAsync(ulong value)
    {
        CurrentPage = value;
        Offset = CurrentPage * RowsPerPage;
        if (LoadItems is not null)
        {
            await LoadItemsAsync();
        }
    }

    private async Task OnPreviousPageAsync()
    {
        if (Offset <= 0)
        {
            return;
        }

        Offset = Math.Max(0, Offset - RowsPerPage);
        if (LoadItems is not null)
        {
            await LoadItemsAsync();
        }
    }

    private void OnRowClick(Row<TDataItem> row) => throw new NotImplementedException();

    private void OnShowExportDialog() => throw new NotImplementedException();

    private void OnSetAllColumnsVisiblity(bool value)
    {
        foreach (var column in _columns.Where(x => x.CanHide))
        {
            column.ActualIsShown = value;
        }
    }

    private void Regroup()
    {
        if (GroupBy is null)
        {
            DataGroups = null;
            var newRows = CurrentPageItems
                .Select(x => new Row<TDataItem> { Item = x })
                .ToList();
            foreach (var row in newRows)
            {
                var match = Rows?.Find(x => x.Item?.Equals(row.Item) == true);
                if (match is not null)
                {
                    row.IsExpanded = match.IsExpanded;
                }
            }
            Rows = newRows;
            return;
        }

        Rows.Clear();

        var newGroups = new List<DataGroup<TDataItem>>();
        var totalCount = 0;
        foreach (var group in CurrentPageItems.GroupBy(GroupBy))
        {
            var max = RowsPerPage - totalCount;
            var items = group
                .Select(x => new Row<TDataItem> { Item = x })
                .ToList();
            var count = Math.Min(items.Count, max);
            newGroups.Add(new()
            {
                Count = count,
                Rows = items.Count <= count
                    ? items
                    : items.Take(count).ToList(),
                Key = group.Key,
            });
            totalCount += count;
            if (totalCount >= RowsPerPage)
            {
                break;
            }
        }

        if (DataGroups is not null)
        {
            foreach (var group in DataGroups)
            {
                var match = newGroups.Find(x => x.Key?.Equals(group.Key) == true);
                if (match is not null)
                {
                    match.IsExpanded = group.IsExpanded;
                    foreach (var row in match.Rows!)
                    {
                        var groupRow = group.Rows?.Find(x => x.Item?.Equals(row.Item) == true);
                        if (groupRow is not null)
                        {
                            row.IsExpanded = groupRow.IsExpanded;
                        }
                    }
                }
            }
        }
        DataGroups = newGroups;
    }
}