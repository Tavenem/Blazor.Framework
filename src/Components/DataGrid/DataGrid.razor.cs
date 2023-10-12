using ClosedXML.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Reflection;
using System.Text;
using Tavenem.Blazor.Framework.Components.DataGrid;
using Tavenem.Blazor.Framework.Components.DataGrid.InternalDialogs;
using Tavenem.Blazor.Framework.InternalComponents.DataGrid;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A rich data grid for displaying collections of items in rows and columns.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
public partial class DataGrid<[DynamicallyAccessedMembers(
    DynamicallyAccessedMemberTypes.PublicParameterlessConstructor
    | DynamicallyAccessedMemberTypes.PublicFields
    | DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem>
    : IDataGrid<TDataItem>, IAsyncDisposable
{
    private const string GroupExpansionQueryParamName = "tfdg_exg";
    private const string FilterQueryParamName = "tfdg_filter";
    private const string HtmlTemplate = """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8"/>
        <title>{0}</title>
        </head>
        <body style="margin:0;padding:0">
        {1}
        <table style="padding:2rem 2rem 0 2rem;width:100%">
        <thead>
        <tr>
        {2}
        </tbody>
        </table>
        </body>
        </html>
        """;
    private const string OffsetQueryParamName = "tfdg_offset";
    private const string RowExpansionQueryParamName = "tfdg_exr";
    private const string RowsPerPageQueryParamName = "tfdg_rows";
    private const string SortQueryParamName = "tfdg_sort";

    private readonly HashSet<int> _rowCurrentExpansion = [];
    private readonly HashSet<int> _rowExpansion = [];
    private readonly HashSet<string> _groupExpansion = [];
    private readonly List<string> _objectUrls = [];
    private readonly List<Guid> _sortOrder = [];

    private bool _disposedValue;
    private bool _nullGroupExpanded;

    /// <summary>
    /// <para>
    /// The type of a component to use as the add dialog.
    /// </para>
    /// <para>
    /// Must descend from <see cref="ComponentBase"/>.
    /// </para>
    /// <para>
    /// When omitted, the <see cref="EditDialog"/> is used, if <see cref="AllowAdd"/> is <see
    /// langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public Type? AddDialog { get; set; }

    /// <summary>
    /// <para>
    /// If provided, this callback is used to fetch the parameters used for the <see
    /// cref="AddDialog"/>.
    /// </para>
    /// <para>
    /// The dialog also receives a parameter named "Item" which contains the edited item, unless the
    /// dialog is being used to create a new item. This parameter is added to the result of this
    /// callback, if it exists, or to a new <see cref="DialogParameters"/> instance if not.
    /// </para>
    /// </summary>
    [Parameter] public Func<Task<DialogParameters>>? AddDialogParameters { get; set; }

    /// <summary>
    /// If provided, these options are used to configure the <see cref="AddDialog"/>.
    /// </summary>
    [Parameter] public DialogOptions? AddDialogOptions { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> an add button appears in the header.
    /// </para>
    /// <para>
    /// If a custom <see cref="EditDialog"/> has been provided, that dialog is displayed. It is up
    /// to the implementer to perform appropriate actions in the custom dialog.
    /// </para>
    /// <para>
    /// If no custom dialog is present, the default edit dialog is displayed, and the <see
    /// cref="ItemAdded"/> function is invoked if the dialog is submitted with valid data.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowAdd { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> a delete button appears at the beginning of each row.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowDelete { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> an edit button appears at the beginning of each row.
    /// </para>
    /// <para>
    /// If a custom <see cref="EditDialog"/> has been provided, that dialog is displayed. It is up
    /// to the implementer to perform appropriate actions in the custom dialog.
    /// </para>
    /// <para>
    /// If no custom dialog is present, and <see cref="AllowInlineEdit"/> is <see langword="true"/>,
    /// and all columns are currently shown, inline editing is enabled for the row. The <see
    /// cref="ItemSaved"/> function is invoked if the row's save button is activated with valid data
    /// in all columns.
    /// </para>
    /// <para>
    /// If any columns are currently hidden, the default edit dialog is displayed, and the <see
    /// cref="ItemSaved"/> function is invoked if the dialog is submitted with valid data.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowEdit { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> an export button appears in the header which displays an export
    /// dialog.
    /// </para>
    /// <para>
    /// Exporting to CSV, Excel, and HTML formats is supported by default. These formats include the
    /// current set of visible columns, plus any columns with <see cref="IColumn.ExportHidden"/> set
    /// to <see langword="true"/>. All data which matches the current set of filters is included, in
    /// the curent sort order. If <see cref="LoadItems"/> is not <see langword="null"/> a new call
    /// is made which attempts to fetch all matching items, rather than just the items for the
    /// current page.
    /// </para>
    /// <para>
    /// Exporting to PDF is also supported if the <see cref="PdfExport"/> property is assigned.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowExport { get; set; } = true;

    /// <summary>
    /// <para>
    /// When this property and <see cref="AllowEdit"/> are both <see langword="true"/>, and <see
    /// cref="EditDialog"/> is <see langword="null"/>, and when all columns are currently shown,
    /// inline editing is enabled. The <see cref="ItemAdded"/> function is invoked if the row's save
    /// button is activated with valid data in all columns.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowInlineEdit { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/>, if any column has <see cref="IColumn.IsQuickFilter"/> set to
    /// <see langword="true"/>, a universal search box will appear in the data table header and will
    /// filter the data by items which have each (space delimited) term in the query in at least one
    /// quick filter column.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowSearch { get; set; } = true;

    /// <summary>
    /// Whether this grid is displaying any items.
    /// </summary>
    public bool AnyItems => LoadItems is null
        ? CurrentItems.Any()
        : CurrentDataPage?.Items.Count > 0;

    /// <summary>
    /// Whether this grid would be displaying any items without filters.
    /// </summary>
    public bool AnyUnfilteredItems => LoadItems is null
        ? Items.Count > 0
        : CurrentDataPage?.TotalCount > 0;

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
    /// Invoked when the current page has changed.
    /// </summary>
    [Parameter] public EventCallback CurrentPageChanged { get; set; }

    /// <summary>
    /// <para>
    /// The type of a component to use as the edit dialog for a row.
    /// </para>
    /// <para>
    /// Must descend from <see cref="ComponentBase"/>.
    /// </para>
    /// <para>
    /// Should have an optional (i.e. nullable) parameter of type <typeparamref name="TDataItem"/>
    /// with the name "Item" which receives the item to be edited. This parameter is expected to be
    /// <see langword="null"/> when the dialog is used to create a new item (if <see
    /// cref="AllowAdd"/> is <see langword="true"/>).
    /// </para>
    /// <para>
    /// If a component is provided, inline editing is disabled. Initiating a row edit will display
    /// this component as a dialog.
    /// </para>
    /// </summary>
    [Parameter] public Type? EditDialog { get; set; }

    /// <summary>
    /// <para>
    /// If provided, this callback is used to fetch the parameters used for the <see
    /// cref="EditDialog"/>.
    /// </para>
    /// <para>
    /// The dialog also receives a parameter named "Item" which contains the edited item, unless the
    /// dialog is being used to create a new item. This parameter is added to the result of this
    /// callback, if it exists, or to a new <see cref="DialogParameters"/> instance if not.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem?, Task<DialogParameters>>? EditDialogParameters { get; set; }

    /// <summary>
    /// If provided, these options are used to configure the <see cref="EditDialog"/>.
    /// </summary>
    [Parameter] public DialogOptions? EditDialogOptions { get; set; }

    /// <summary>
    /// This optional content is displayed when a row is expanded.
    /// </summary>
    [Parameter] public RenderFragment<TDataItem>? ExpandedContent { get; set; }

    /// <summary>
    /// Any column filtering options currently set for data grids.
    /// </summary>
    [SupplyParameterFromQuery(Name = FilterQueryParamName), Parameter]
    public string[]? FilterQuery { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the grouping value of a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, items are not grouped.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, string>? GroupBy { get; set; }

    /// <summary>
    /// <para>
    /// Optional content for the header of a grouping.
    /// </para>
    /// <para>
    /// Receives the grouping's shared key as its context parameter.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<string>? GroupContent { get; set; }

    /// <summary>
    /// Any group expansion options currently set for data grids.
    /// </summary>
    [SupplyParameterFromQuery(Name = GroupExpansionQueryParamName), Parameter]
    public string[]? GroupExpansionQuery { get; set; }

    /// <summary>
    /// <para>
    /// This optional function is used to determine which rows have expanded content.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> and <see cref="ExpandedContent"/> is not <see
    /// langword="null"/>, it is assumed that all rows can expand.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ExpandedContent"/> is <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, bool>? HasExpandedContent { get; set; }

    /// <summary>
    /// Optional content to display in the header.
    /// </summary>
    [Parameter] public RenderFragment? HeaderContent { get; set; }

    /// <summary>
    /// <para>
    /// Optional content to include as a header in HTML-format exports.
    /// </para>
    /// <para>
    /// Can include HTML markupm, but take care to sanitize any user-provided content.
    /// </para>
    /// </summary>
    [Parameter] public string? HtmlHeaderContent { get; set; }

    /// <summary>
    /// The HTML id of this element.
    /// </summary>
    /// <remarks>
    /// Initialized to a GUID if not set explicitly.
    /// </remarks>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// Whether the table is currently loading data via <see cref="LoadItems"/>.
    /// </summary>
    public bool IsLoading { get; protected set; }

    /// <summary>
    /// <para>
    /// Invoked when a new item is added.
    /// </para>
    /// <para>
    /// Should return <see langword="true"/> if the item is added successfully, and <see
    /// langword="false"/> if not.
    /// </para>
    /// <para>
    /// If the item should simply be added to a list associated with the <see cref="Items"/>
    /// property, this function can be omitted.
    /// </para>
    /// <para>
    /// This can only be invoked if <see cref="AllowAdd"/> has been set to <see langword="true"/>.
    /// </para>
    /// <para>
    /// Note: when <see cref="LoadItems"/> is <see langword="null"/> the newly added item is added
    /// to the <see cref="Items"/> list. The item will appear in its proper place in the grid. When
    /// <see cref="LoadItems"/> <em>is</em> set, however, the newly added item is simply added to
    /// the current page, to avoid a potentially expensive call.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, Task<bool>>? ItemAdded { get; set; }

    /// <summary>
    /// <para>
    /// Raised when an item has been deleted.
    /// </para>
    /// <para>
    /// Should return <see langword="true"/> if the item is removed successfully, and <see
    /// langword="false"/> if not.
    /// </para>
    /// <para>
    /// If the item should simply be removed from a list associated with the <see cref="Items"/>
    /// property, this function can be omitted.
    /// </para>
    /// <para>
    /// This can only be invoked if <see cref="AllowDelete"/> has been set to <see
    /// langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, Task<bool>>? ItemDeleted { get; set; }

    /// <summary>
    /// <para>
    /// The current set of items.
    /// </para>
    /// <para>
    /// Note that this may not represent the complete set of data, if the data is retrieved via <see
    /// cref="LoadItems"/>.
    /// </para>
    /// </summary>
    [Parameter] public List<TDataItem> Items { get; set; } = [];

    /// <summary>
    /// <para>
    /// Raised when an item has been edited and the changes are being committed.
    /// </para>
    /// <para>
    /// Should return <see langword="true"/> if the item is updated successfully, and <see
    /// langword="false"/> if not.
    /// </para>
    /// <para>
    /// If the item should simply be modified in a list associated with the <see cref="Items"/>
    /// property, this function can be omitted.
    /// </para>
    /// <para>
    /// This can only be invoked if <see cref="AllowEdit"/> has been set to <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, Task<bool>>? ItemSaved { get; set; }

    /// <summary>
    /// A function to load data items asynchronously.
    /// </summary>
    [Parameter] public Func<DataGridRequest, Task<DataPage<TDataItem>>>? LoadItems { get; set; }

    /// <summary>
    /// <para>
    /// Sets the max-height CSS style for the table.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxHeight { get; set; }

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
    /// The offset options currently set for data grids.
    /// </summary>
    [SupplyParameterFromQuery(Name = OffsetQueryParamName), Parameter]
    public string[]? OffsetQuery { get; set; }

    /// <summary>
    /// <para>
    /// If provided, an option to export a PDF is available (as well as CSV or Excel, which are
    /// built-in).
    /// </para>
    /// <para>
    /// The function should return a <see cref="Task{TResult}"/> which resolves to a <see
    /// cref="Stream"/> containing the PDF bytes.
    /// </para>
    /// </summary>
    [Parameter] public Func<DataGridRequest, Task<Stream>>? PdfExport { get; set; }

    /// <summary>
    /// If any column has <see cref="IColumn.IsQuickFilter"/> set to <see langword="true"/>, the
    /// data will include only items which have each (space delimited) term in this value in at
    /// least one quick filter column.
    /// </summary>
    [Parameter] public string? QuickFilter { get; set; }

    /// <summary>
    /// An optional function which gets a CSS class for a given data item (row).
    /// </summary>
    [Parameter] public Func<TDataItem, string?>? RowClass { get; set; }

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
    [Parameter] public EventCallback<TDataItem> RowExpanded { get; set; }

    /// <summary>
    /// The row expansion options currently set for data grids.
    /// </summary>
    [SupplyParameterFromQuery(Name = RowExpansionQueryParamName), Parameter]
    public string[]? RowExpansionQuery { get; set; }

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
    [Parameter] public ushort[] RowsPerPageOptions { get; set; } = [10, 25, 50, 100];

    /// <summary>
    /// The rows per page options currently set for data grids.
    /// </summary>
    [SupplyParameterFromQuery(Name = RowsPerPageQueryParamName), Parameter]
    public string[]? RowsPerPageQuery { get; set; }

    /// <summary>
    /// <para>
    /// The currently-selected item.
    /// </para>
    /// <para>
    /// If <see cref="SelectionType"/> is <see cref="SelectionType.None"/> (the
    /// default) this will always be <see langword="null"/>.
    /// </para>
    /// <para>
    /// If <see cref="SelectionType"/> is <see cref="SelectionType.Multiple"/>
    /// this will contain an arbitrary item among the selection.
    /// </para>
    /// </summary>
    [Parameter] public TDataItem? SelectedItem { get; set; }

    /// <summary>
    /// Invoked when <see cref="SelectedItem"/> changes.
    /// </summary>
    [Parameter] public EventCallback<TDataItem?> SelectedItemChanged { get; set; }

    /// <summary>
    /// Raised when the <see cref="SelectedItem"/> is changing.
    /// </summary>
    public event EventHandler<TDataItem?>? SelectedItemChanging;

    /// <summary>
    /// <para>
    /// The currently-selected items.
    /// </para>
    /// <para>
    /// If <see cref="SelectionType"/> is <see cref="SelectionType.None"/> (the
    /// default) this will always be empty.
    /// </para>
    /// <para>
    /// If <see cref="SelectionType"/> is <see cref="SelectionType.Single"/>
    /// this will always contain only one item.
    /// </para>
    /// </summary>
    [Parameter] public List<TDataItem> SelectedItems { get; set; } = [];

    /// <summary>
    /// Invoked when <see cref="SelectedItems"/> changes.
    /// </summary>
    [Parameter] public EventCallback<List<TDataItem>> SelectedItemsChanged { get; set; }

    /// <summary>
    /// The type of item selection from this data grid.
    /// </summary>
    [Parameter] public SelectionType SelectionType { get; set; }

    /// <summary>
    /// Whether to permit the user to control the number of rows per page.
    /// </summary>
    [Parameter] public bool ShowRowsPerPage { get; set; }

    /// <summary>
    /// The sort options currently set for data grids.
    /// </summary>
    [SupplyParameterFromQuery(Name = SortQueryParamName), Parameter]
    public string[]? SortQuery { get; set; }

    /// <summary>
    /// Any CSS classes to assign to the table element.
    /// </summary>
    [Parameter] public string? TableClass { get; set; }

    /// <summary>
    /// An optional title to display in the header.
    /// </summary>
    [Parameter] public string? Title { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    private readonly List<IColumn<TDataItem>> _columns = [];
    internal IEnumerable<IColumn<TDataItem>> Columns => _columns;

    internal Row<TDataItem>? EditingRow { get; set; }

    internal bool Interactive { get; set; }

    /// <summary>
    /// The request object that reflects the current state of this grid.
    /// </summary>
    internal DataGridRequest Request { get; set; }

    internal Form? TableEditForm { get; set; }

    /// <inheritdoc />
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("datagrid")
        .ToString();

    /// <summary>
    /// The final value assigned to the table element's class attribute, including component values.
    /// </summary>
    protected string? TableCssClass => new CssBuilder(TableClass)
        .Add("table sticky-header sticky-footer")
        .Add(ThemeColor.ToCSS())
        .Add($"table-{Breakpoint.ToCSS()}", Breakpoint != Breakpoint.None)
        .ToString();

    private List<IGrouping<string, TDataItem>>? DataGroups { get; set; }

    private DataPage<TDataItem>? CurrentDataPage { get; set; }

    private IEnumerable<TDataItem> CurrentItems
    {
        get
        {
            if (LoadItems is not null)
            {
                return CurrentDataPage?.Items ?? Enumerable.Empty<TDataItem>();
            }

            IEnumerable<TDataItem> items = Items;
            foreach (var column in _columns
                .Where(x => x.GetIsShown()))
            {
                items = items.Where(column.FilterMatches);
            }

            var quickFilter = QuickFilter?.Trim('"').Trim();
            if (!string.IsNullOrEmpty(QuickFilter))
            {
                items = items.Where(x => _columns
                    .Where(y => y.IsString && y.IsQuickFilter)
                    .Any(y => y.FilterMatches(x, QuickFilter)));
            }

            if (_sortOrder.Count > 0)
            {
                IOrderedEnumerable<TDataItem>? sorted = null;
                foreach (var id in _sortOrder)
                {
                    var column = _columns.Find(x => x.Id == id);
                    if (column?.GetIsShown() != true
                        && column?.InitiallySorted != true)
                    {
                        continue;
                    }
                    if (sorted is null)
                    {
                        sorted = column.SortDescending
                            ? items.OrderByDescending(column.GetCellObjectValue)
                            : items.OrderBy(column.GetCellObjectValue);
                    }
                    else
                    {
                        sorted = column.SortDescending
                            ? sorted.ThenByDescending(column.GetCellObjectValue)
                            : sorted.ThenBy(column.GetCellObjectValue);
                    }
                }
                if (sorted is not null)
                {
                    items = sorted;
                }
            }

            return items;
        }
    }

    private ulong CurrentPage { get; set; }

    private IEnumerable<TDataItem> CurrentPageItems => LoadItems is not null
        ? CurrentDataPage?.Items ?? Enumerable.Empty<TDataItem>()
        : CurrentItems
            .Skip((int)Offset)
            .Take(RowsPerPage);

    private int Debounce => LoadItems is null ? 500 : 1000;

    private TDataItem? DeleteItem { get; set; }

    [Inject] private DialogService DialogService { get; set; } = default!;

    private string? FormStyle => new CssBuilder("overflow:auto")
        .AddStyle("max-height", MaxHeight)
        .ToString();

    private bool IsAdding { get; set; }

    private int ItemCount => DataGroups?.Count ?? CurrentItems.Count();

    private string? LoadingClass => new CssBuilder("small")
        .Add(ThemeColor.ToCSS())
        .ToString();

    [Inject, NotNull] private NavigationManager? NavigationManager { get; set; }

    private ulong Offset { get; set; }

    private ulong? PageCount { get; set; }

    private bool? SelectAllValue
    {
        get
        {
            if (CurrentPageItems.All(x => x is not null && SelectedItems.Contains(x)))
            {
                return true;
            }
            if (CurrentPageItems.All(x => x is null || !SelectedItems.Contains(x)))
            {
                return false;
            }
            return null;
        }
    }

    private string? TitleClass => new CssBuilder("h6")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private bool UseEditDialog => !AllowInlineEdit
        || EditDialog is not null
        || _columns.Any(x => !x.GetIsShown());

    [Inject] private UtilityService UtilityService { get; set; } = default!;

    /// <inheritdoc/>
    protected override async void OnInitialized()
    {
        if (_columns.Count != 0)
        {
            return;
        }

        var dataType = typeof(TDataItem);
        dataType = Nullable.GetUnderlyingType(dataType) ?? dataType;

        foreach (var property in dataType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(x => x.CanRead))
        {
            var columnType = typeof(Column<,>).MakeGenericType(typeof(TDataItem), property.PropertyType);
            var ctor = columnType.GetConstructor(BindingFlags.Instance | BindingFlags.NonPublic, [typeof(PropertyInfo)])!;
            _columns.Add((IColumn<TDataItem>)ctor.Invoke(new[] { property }));
        }

        foreach (var field in dataType
            .GetFields(BindingFlags.Public | BindingFlags.Instance)
            .Where(x => x.IsPublic))
        {
            var columnType = typeof(Column<,>).MakeGenericType(typeof(TDataItem), field.FieldType);
            var ctor = columnType.GetConstructor(BindingFlags.Instance | BindingFlags.NonPublic, [typeof(FieldInfo)])!;
            _columns.Add((IColumn<TDataItem>)ctor.Invoke(new[] { field }));
        }

        _columns.Sort((x, y) => x.ColumnOrder.CompareTo(y.ColumnOrder));

        if (LoadItems is null)
        {
            Regroup();
        }
        else
        {
            RecalculatePaging();
            await LoadItemsAsync();
        }
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var selectedItemChanged = false;
        TDataItem? newSelectedItem = default;
        if (!parameters.TryGetValue<List<TDataItem>>(nameof(SelectedItems), out var newSelectedItems)
            && parameters.TryGetValue(nameof(SelectedItem), out newSelectedItem)
            && !EqualityComparer<TDataItem>.Default.Equals(newSelectedItem, SelectedItem))
        {
            selectedItemChanged = true;
        }

        var selectedItemsChanged = !selectedItemChanged
            && newSelectedItems?.SequenceEqual(SelectedItems) == false;

        var reload = false;
        var newRowsPerPage = false;
        var newGroups = false;
        var newItems = false;

        if (parameters.TryGetValue<string?>(nameof(QuickFilter), out var quickFilter)
            && quickFilter != QuickFilter)
        {
            reload = true;
        }
        if (parameters.TryGetValue<ushort>(nameof(RowsPerPage), out var rowsPerPage)
            && rowsPerPage != RowsPerPage)
        {
            newRowsPerPage = true;
        }
        else
        {
            newGroups = parameters.TryGetValue<Func<TDataItem, string>?>(nameof(GroupBy), out var groupBy)
                && groupBy != GroupBy;
            newItems = parameters.TryGetValue<List<TDataItem>>(nameof(Items), out var items)
                && !items.SequenceEqual(Items);
        }

        await base.SetParametersAsync(parameters);

        if (reload)
        {
            await LoadItemsAsync();
        }
        if (newRowsPerPage)
        {
            await OnChangeRowsPerPageAsync(RowsPerPage);
        }
        else if (newGroups
            || newItems)
        {
            if (newItems)
            {
                var page = CurrentPage;
                RecalculatePaging();
                if (CurrentPage != page)
                {
                    await CurrentPageChanged.InvokeAsync();
                }
            }
            Regroup();
        }

        if (selectedItemsChanged)
        {
            await SetSelectionAsync(newSelectedItems);
        }
        else if (selectedItemChanged)
        {
            await SetSelectionAsync(newSelectedItem);
        }
    }

    /// <inheritdoc/>
    protected override async Task OnParametersSetAsync()
    {
        if (LoadItems is null)
        {
            if (Items is null)
            {
                if (SelectedItems.Count > 0)
                {
                    SelectedItem = default;
                    SelectedItems.Clear();
                    SelectedItemChanging?.Invoke(this, SelectedItem);
                    await SelectedItemChanged.InvokeAsync(SelectedItem);
                    await SelectedItemsChanged.InvokeAsync(SelectedItems);
                }
            }
            else
            {
                var remaining = SelectedItems.Intersect(Items).ToList();
                if (remaining.Count != SelectedItems.Count)
                {
                    SelectedItems.Clear();
                    SelectedItems.AddRange(remaining);
                    SelectedItem = SelectedItems.FirstOrDefault();
                    SelectedItemChanging?.Invoke(this, SelectedItem);
                    await SelectedItemChanged.InvokeAsync(SelectedItem);
                    await SelectedItemsChanged.InvokeAsync(SelectedItems);
                }
            }
        }

        if (ushort.TryParse(RowsPerPageQuery?
            .FirstOrDefault(x => x.StartsWith(Id) && x.Length > Id.Length && x[Id.Length] == ':')?
            [(Id.Length + 1)..], out var rowsPerPage))
        {
            RowsPerPage = rowsPerPage;
        }

        if (ulong.TryParse(OffsetQuery?
            .FirstOrDefault(x => x.StartsWith(Id) && x.Length > Id.Length && x[Id.Length] == ':')?
            [(Id.Length + 1)..], out var offset))
        {
            Offset = offset;
        }

        var filters = new List<FilterInfo>();
        if (FilterQuery is not null)
        {
            foreach (var filterStringValue in FilterQuery
                .Where(x => x.StartsWith(Id) && x.Length > Id.Length && x[Id.Length] == ':'))
            {
                var filterString = filterStringValue[(Id.Length + 1)..];
                if (string.IsNullOrEmpty(filterString))
                {
                    continue;
                }
                var parts = filterString.Split(';');
                string? property = null;
                string? value = null;
                var beforeFlag = false;
                var exactFlag = false;
                var quickFlag = false;
                foreach (var part in parts)
                {
                    if (part.StartsWith('\'')
                        && part.EndsWith('\''))
                    {
                        value = part[1..^1];
                    }
                    else if (part.Equals("before"))
                    {
                        beforeFlag = true;
                    }
                    else if (part.Equals("exact"))
                    {
                        exactFlag = true;
                    }
                    else if (part.Equals("quick"))
                    {
                        quickFlag = true;
                    }
                    else
                    {
                        property = part;
                    }
                }
                if (quickFlag)
                {
                    if (!string.IsNullOrEmpty(value))
                    {
                        QuickFilter = value;
                    }
                }
                else if (!string.IsNullOrEmpty(property)
                    && !string.IsNullOrEmpty(value))
                {
                    filters.Add(new(
                        property,
                        value,
                        exactFlag,
                        quickFlag ? value : null,
                        DateTimeFilterIsBefore: beforeFlag));
                }
            }
        }
        if (filters.Count > 0)
        {
            foreach (var filter in filters)
            {
                var column = _columns.FirstOrDefault(x => x.MemberName?.Equals(filter.Property) == true);
                if (column is null)
                {
                    continue;
                }

                var isFiltered = false;
                if (column.IsBool)
                {
                    column.BoolFilter = bool.TryParse(filter.TextFilter, out var value)
                        ? value
                        : null;
                    isFiltered = filter.BoolFilter.HasValue;
                }
                else if (column.IsDateTime)
                {
                    if (DateTimeOffset.TryParseExact(
                        filter.TextFilter,
                        column.GetDateTimeFormat(),
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None, out var exactValue))
                    {
                        column.DateTimeFilter = exactValue;
                    }
                    else if (DateTimeOffset.TryParse(filter.TextFilter, out var value))
                    {
                        column.DateTimeFilter = value;
                    }
                    else
                    {
                        column.DateTimeFilter = null;
                    }
                    column.DateTimeFilterIsBefore = filter.DateTimeFilterIsBefore;
                    isFiltered = filter.DateTimeFilter.HasValue;
                }
                else if (column.IsNumeric)
                {
                    column.NumberFilter = double.TryParse(filter.TextFilter, out var value)
                        ? value
                        : null;
                    isFiltered = filter.NumberFilter.HasValue;
                }
                else if (column.IsString)
                {
                    column.TextFilter = filter.ExactMatch
                        ? $"\"{filter.TextFilter}\""
                        : filter.TextFilter;
                    isFiltered = !string.IsNullOrEmpty(filter.TextFilter);
                }

                if (isFiltered && !column.GetIsShown())
                {
                    column.SetIsShown(true);
                }
            }
        }

        var sorts = new List<SortInfo>();
        if (SortQuery is not null)
        {
            foreach (var sortStringValue in SortQuery
                .Where(x => x.StartsWith(Id) && x.Length > Id.Length && x[Id.Length] == ':'))
            {
                var sortString = sortStringValue[(Id.Length + 1)..];
                if (string.IsNullOrEmpty(sortString))
                {
                    continue;
                }
                var parts = sortString.Split(';');
                string? property = null;
                var priority = 0;
                var descendingFlag = false;
                foreach (var part in parts)
                {
                    if (part.Equals("desc"))
                    {
                        descendingFlag = true;
                    }
                    else if (part.StartsWith("p-")
                        && part.Length > 2
                        && int.TryParse(part[2..], out var priorityValue))
                    {
                        priority = priorityValue;
                    }
                    else
                    {
                        property = part;
                    }
                }
                if (!string.IsNullOrEmpty(property))
                {
                    sorts.Add(new(property, descendingFlag, priority));
                }
            }
        }
        sorts.Sort((x, y) => x.Priority.CompareTo(y.Priority));
        if (sorts.Count > 0)
        {
            foreach (var (property, descending, _) in sorts)
            {
                var column = _columns.Find(x => x.MemberName == property);
                if (column is null)
                {
                    continue;
                }

                column.SortDescending = descending;
                _sortOrder.Remove(column.Id);
                _sortOrder.Insert(0, column.Id);

                if (!column.GetIsShown())
                {
                    column.SetIsShown(true);
                }
            }
        }

        Request = new(
            RowsPerPage,
            Offset,
            [.. filters],
            [.. sorts]);

        if (LoadItems is null)
        {
            Regroup();
        }
        else
        {
            await LoadItemsAsync();
        }

        RefreshRowExpansion();
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Interactive = true;
            StateHasChanged();
        }
    }

    /// <inheritdoc/>
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Adds a new column to this grid.
    /// </summary>
    /// <param name="column">The column to add.</param>
    public void AddColumn(IColumn<TDataItem> column)
    {
        if (!column.IsDefault)
        {
            _columns.RemoveAll(x => x.IsDefault);
        }

        var index = _columns.FindIndex(x => x.ColumnOrder > column.ColumnOrder);
        if (index == -1)
        {
            index = _columns.FindLastIndex(x => x.ColumnOrder == column.ColumnOrder);
            index++;
        }
        _columns.Insert(index, column);

        if (Request.Filters?.Length > 0)
        {
            foreach (var filter in Request.Filters)
            {
                if (column.MemberName?.Equals(filter.Property) != true)
                {
                    continue;
                }

                var isFiltered = false;
                if (column.IsBool)
                {
                    column.BoolFilter = bool.TryParse(filter.TextFilter, out var value)
                        ? value
                        : null;
                    isFiltered = filter.BoolFilter.HasValue;
                }
                else if (column.IsDateTime)
                {
                    if (DateTimeOffset.TryParseExact(
                        filter.TextFilter,
                        column.GetDateTimeFormat(),
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None, out var exactValue))
                    {
                        column.DateTimeFilter = exactValue;
                    }
                    else if (DateTimeOffset.TryParse(filter.TextFilter, out var value))
                    {
                        column.DateTimeFilter = value;
                    }
                    else
                    {
                        column.DateTimeFilter = null;
                    }
                    column.DateTimeFilterIsBefore = filter.DateTimeFilterIsBefore;
                    isFiltered = filter.DateTimeFilter.HasValue;
                }
                else if (column.IsNumeric)
                {
                    column.NumberFilter = double.TryParse(filter.TextFilter, out var value)
                        ? value
                        : null;
                    isFiltered = filter.NumberFilter.HasValue;
                }
                else if (column.IsString)
                {
                    column.TextFilter = filter.ExactMatch
                        ? $"\"{filter.TextFilter}\""
                        : filter.TextFilter;
                    isFiltered = !string.IsNullOrEmpty(filter.TextFilter);
                }

                if (isFiltered && !column.GetIsShown())
                {
                    column.SetIsShown(true);
                }
            }
        }

        if (Request.Order?.Length > 0)
        {
            foreach (var (property, descending, _) in Request.Order)
            {
                if (column.MemberName?.Equals(property) != true)
                {
                    continue;
                }

                column.SortDescending = descending;
                _sortOrder.Remove(column.Id);
                _sortOrder.Insert(0, column.Id);

                if (!column.GetIsShown())
                {
                    column.SetIsShown(true);
                }
            }
        }

        StateHasChanged();
    }

    /// <summary>
    /// Notifies the grid that its state has been changed externally.
    /// </summary>
    public void InvokeStateChange() => StateHasChanged();

    /// <summary>
    /// Loads the current set of data from <see cref="LoadItems"/>, if it has been configured.
    /// </summary>
    public async Task LoadItemsAsync()
    {
        if (LoadItems is null)
        {
            return;
        }

        IsLoading = true;
        StateHasChanged();

        CurrentDataPage = await LoadItems.Invoke(new(
            RowsPerPage,
            Offset,
            GetFilterInfo(),
            GetSortInfo()));

        if (CurrentDataPage?.TotalCount.HasValue == true)
        {
            PageCount = CurrentDataPage.TotalCount.Value / RowsPerPage;
            if (CurrentDataPage.TotalCount.Value % RowsPerPage != 0)
            {
                PageCount++;
            }
        }
        else
        {
            PageCount = null;
        }

        IsLoading = false;
        Regroup();
    }

    /// <summary>
    /// Called internally.
    /// </summary>
    public void OnColumnSorted(IColumn<TDataItem> column)
    {
        _sortOrder.Remove(column.Id);
        _sortOrder.Insert(0, column.Id);
        SetSortQuery();
    }

    /// <summary>
    /// Removes a column from this grid.
    /// </summary>
    /// <param name="column">The column to remove.</param>
    public void RemoveColumn(IColumn<TDataItem> column)
    {
        _columns.Remove(column);
        _sortOrder.Remove(column.Id);
    }

    /// <summary>
    /// <para>
    /// Selects all items on the current page.
    /// </para>
    /// <para>
    /// Has no effect if <see cref="SelectionType"/> is not <see cref="SelectionType.Multiple"/>.
    /// </para>
    /// </summary>
    public Task SelectAllAsync()
    {
        if (SelectionType != SelectionType.Multiple)
        {
            return Task.CompletedTask;
        }

        return OnSetSelectAllAsync(true);
    }

    /// <summary>
    /// Sets the current page to the given value.
    /// </summary>
    /// <param name="value">
    /// <para>
    /// The zero-based index of the page to view.
    /// </para>
    /// <para>
    /// If the given index is greater than or equal to the total number of pages, nagivates to the
    /// last page instead.
    /// </para>
    /// <para>
    /// If <see cref="LoadItems"/> is not <see langword="null"/>, and the most recently returned
    /// result did not have a set <see cref="DataPage{TDataItem}.TotalCount"/>, and the value given
    /// is more than the current number of pages, this results in advancing to the next page if <see
    /// cref="DataPage{TDataItem}.HasMore"/> is <see langword="true"/>, or the last page if not.
    /// </para>
    /// </param>
    public async Task SetPageAsync(ulong value)
    {
        if (value == CurrentPage)
        {
            return;
        }
        else if (value < CurrentPage)
        {
            CurrentPage = value;
            Offset = RowsPerPage * value;
        }
        else if (PageCount.HasValue)
        {
            CurrentPage = Math.Min(PageCount.Value, value) - 1;
            Offset = RowsPerPage * CurrentPage;
        }
        else if (CurrentDataPage?.HasMore != false)
        {
            Offset += RowsPerPage;
            CurrentPage++;
            await LoadItemsAsync();
        }
        await CurrentPageChanged.InvokeAsync();
        SetOffsetQuery();
    }

    /// <summary>
    /// Sets the currently selected item.
    /// </summary>
    /// <param name="selectedItem">
    /// <para>
    /// The item to set as the current selection.
    /// </para>
    /// <para>
    /// The currently selected item is set to the default (e.g. <see langword="null"/>) if <paramref
    /// name="selectedItem"/> is not in the current set of <see cref="Items"/>.
    /// </para>
    /// </param>
    public async Task SetSelectionAsync(TDataItem? selectedItem)
    {
        if (SelectedItems.Count == 0
            && selectedItem is null)
        {
            return;
        }

        if (SelectedItems.Count == 1
            && SelectedItem?.Equals(selectedItem) == true)
        {
            return;
        }

        var hadSelection = SelectedItems.Count > 0;
        SelectedItems.Clear();
        SelectedItem = default;

        if (selectedItem is null)
        {
            if (hadSelection)
            {
                SelectedItemChanging?.Invoke(this, SelectedItem);
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
                StateHasChanged();
            }
            return;
        }

        SelectedItem = selectedItem;
        SelectedItems.Add(selectedItem);
        SelectedItemChanging?.Invoke(this, SelectedItem);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    /// <summary>
    /// Sets the currently selected item(s) to the set which have a given value.
    /// </summary>
    /// <param name="getValue">
    /// A function which retrieves a value from a data item.
    /// </param>
    /// <param name="value">
    /// The value which should indicate a selected item.
    /// </param>
    public async Task SetSelectionAsync<TValue>(Func<TDataItem, TValue?>? getValue, TValue? value)
    {
        if (SelectedItems.Count == 0
            && value is null)
        {
            return;
        }

        SelectedItems.Clear();
        SelectedItem = default;

        if (value is null
            || (getValue is null
            && !typeof(TDataItem).IsAssignableFrom(typeof(TValue))))
        {
            return;
        }

        if (LoadItems is null)
        {
            foreach (var item in Items)
            {
                if (getValue is null)
                {
                    if (item is not null
                        && item.Equals(value))
                    {
                        SelectedItems.Add(item);
                    }
                }
                else if (getValue(item)?.Equals(value) == true)
                {
                    SelectedItems.Add(item);
                }
            }
        }
        else
        {
            foreach (var item in CurrentPageItems)
            {
                if (getValue is null)
                {
                    if (item is not null
                        && item.Equals(value))
                    {
                        SelectedItems.Add(item);
                    }
                }
                else if (getValue(item)?.Equals(value) == true)
                {
                    SelectedItems.Add(item);
                }
            }
        }

        if (SelectedItems.Count == 0
            && value is not null
            && typeof(TDataItem).IsAssignableFrom(typeof(TValue)))
        {
            SelectedItems.Add((TDataItem)(object)value);
        }

        SelectedItem = SelectedItems.FirstOrDefault();
        SelectedItemChanging?.Invoke(this, SelectedItem);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    /// <summary>
    /// Sets the currently selected items.
    /// </summary>
    /// <param name="selectedItems">
    /// <para>
    /// The items to set as the current selection.
    /// </para>
    /// <para>
    /// Any items not in the current set of <see cref="Items"/> is not added to the selection.
    /// </para>
    /// </param>
    public async Task SetSelectionAsync(List<TDataItem>? selectedItems)
    {
        selectedItems ??= [];
        if (!SelectedItems.Except(selectedItems).Any()
            && !selectedItems.Except(SelectedItems).Any())
        {
            return;
        }

        SelectedItems.Clear();
        SelectedItems.AddRange(selectedItems.Intersect(Items));
        SelectedItem = SelectedItems.FirstOrDefault();
        SelectedItemChanging?.Invoke(this, SelectedItem);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    /// <summary>
    /// Sets the currently selected item(s) to the set which have a given value.
    /// </summary>
    /// <param name="getValue">
    /// A function which retrieves a value from a data item.
    /// </param>
    /// <param name="values">
    /// The values which should indicate a selected item.
    /// </param>
    public async Task SetSelectionAsync<TValue>(Func<TDataItem, TValue?>? getValue, List<TValue>? values)
    {
        if (SelectedItems.Count == 0
            && (values?.Count ?? 0) == 0)
        {
            return;
        }

        SelectedItems.Clear();
        SelectedItem = default;

        if (values is null
            || (getValue is null
            && !typeof(TDataItem).IsAssignableFrom(typeof(TValue))))
        {
            return;
        }

        if (LoadItems is null)
        {
            foreach (var item in Items)
            {
                if (getValue is null)
                {
                    if (item is not null
                        && values.Any(x => item.Equals(x)))
                    {
                        SelectedItems.Add(item);
                    }
                }
                else if (values.Any(x => getValue(item)?.Equals(x) == true))
                {
                    SelectedItems.Add(item);
                }
            }
        }
        else
        {
            foreach (var item in CurrentPageItems)
            {
                if (getValue is null)
                {
                    if (item is not null
                        && values.Any(x => item.Equals(x)))
                    {
                        SelectedItems.Add(item);
                    }
                }
                else if (values.Any(x => getValue(item)?.Equals(x) == true))
                {
                    SelectedItems.Add(item);
                }
            }
        }

        if (SelectedItems.Count == 0
            && values?.Count > 0
            && typeof(TDataItem).IsAssignableFrom(typeof(TValue)))
        {
            SelectedItems.AddRange(values.Cast<object>().Cast<TDataItem>());
        }

        SelectedItem = SelectedItems.FirstOrDefault();
        SelectedItemChanging?.Invoke(this, SelectedItem);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    internal bool GetRowIsExpanded(TDataItem item) => item is not null
        && _rowCurrentExpansion.Contains(item.GetHashCode());

    internal string GetRowExpansionToggleUrl(Row<TDataItem> row)
    {
        if (row.Item is null)
        {
            return NavigationManager.Uri;
        }

        var rowCurrentExpansion = _rowCurrentExpansion.ToList();

        var hash = row.Item.GetHashCode();
        var rowIsExpanded = _rowCurrentExpansion.Contains(hash);
        if (rowIsExpanded)
        {
            rowCurrentExpansion.Remove(hash);
        }
        else
        {
            rowCurrentExpansion.Add(hash);
        }

        var rowExpansionQueries = RowExpansionQuery?.ToList();
        rowExpansionQueries?.RemoveAll(x => x.StartsWith(Id));
        if (rowCurrentExpansion.Count > 0)
        {
            rowExpansionQueries ??= [];
            foreach (var rowExpansion in rowCurrentExpansion)
            {
                rowExpansionQueries.Add($"{Id}:{rowExpansion:x}");
            }
        }

        return NavigationManager.GetUriWithQueryParameters(
            new Dictionary<string, object?> { [RowExpansionQueryParamName] = rowExpansionQueries });
    }

    internal bool GetRowWasExpanded(TDataItem item) => item is not null
        && _rowExpansion.Contains(item.GetHashCode());

    internal void OnColumnSorted(Guid id)
    {
        _sortOrder.Remove(id);
        _sortOrder.Insert(0, id);
        SetSortQuery();
    }

    internal async Task OnDeleteAsync(Row<TDataItem> row)
    {
        if (EditingRow?.Equals(row) == false)
        {
            var couldSave = await TrySaveEditAsync();
            if (!couldSave)
            {
                await OnCancelEditAsync();
            }
        }

        DeleteItem = row.Item;
        if (DeleteItem is null)
        {
            return;
        }

        var confirmed = await DialogService.ShowMessageBox("Confirm Delete", new MessageBoxOptions
        {
            Message = new("<p>Are you sure you want to delete this item?</p>"),
            OkText = "Delete",
        });
        if (confirmed != true)
        {
            return;
        }

        if (ItemDeleted is not null)
        {
            var success = await ItemDeleted.Invoke(DeleteItem);
            if (!success)
            {
                return;
            }
        }
        if (LoadItems is null)
        {
            Items.Remove(DeleteItem);
        }
        else if (CurrentDataPage is null)
        {
            await LoadItemsAsync();
        }
        else
        {
            CurrentDataPage.Items.Remove(DeleteItem);
        }
        await InvokeAsync(StateHasChanged);
    }

    internal async Task OnEditAsync(Row<TDataItem> row)
    {
        if (EditingRow is not null)
        {
            var couldSave = await TrySaveEditAsync();
            if (!couldSave)
            {
                await OnCancelEditAsync();
            }
        }

        if (EditDialog is not null)
        {
            DialogOptions? options = null;
            if (EditDialogOptions is not null)
            {
                options = EditDialogOptions;
            }
            options ??= new();

            DialogParameters? parameters = null;
            if (EditDialogParameters is not null)
            {
                parameters = await EditDialogParameters.Invoke(row.Item);
            }
            (parameters ??= []).Add(nameof(Row<TDataItem>.Item), row.Item);
            var result = await DialogService.Show(
                EditDialog,
                "Edit",
                parameters,
                options).Result;
            if (result.Choice == DialogChoice.Ok
                && result.Data is TDataItem item)
            {
                var success = true;
                if (ItemSaved is not null)
                {
                    success = await ItemSaved.Invoke(item);
                }
                if (success)
                {
                    if (LoadItems is null)
                    {
                        Items.Remove(row.Item);
                        Items.Add(item);
                    }
                    else if (CurrentDataPage is null)
                    {
                        await LoadItemsAsync();
                    }
                    else if (CurrentDataPage.Items.Contains(row.Item))
                    {
                        CurrentDataPage.Items.Remove(row.Item);
                        CurrentDataPage.Items.Add(item);
                    }
                    await InvokeAsync(StateHasChanged);
                }
            }
        }
        else if (UseEditDialog)
        {
            await ShowEditDialogAsync(row.Item);
            StateHasChanged();
        }
        else
        {
            EditingRow = row;
        }
    }

    internal async Task OnToggleRowExpansionAsync(Row<TDataItem> row)
    {
        if (row.Item is null)
        {
            return;
        }

        var hash = row.Item.GetHashCode();
        var rowIsExpanded = _rowCurrentExpansion.Contains(hash);
        if (rowIsExpanded)
        {
            _rowCurrentExpansion.Remove(hash);
        }
        else
        {
            _rowExpansion.Add(hash);
            _rowCurrentExpansion.Add(hash);
        }
        if (!rowIsExpanded && RowExpanded.HasDelegate)
        {
            row.IsLoading = true;
            StateHasChanged();
            await RowExpanded.InvokeAsync(row.Item);
            row.IsLoading = false;
            StateHasChanged();
        }

        var rowExpansionQueries = RowExpansionQuery?.ToList();
        rowExpansionQueries?.RemoveAll(x => x.StartsWith(Id));
        if (_rowCurrentExpansion.Count > 0)
        {
            rowExpansionQueries ??= [];
            foreach (var rowExpansion in _rowCurrentExpansion)
            {
                rowExpansionQueries.Add($"{Id}:{rowExpansion:x}");
            }
        }

        NavigationManager.NavigateTo(
            NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [RowExpansionQueryParamName] = rowExpansionQueries }),
            false,
            true);
    }

    internal async Task OnSaveEditAsync() => await TrySaveEditAsync();

    internal async Task OnSelectAsync(Row<TDataItem> row)
    {
        if (EditingRow is not null)
        {
            var couldSave = await TrySaveEditAsync();
            if (!couldSave)
            {
                await OnCancelEditAsync();
            }
        }

        if (SelectionType == SelectionType.Single)
        {
            if (SelectedItems.Contains(row.Item))
            {
                if (SelectedItem?.Equals(row.Item) == true)
                {
                    SelectedItem = default;
                }
                SelectedItems.Remove(row.Item);
            }
            else
            {
                SelectedItem = row.Item;
                SelectedItems.Clear();
                SelectedItems.Add(row.Item);
            }
            SelectedItemChanging?.Invoke(this, SelectedItem);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
            StateHasChanged();
        }
    }

    internal async Task OnSelectAsync(Row<TDataItem> row, bool value)
    {
        if (EditingRow is not null)
        {
            var couldSave = await TrySaveEditAsync();
            if (!couldSave)
            {
                await OnCancelEditAsync();
            }
        }

        var changed = false;
        if (value)
        {
            if (!SelectedItems.Contains(row.Item))
            {
                SelectedItems.Add(row.Item);
                SelectedItem = SelectedItems.FirstOrDefault();
                changed = true;
            }
        }
        else if (SelectedItems.Remove(row.Item))
        {
            if (SelectedItem?.Equals(row.Item) == true)
            {
                SelectedItem = default;
            }
            changed = true;
        }
        if (changed)
        {
            SelectedItemChanging?.Invoke(this, SelectedItem);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
    }

    internal async Task SelectNext()
    {
        if (!CurrentPageItems.Any())
        {
            return;
        }

        if (SelectedItem is null)
        {
            var first = CurrentPageItems.FirstOrDefault();
            if (first is not null)
            {
                await SetSelectionAsync(first);
            }
            return;
        }

        TDataItem? next = default;
        var last = CurrentPageItems.Last();
        if (last is not null
            && last.Equals(SelectedItem))
        {
            var hasNext = (PageCount.HasValue
                && CurrentPage < PageCount - 1)
                || CurrentDataPage?.HasMore == true;
            if (hasNext)
            {
                await OnNextPageAsync();
                StateHasChanged();
            }
            next = CurrentPageItems.FirstOrDefault();
        }
        else
        {
            next = CurrentPageItems
                .SkipWhile(x => x is null || !x.Equals(SelectedItem))
                .Skip(1)
                .FirstOrDefault();
        }

        if (next is not null)
        {
            await SetSelectionAsync(next);
        }
    }

    internal async Task SelectPrevious()
    {
        if (!CurrentPageItems.Any())
        {
            return;
        }

        if (SelectedItem is null)
        {
            var last = CurrentPageItems.LastOrDefault();
            if (last is not null)
            {
                await SetSelectionAsync(last);
            }
            return;
        }

        TDataItem? previous = default;
        var first = CurrentPageItems.First();
        if (first is not null
            && first.Equals(SelectedItem))
        {
            if (CurrentPage > 0)
            {
                await SetPageAsync(CurrentPage - 1);
                StateHasChanged();
            }
            previous = CurrentPageItems.LastOrDefault();
        }
        else
        {
            previous = CurrentPageItems
                .TakeWhile(x => x is not null && !x.Equals(SelectedItem))
                .LastOrDefault();
        }

        if (previous is not null)
        {
            await SetSelectionAsync(previous);
        }
    }

    internal async Task ToggleSelectionAsync(TDataItem item)
    {
        if (SelectedItems.Contains(item))
        {
            if (SelectedItem?.Equals(item) == true)
            {
                SelectedItem = default;
            }
            SelectedItems.Remove(item);
        }
        else if (SelectionType == SelectionType.Single)
        {
            SelectedItem = item;
            SelectedItems.Clear();
            SelectedItems.Add(item);
        }
        else if (SelectionType == SelectionType.Multiple)
        {
            SelectedItems.Add(item);
            SelectedItem = SelectedItems.FirstOrDefault();
        }
        SelectedItemChanging?.Invoke(this, SelectedItem);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                foreach (var url in _objectUrls)
                {
                    await UtilityService.RevokeURLAsync(url);
                }
            }

            _disposedValue = true;
        }
    }

    private static string? GetColumnHeaderClass(IColumn<TDataItem> column) => new CssBuilder("column-header")
        .Add("clickable", column.GetIsSortable())
        .ToString();

    private string? GetColumnHeaderIconClass(IColumn<TDataItem> column) => new CssBuilder()
        .Add("active", _sortOrder.Contains(column.Id))
        .Add("desc", column.SortDescending)
        .ToString();

    private string GetColumnSortUrl(IColumn<TDataItem> column)
    {
        var sortQueries = SortQuery?.ToList();

        var sortOrder = _sortOrder.ToList();
        sortOrder.Remove(column.Id);
        sortOrder.Insert(0, column.Id);

        var sortDescending = false;
        if (_sortOrder.Contains(column.Id))
        {
            sortDescending = !column.SortDescending;
        }

        var sortInfo = GetSortInfo();
        if (sortInfo is null)
        {
            sortQueries?.RemoveAll(x => x.StartsWith(Id));
        }
        else
        {
            for (var i = 0; i < sortInfo.Length; i++)
            {
                var query = new StringBuilder(Id)
                    .Append(':')
                    .Append(sortInfo[i].Property);
                if (i == 0)
                {
                    if (sortDescending)
                    {
                        query.Append(";desc");
                    }
                }
                else
                {
                    if (sortInfo[i].Descending)
                    {
                        query.Append(";desc");
                    }
                    query.Append(";p-")
                        .Append(i);
                }
                (sortQueries ??= []).Add(query.ToString());
            }
        }

        return NavigationManager.GetUriWithQueryParameters(
            new Dictionary<string, object?> { [SortQueryParamName] = sortQueries?.ToArray() });
    }

    private async Task<Stream?> GetCSVAsync()
    {
        var columns = _columns
            .Where(x => x.ExportHidden || x.GetIsShown())
            .ToList();
        if (columns.Count == 0)
        {
            return null;
        }

        var items = await TryGetAllItemsAsync();
        if (items is null)
        {
            return null;
        }

        var sb = new StringBuilder();

        for (var i = 0; i < columns.Count; i++)
        {
            if (sb.Length > 0)
            {
                sb.Append(',');
            }

            var label = columns[i].GetLabel()?.Trim();
            if (label?.Contains('\'') == true)
            {
                sb.Append('"')
                    .Append(label?.Replace("\"", "\"\""))
                    .Append('"');
            }
            else
            {
                sb.Append(label);
            }

            if (i == columns.Count - 1)
            {
                sb.AppendLine();
            }
        }

        foreach (var item in items)
        {
            for (var i = 0; i < columns.Count; i++)
            {
                if (i > 0)
                {
                    sb.Append(',');
                }

                var content = columns[i].ToString(item);
                if (content?.Contains('\'') == true)
                {
                    sb.Append('"')
                        .Append(content?.Replace("\"", "\"\""))
                        .Append('"');
                }
                else
                {
                    sb.Append(content);
                }

                if (i == columns.Count - 1)
                {
                    sb.AppendLine();
                }
            }
        }

        return new MemoryStream(Encoding.UTF8.GetBytes(sb.ToString()));
    }

    private async Task<Stream?> GetExcelAsync()
    {
        var columns = _columns
            .Where(x => x.ExportHidden || x.GetIsShown())
            .ToList();
        if (columns.Count == 0)
        {
            return null;
        }

        var items = await TryGetAllItemsAsync();
        if (items is null)
        {
            return null;
        }

        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Data");

        worksheet.SheetView.FreezeRows(1);

        var headingRow = worksheet.Row(1);
        headingRow.Style.Font.Bold = true;
        headingRow.Style.Border.BottomBorder = XLBorderStyleValues.Medium;

        for (var i = 0; i < columns.Count; i++)
        {
            var label = columns[i].GetLabel()?.Trim();
            if (!string.IsNullOrEmpty(label))
            {
                worksheet.Cell(1, i + 1).SetValue(label);
            }
        }

        var row = 2;
        foreach (var item in items)
        {
            if (item is null)
            {
                continue;
            }

            for (var i = 0; i < columns.Count; i++)
            {
                var label = columns[i].ToString(item);
                if (!string.IsNullOrEmpty(label))
                {
                    worksheet.Cell(row, i + 1).SetValue(label);
                }
            }

            row++;
        }

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }

    private FilterInfo[]? GetFilterInfo(bool export = false)
    {
        List<FilterInfo>? filterInfo = null;
        var quickFilter = QuickFilter?.Trim('"').Trim();
        foreach (var column in _columns
            .Where(x => (x.GetIsShown()
                || (x.IsQuickFilter
                    && !string.IsNullOrEmpty(quickFilter))
                || (export && x.ExportHidden))
                && x.MemberName is not null))
        {
            if (column.IsString)
            {
                if (string.IsNullOrEmpty(column.TextFilter)
                    && (!column.IsQuickFilter
                    || string.IsNullOrEmpty(quickFilter)))
                {
                    continue;
                }
                var exact = !string.IsNullOrEmpty(column.TextFilter)
                    && column.TextFilter.Length >= 2
                    && column.TextFilter[0] == '"'
                    && column.TextFilter[^1] == '"';
                string? textFilter = null;
                if (column.GetIsShown())
                {
                    textFilter = exact
                        ? column.TextFilter![1..^1]
                        : column.TextFilter;
                }
                (filterInfo ??= []).Add(new(
                    column.MemberName!,
                    textFilter,
                    exact,
                    column.IsString && column.IsQuickFilter ? quickFilter : null,
                    null,
                    null,
                    null,
                    null,
                    false));
            }
            else if (column.IsBool)
            {
                if (!column.BoolFilter.HasValue)
                {
                    continue;
                }
                (filterInfo ??= []).Add(new(
                    column.MemberName!,
                    null,
                    false,
                    null,
                    column.BoolFilter,
                    null,
                    null,
                    null,
                    false));
            }
            else if (column.IsNumeric)
            {
                if (!column.NumberFilter.HasValue)
                {
                    continue;
                }
                (filterInfo ??= []).Add(new(
                    column.MemberName!,
                    null,
                    false,
                    null,
                    null,
                    column.NumberFilter,
                    null,
                    null,
                    false));
            }
            else if (column.IsDateTime)
            {
                if (!column.DateTimeFilter.HasValue)
                {
                    continue;
                }
                (filterInfo ??= []).Add(new(
                    column.MemberName!,
                    null,
                    false,
                    null,
                    null,
                    null,
                    column.DateTimeFilter,
                    column.GetDateTimeFormat(),
                    column.DateTimeFilterIsBefore));
            }
        }
        return filterInfo?.ToArray();
    }

    private async Task<Stream?> GetHTMLAsync(string? title)
    {
        var items = await TryGetAllItemsAsync();
        if (items is null)
        {
            return null;
        }

        var sb = new StringBuilder();

        for (var i = 0; i < _columns.Count; i++)
        {
            sb.Append("<th>")
                .Append(System.Net.WebUtility.HtmlEncode(_columns[i].GetLabel()?.Trim()))
                .AppendLine("</th>");
        }

        sb.AppendLine("</tr>")
            .AppendLine("</thead>")
            .AppendLine("<tbody>");

        foreach (var item in items)
        {
            sb.AppendLine("<tr>");

            for (var i = 0; i < _columns.Count; i++)
            {
                sb.Append("<td>")
                    .Append(System.Net.WebUtility.HtmlEncode(_columns[i].ToString(item)))
                    .AppendLine("</td>");
            }

            sb.AppendLine("</tr>");
        }

        if (string.IsNullOrEmpty(title))
        {
            if (!string.IsNullOrWhiteSpace(Title))
            {
                title = Title.Trim();
            }
            else
            {
                title = $"{typeof(TDataItem).Name} Data";
            }
        }
        var html = string.Format(HtmlTemplate, title, HtmlHeaderContent, sb.ToString());
        return new MemoryStream(Encoding.UTF8.GetBytes(html));
    }

    private string? GetGroupExpandClass(string key) => new CssBuilder("expand-row")
        .Add("open", GetGroupIsExpanded(key))
        .ToString();

    private string GetGroupExpansionQuery(IGrouping<string, TDataItem> group)
    {
        var nullGroupExpanded = string.IsNullOrEmpty(group.Key)
            ? !_nullGroupExpanded
            : _nullGroupExpanded;
        var groupExpansion = _groupExpansion.ToList();
        if (_groupExpansion.Contains(group.Key))
        {
            groupExpansion.Remove(group.Key);
        }
        else
        {
            groupExpansion.Add(group.Key);
        }

        var groupExpansionQueries = GroupExpansionQuery?.ToList();
        groupExpansionQueries?.RemoveAll(x => x.StartsWith(Id));
        if (groupExpansion.Count > 0)
        {
            groupExpansionQueries ??= [];
            foreach (var expansion in groupExpansion)
            {
                groupExpansionQueries.Add($"{Id}:{expansion}");
            }
        }
        if (nullGroupExpanded)
        {
            (groupExpansionQueries ??= []).Add($"{Id}:null");
        }

        return NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [GroupExpansionQueryParamName] = groupExpansionQueries });
    }

    private bool GetGroupIsExpanded(string key) => string.IsNullOrEmpty(key)
        ? _nullGroupExpanded
        : _groupExpansion.Contains(key);

    private async Task<Stream?> GetPDFAsync()
    {
        if (PdfExport is null)
        {
            return null;
        }

        return await PdfExport.Invoke(new(
            0,
            0,
            GetFilterInfo(true),
            GetSortInfo(true)));
    }

    private SortInfo[]? GetSortInfo(List<Guid> sortOrder, bool export = false)
    {
        if (sortOrder.Count == 0)
        {
            return null;
        }

        List<SortInfo>? sortInfo = null;
        foreach (var id in sortOrder)
        {
            var column = _columns.Find(x => x.Id == id);
            if (column is null
                || (!column.GetIsShown()
                    && (!export || !column.ExportHidden)
                    && !column.InitiallySorted)
                || column.MemberName is null)
            {
                continue;
            }

            (sortInfo ??= []).Add(new(
                column.MemberName,
                column.SortDescending));
        }
        return sortInfo?.ToArray();
    }

    private SortInfo[]? GetSortInfo(bool export = false) => GetSortInfo(_sortOrder, export);

    private async Task OnAddAsync()
    {
        if (EditingRow is not null)
        {
            var couldSave = await TrySaveEditAsync();
            if (!couldSave)
            {
                await OnCancelEditAsync();
            }
        }

        if (AddDialog is not null
            || EditDialog is not null)
        {
            DialogParameters? parameters = null;
            if (AddDialogParameters is not null)
            {
                parameters = await AddDialogParameters.Invoke();
            }
            else if (EditDialogParameters is not null)
            {
                parameters = await EditDialogParameters.Invoke(default);
            }
            parameters ??= [];

            DialogOptions? options = null;
            if (AddDialogOptions is not null)
            {
                options = AddDialogOptions;
            }
            else if (EditDialogOptions is not null)
            {
                options = EditDialogOptions;
            }
            options ??= new();

            var result = await DialogService.Show(
                (AddDialog ?? EditDialog)!,
                "Add",
                parameters,
                options).Result;
            if (result.Choice == DialogChoice.Ok
                && result.Data is TDataItem item)
            {
                var success = true;
                if (ItemAdded is not null)
                {
                    success = await ItemAdded.Invoke(item);
                }
                if (success)
                {
                    if (LoadItems is null)
                    {
                        Items.Add(item);
                    }
                    else if (CurrentDataPage is null)
                    {
                        await LoadItemsAsync();
                    }
                    else
                    {
                        CurrentDataPage.Items.Add(item);
                    }
                }
            }
        }
        else
        {
            TDataItem? newItem;
            try
            {
                newItem = (TDataItem?)typeof(TDataItem).GetConstructor(Type.EmptyTypes)?.Invoke(null);
            }
            catch
            {
                newItem = default;
            }
            if (newItem is not null)
            {
                await ShowEditDialogAsync(newItem, true);
            }
        }
    }

    private void OnBoolFilterChanged(IColumn<TDataItem> column, bool? value)
    {
        column.BoolFilter = value;
        SetFilterQuery();
    }

    private async Task OnCancelEditAsync()
    {
        if (EditingRow is not null)
        {
            await EditingRow.CancelEditAsync();
        }
    }

    private void OnChangeQuickFilter(string? value)
    {
        QuickFilter = value;
        SetFilterQuery();
    }

    private async Task OnChangeRowsPerPageAsync(ushort value)
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
            PageCount = (ulong)ItemCount / value;
            if (ItemCount % value != 0)
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
            else
            {
                PageCount = null;
            }

            if (decrease)
            {
                if (CurrentDataPage is not null)
                {
                    CurrentDataPage = CurrentDataPage with { Items = CurrentDataPage.Items.Take(RowsPerPage).ToList() };
                    Regroup();
                }
            }
            else
            {
                await LoadItemsAsync();
            }
        }
        await CurrentPageChanged.InvokeAsync();
        SetRowsPerPageQuery();
    }

    private void OnColumnSort(IColumn<TDataItem> column)
    {
        if (_sortOrder.Contains(column.Id))
        {
            column.SortDescending = !column.SortDescending;
        }
        else
        {
            column.SortDescending = false;
        }
        OnColumnSorted(column);
    }

    private void OnDateTimeFilterChanged(IColumn<TDataItem> column, DateTimeOffset? value)
    {
        column.DateTimeFilter = value;
        SetFilterQuery();
    }

    private void OnFilterChanged(IColumn<TDataItem> column, string? value)
    {
        column.TextFilter = value;
        SetFilterQuery();
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
            else
            {
                return;
            }
            await LoadItemsAsync();
        }
        await CurrentPageChanged.InvokeAsync();
        SetOffsetQuery();
    }

    private async Task OnNextPageAsync()
    {
        if (LoadItems is null)
        {
            Offset += RowsPerPage;
            CurrentPage++;
        }
        else if (CurrentDataPage?.HasMore != false)
        {
            Offset += RowsPerPage;
            CurrentPage++;
            await LoadItemsAsync();
        }
        else
        {
            return;
        }
        await CurrentPageChanged.InvokeAsync();
        SetOffsetQuery();
    }

    private void OnNumberFilterChanged(IColumn<TDataItem> column, double? value)
    {
        column.NumberFilter = value;
        SetFilterQuery();
    }

    private async Task OnPageChangedAsync(ulong value)
    {
        CurrentPage = value;
        Offset = CurrentPage * RowsPerPage;
        if (LoadItems is not null)
        {
            await LoadItemsAsync();
        }
        await CurrentPageChanged.InvokeAsync();
        SetOffsetQuery();
    }

    private async Task OnSetSelectAllAsync(bool? value)
    {
        var changed = false;
        if (value == true)
        {
            foreach (var item in CurrentPageItems)
            {
                if (item is not null
                    && !SelectedItems.Contains(item))
                {
                    SelectedItems.Add(item);
                    SelectedItem = SelectedItems.FirstOrDefault();
                    changed = true;
                }
            }
        }
        else if (value == false)
        {
            foreach (var item in CurrentPageItems)
            {
                var removed = item is not null
                    && SelectedItems.Remove(item);
                if (removed && SelectedItem?.Equals(item) == true)
                {
                    SelectedItem = default;
                }
                changed |= removed;
            }
        }
        if (changed)
        {
            SelectedItemChanging?.Invoke(this, SelectedItem);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
    }

    private void OnToggleGroupExpansion(IGrouping<string, TDataItem> group)
    {
        if (string.IsNullOrEmpty(group.Key))
        {
            _nullGroupExpanded = !_nullGroupExpanded;
            return;
        }

        if (_groupExpansion.Contains(group.Key))
        {
            _groupExpansion.Remove(group.Key);
        }
        else
        {
            _groupExpansion.Add(group.Key);
        }

        var groupExpansionQueries = GroupExpansionQuery?.ToList();
        groupExpansionQueries?.RemoveAll(x => x.StartsWith(Id));
        if (_groupExpansion.Count > 0)
        {
            groupExpansionQueries ??= [];
            foreach (var groupExpansion in _groupExpansion)
            {
                groupExpansionQueries.Add($"{Id}:{groupExpansion}");
            }
        }
        if (_nullGroupExpanded)
        {
            (groupExpansionQueries ??= []).Add($"{Id}:null");
        }

        NavigationManager.NavigateTo(
            NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [GroupExpansionQueryParamName] = groupExpansionQueries }),
            false,
            true);
    }

    private void RecalculatePaging()
    {
        if (LoadItems is not null)
        {
            return;
        }

        var itemCount = (ulong)ItemCount;
        if (Offset > itemCount)
        {
            Offset = 0;
            CurrentPage = 0;
        }

        PageCount = itemCount / RowsPerPage;
        if (itemCount % RowsPerPage != 0)
        {
            PageCount++;
        }
    }

    private void RefreshRowExpansion()
    {
        _rowCurrentExpansion.Clear();
        foreach (var rowExpansion in RowExpansionQuery?
            .Where(x => x.StartsWith(Id) && x.Length > Id.Length && x[Id.Length] == ':')
            .Select(x => x[(Id.Length + 1)..])
            ?? Enumerable.Empty<string>())
        {
            if (int.TryParse(rowExpansion, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var hash))
            {
                _rowExpansion.Add(hash);
                _rowCurrentExpansion.Add(hash);
            }
        }
    }

    private void Regroup()
    {
        DataGroups = GroupBy is null
            ? null
            : CurrentPageItems
                .GroupBy(GroupBy)
                .ToList();

        if (DataGroups is not null)
        {
            _groupExpansion.Clear();
            foreach (var groupExpansion in GroupExpansionQuery?
                .Where(x => x.StartsWith(Id) && x.Length > Id.Length && x[Id.Length] == ':')
                .Select(x => x[(Id.Length + 1)..])
                ?? Enumerable.Empty<string>())
            {
                if (groupExpansion.Equals("null", StringComparison.Ordinal))
                {
                    _nullGroupExpanded = true;
                    continue;
                }

                var match = DataGroups.Find(x => x.Key.Equals(groupExpansion, StringComparison.Ordinal));
                if (match is not null)
                {
                    _groupExpansion.Add(groupExpansion);
                }
            }
        }

        RecalculatePaging();
        StateHasChanged();
    }

    private void SetFilterQuery()
    {
        var filterQueries = FilterQuery?.ToList();
        filterQueries?.RemoveAll(x => x.StartsWith(Id));

        var filterInfo = GetFilterInfo();
        if (filterInfo is not null)
        {
            var quickFilter = QuickFilter?.Trim('"').Trim();
            if (!string.IsNullOrEmpty(quickFilter))
            {
                (filterQueries ??= []).Add(new StringBuilder(Id)
                    .Append(";quick;'")
                    .Append(quickFilter)
                    .Append('\'')
                    .ToString());
            }
            foreach (var filter in filterInfo)
            {
                var query = new StringBuilder(Id)
                    .Append(':')
                    .Append(filter.Property);
                if (filter.DateTimeFilterIsBefore)
                {
                    query.Append(";before");
                }
                if (filter.ExactMatch)
                {
                    query.Append(";exact");
                }
                if (filter.BoolFilter.HasValue)
                {
                    query.Append(";'")
                        .Append(filter.BoolFilter.Value)
                        .Append('\'');
                }
                else if (filter.DateTimeFilter.HasValue)
                {
                    query.Append(";'")
                        .Append(filter.DateTimeFilter.Value.ToString(filter.DateFormat, CultureInfo.InvariantCulture))
                        .Append('\'');
                }
                else if (filter.NumberFilter.HasValue)
                {
                    query.Append(";'")
                        .Append(filter.NumberFilter.Value)
                        .Append('\'');
                }
                else if (!string.IsNullOrEmpty(filter.TextFilter))
                {
                    query.Append(";'")
                        .Append(filter.TextFilter)
                        .Append('\'');
                }
                (filterQueries ??= []).Add(query.ToString());
            }
        }

        NavigationManager.NavigateTo(
            NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [FilterQueryParamName] = filterQueries }),
            false,
            true);
    }

    private void SetOffsetQuery()
    {
        var offsetQueries = OffsetQuery?.ToList();
        offsetQueries?.RemoveAll(x => x.StartsWith(Id));

        if (Offset > 0)
        {
            (offsetQueries ??= []).Add($"{Id}:{Offset}");
        }

        NavigationManager.NavigateTo(
            NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [RowsPerPageQueryParamName] = offsetQueries }));
    }

    private void SetRowsPerPageQuery()
    {
        var rowsQueries = RowsPerPageQuery?.ToList();
        rowsQueries?.RemoveAll(x => x.StartsWith(Id));
        (rowsQueries ??= []).Add($"{Id}:{RowsPerPage}");

        NavigationManager.NavigateTo(
            NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [RowsPerPageQueryParamName] = rowsQueries }),
            false,
            true);
    }

    private void SetSortQuery()
    {
        var sortQueries = SortQuery?.ToList();
        sortQueries?.RemoveAll(x => x.StartsWith(Id));

        var sortInfo = GetSortInfo();
        if (sortInfo is not null)
        {
            for (var i = 0; i < sortInfo.Length; i++)
            {
                var query = new StringBuilder(Id)
                    .Append(':')
                    .Append(sortInfo[i].Property);
                if (sortInfo[i].Descending)
                {
                    query.Append(";desc");
                }
                if (i > 0)
                {
                    query.Append(";p-")
                        .Append(i);
                }
                (sortQueries ??= []).Add(query.ToString());
            }
        }

        NavigationManager.NavigateTo(
            NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [SortQueryParamName] = sortQueries }),
            false,
            true);
    }

    private async Task ShowColumnFilterDialogAsync()
    {
        await DialogService.Show<ColumnFilterDialog>(
            "Select Columns",
            new DialogParameters
            {
                { nameof(ColumnFilterDialog.Columns), _columns.Cast<IColumn>().ToList() },
            }).Result;
        await LoadItemsAsync();
    }

    private async Task ShowEditDialogAsync(TDataItem? item = default, bool adding = false)
    {
        var result = await DialogService.Show<EditDialog<TDataItem>>(
            adding ? "Add" : "Edit",
            new DialogParameters
            {
                { "Columns", _columns },
                { "EditedItem", item },
            }).Result;
        if (result.Choice != DialogChoice.Ok
            || result.Data is not TDataItem editedItem
            || editedItem is null)
        {
            return;
        }

        if (adding)
        {
            var success = true;
            if (ItemAdded is not null)
            {
                success = await ItemAdded.Invoke(editedItem);
            }
            if (success)
            {
                if (LoadItems is null)
                {
                    Items.Add(editedItem);
                }
                else if (CurrentDataPage is null)
                {
                    await LoadItemsAsync();
                }
                else
                {
                    CurrentDataPage.Items.Add(editedItem);
                }
            }
        }
        else if (ItemSaved is not null)
        {
            await ItemSaved.Invoke(editedItem);
        }
    }

    private async Task ShowExportDialogAsync()
    {
        var result = await DialogService.Show<ExportDialog>(
            "Export",
            new DialogParameters
            {
                { nameof(ExportDialog.ShowPdf), PdfExport is not null },
            }).Result;
        if (result.Choice != DialogChoice.Ok
            || result.Data is not ExportData data)
        {
            return;
        }

        IsLoading = true;
        StateHasChanged();

        var stream = data.FileType switch
        {
            ExportFileType.CSV => await GetCSVAsync(),
            ExportFileType.Excel => await GetExcelAsync(),
            ExportFileType.HTML => await GetHTMLAsync(data.FileName),
            ExportFileType.PDF => await GetPDFAsync(),
            _ => null,
        };
        if (stream is null)
        {
            if (data.FileType != ExportFileType.PDF)
            {
                await DialogService.ShowMessageBox("Export too large", new()
                {
                    Message = new(
@"<p>This query resulted in too many results to export.</p>
<p>Try narrowing down the data by searching for the information you need, using the filter controls in the column headers.</p>"),
                });
            }
            return;
        }

        var type = data.FileType switch
        {
            ExportFileType.CSV => "text/csv",
            ExportFileType.Excel => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ExportFileType.HTML => "text/html",
            ExportFileType.PDF => "application/pdf",
            _ => "text/plain",
        };
        var extension = data.FileType switch
        {
            ExportFileType.CSV => "csv",
            ExportFileType.Excel => "xlsx",
            ExportFileType.HTML => "html",
            ExportFileType.PDF => "pdf",
            _ => "txt",
        };

        string title;
        if (!string.IsNullOrWhiteSpace(data.FileName))
        {
            title = data.FileName.Trim();
        }
        else if (!string.IsNullOrWhiteSpace(Title))
        {
            title = Title.Trim();
        }
        else
        {
            title = $"exported_{typeof(TDataItem).Name}_data";
        }
        var fileName = $"{title}.{extension}";
        using var streamReference = new DotNetStreamReference(stream);
        try
        {
            if (data.FileType is ExportFileType.HTML
                or ExportFileType.PDF)
            {
                var url = await UtilityService.OpenAsync(fileName, type, streamReference, false);
                if (!string.IsNullOrEmpty(url))
                {
                    _objectUrls.Add(url);
                }
            }
            else
            {
                await UtilityService.DownloadAsync(fileName, type, streamReference);
            }
        }
        finally
        {
            stream.Dispose();
            IsLoading = false;
            StateHasChanged();
        }
    }

    private async Task<IEnumerable<TDataItem>?> TryGetAllItemsAsync()
    {
        if (LoadItems is null)
        {
            return CurrentItems;
        }

        var results = await LoadItems.Invoke(new(
            0,
            0,
            GetFilterInfo(true),
            GetSortInfo(true)));
        if (results.HasMore)
        {
            return null;
        }
        return results.Items;
    }

    private async Task<bool> TrySaveEditAsync()
    {
        if (EditingRow is not null)
        {
            if (ItemSaved is not null)
            {
                var success = await ItemSaved.Invoke(EditingRow.Item);
                if (!success && TableEditForm is not null)
                {
                    await TableEditForm.ResetAsync();
                }
            }
            EditingRow = null;
        }
        return true;
    }
}