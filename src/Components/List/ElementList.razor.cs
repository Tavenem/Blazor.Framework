using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.InternalComponents;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collection of <see cref="ListItem{T}"/> items with bindable selection,
/// and drag-drop support.
/// </summary>
public partial class ElementList<TListItem>
{
    private readonly HashSet<string> _dropTargetElements = new();

    /// <summary>
    /// <para>
    /// A template used to generate the collapsible content of collapsible list items.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> each item's <see cref="object.ToString"/> method will be used
    /// to generate its collapsible content.
    /// </para>
    /// <para>
    /// Ignored for items which do not generate a <see langword="true"/> result from <see
    /// cref="ItemIsCollapsible"/>.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<TListItem>? CollapsibleTemplate { get; set; }

    private DragEffect _dragEffectAllowed = DragEffect.CopyMove;
    /// <summary>
    /// <para>
    /// Sets the allowed drag effects for drag operations with list items.
    /// </para>
    /// <para>
    /// Defaults to <see cref="DragEffect.CopyMove"/> for list items, but defers to parent lists.
    /// </para>
    /// </summary>
    [Parameter]
    public DragEffect DragEffectAllowed
    {
        get => ParentList?.DragEffectAllowed ?? _dragEffectAllowed;
        set => _dragEffectAllowed = value;
    }

    /// <summary>
    /// <para>
    /// A CSS class applied to the placeholder item displayed at the position in the list where a
    /// drop will occur.
    /// </para>
    /// <para>
    /// Defaults to "drop-placeholder".
    /// </para>
    /// </summary>
    [Parameter] public string? DropPlaceholderClass { get; set; } = "drop-placeholder";

    /// <summary>
    /// Content which should follow the items in the list.
    /// </summary>
    [Parameter] public RenderFragment? FollowingContent { get; set; }

    /// <summary>
    /// A function which returns the name of the icon to be displayed before an
    /// item's content.
    /// </summary>
    [Parameter] public Func<TListItem, string?>? Icon { get; set; }

    /// <summary>
    /// A function which returns any CSS class(es) for the icon displayed before
    /// an item's content.
    /// </summary>
    [Parameter] public Func<TListItem, string?>? IconClass { get; set; }

    private bool _isDragStart;
    /// <summary>
    /// <para>
    /// Whether the items in this list can be dragged.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>, but defers to a parent list.
    /// </para>
    /// <para>
    /// Both this and <see cref="IsDropTarget"/> must be <see langword="true"/>
    /// in order to enable re-ordering items within the same list.
    /// </para>
    /// </summary>
    [Parameter]
    public bool IsDragStart
    {
        get => _isDragStart || ParentList?.IsDragStart == true;
        set => _isDragStart = value;
    }

    private bool _isDropTarget;
    /// <summary>
    /// <para>
    /// Whether this drop target is accepting drops.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>, but defers to a parent list.
    /// </para>
    /// <para>
    /// Both this and <see cref="IsDragStart"/> must be <see langword="true"/>
    /// in order to enable re-ordering items within the same list.
    /// </para>
    /// </summary>
    [Parameter]
    public override bool IsDropTarget
    {
        get => _isDropTarget || ParentList?.IsDropTarget == true;
        set => _isDropTarget = value;
    }

    /// <summary>
    /// A function which returns any CSS class(es) for an item.
    /// </summary>
    [Parameter] public Func<TListItem, string?>? ItemClass { get; set; }

    private string? _itemDraggingClass;
    /// <summary>
    /// An additional class that is applied to list items when one is being dragged.
    /// </summary>
    [Parameter]
    public string? ItemDraggingClass
    {
        get => _itemDraggingClass ?? ParentList?.ItemDraggingClass;
        set => _itemDraggingClass = value;
    }

    /// <summary>
    /// <para>
    /// A function which indicates whether an item is collapsible.
    /// </para>
    /// <para>
    /// Useful for items which contain their own sublists.
    /// </para>
    /// <para>
    /// Always <see langword="false"/> if the item data bound to a list item is
    /// <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public virtual Func<TListItem, bool>? ItemIsCollapsible { get; set; }

    /// <summary>
    /// <para>
    /// A function which indicates whether an item is disabled.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/> if left <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TListItem, bool>? ItemIsDisabled { get; set; }

    /// <summary>
    /// <para>
    /// A function which indicates whether an item can be dragged.
    /// </para>
    /// <para>
    /// Ignored if <see cref="IsDragStart"/> is <see langword="false"/>.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/> if left <see langword="null"/>.
    /// </para>
    /// <para>
    /// Always <see langword="false"/> if the item data bound to a list item is
    /// <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TListItem, bool>? ItemIsDraggable { get; set; }

    /// <summary>
    /// The items bound to this list.
    /// </summary>
    [Parameter] public List<TListItem>? Items { get; set; }

    /// <summary>
    /// Raised when the items list changes.
    /// </summary>
    [Parameter] public EventCallback<List<TListItem>?> ItemsChanged { get; set; }

    /// <summary>
    /// A function which returns any CSS style(s) for an item.
    /// </summary>
    [Parameter] public Func<TListItem, string?>? ItemStyle { get; set; }

    /// <summary>
    /// <para>
    /// A function which returns one of the built-in color themes for an item.
    /// </para>
    /// <para>
    /// Defaults to <see cref="ThemeColor.None"/> if not provided.
    /// </para>
    /// <para>
    /// Always <see cref="ThemeColor.None"/> if the item data bound to a list
    /// item is <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TListItem, ThemeColor>? ItemThemeColor { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when a drop operation completes with a list item as the dropped item (including by
    /// cancellation).
    /// </para>
    /// <para>
    /// The argument parameter indicates which drag effect was ultimately selected for the drag-drop
    /// operation.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<DragEffect> OnDropped { get; set; }

    /// <summary>
    /// Invoked when an item is clicked.
    /// </summary>
    [Parameter] public EventCallback<TListItem?> OnItemClick { get; set; }

    /// <summary>
    /// <para>
    /// If <see langword="true"/> at least one item must remain selected.
    /// </para>
    /// <para>
    /// Note: does not force any initial selection, or restrict the programmatic removal of items.
    /// Only restricts de-selection by user interaction.
    /// </para>
    /// </summary>
    [Parameter] public bool Required { get; set; }

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
    [Parameter]
    public TListItem? SelectedItem
    {
        get => SelectedItems.FirstOrDefault();
        set => _ = SetSelectionAsync(value);
    }

    /// <summary>
    /// Invoked when <see cref="SelectedItem"/> changes.
    /// </summary>
    [Parameter] public EventCallback<TListItem?> SelectedItemChanged { get; set; }

    private readonly List<TListItem> _selectedItems = new();
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
    [Parameter]
    public IEnumerable<TListItem> SelectedItems
    {
        get => _selectedItems;
        set => _ = SetSelectionAsync(value);
    }

    /// <summary>
    /// Invoked when <see cref="SelectedItems"/> changes.
    /// </summary>
    [Parameter] public EventCallback<IEnumerable<TListItem>> SelectedItemsChanged { get; set; }

    /// <summary>
    /// The type of item selection from this list.
    /// </summary>
    [Parameter] public SelectionType SelectionType { get; set; }

    /// <summary>
    /// <para>
    /// A function which indicates whether to show a separator after this item.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/> if not provided.
    /// </para>
    /// <para>
    /// Always <see langword="false"/> if the item data bound to a list item is
    /// <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TListItem, bool>? SeparatorAfter { get; set; }

    /// <summary>
    /// <para>
    /// A function which indicates whether to show a separator before this item.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/> if not provided.
    /// </para>
    /// <para>
    /// Always <see langword="false"/> if the item data bound to a list item is
    /// <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TListItem, bool>? SeparatorBefore { get; set; }

    private bool _showSelectionIcon;
    /// <summary>
    /// <para>
    /// If <see langword="true"/> the icon of selected items will display a
    /// checkmark (replacing any existing icon).
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>, but defers to the parent list.
    /// </para>
    /// </summary>
    [Parameter]
    public bool ShowSelectionIcon
    {
        get => _showSelectionIcon || ParentList?.ShowSelectionIcon == true;
        set => _showSelectionIcon = value;
    }

    private RenderFragment<TListItem>? _template;
    /// <summary>
    /// <para>
    /// A template used to generate list items.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> each item's <see cref="object.ToString"/>
    /// method will be used to generate its content.
    /// </para>
    /// </summary>
    [Parameter]
    public virtual RenderFragment<TListItem>? Template
    {
        get => _template ?? ParentList?.Template;
        set => _template = value;
    }

    private ThemeColor _themeColor;
    /// <summary>
    /// <para>
    /// One of the built-in color themes.
    /// </para>
    /// <para>
    /// Defers to the parent list if <see cref="ThemeColor.None"/>.
    /// </para>
    /// </summary>
    public ThemeColor ThemeColor
    {
        get => _themeColor == ThemeColor.None
            ? ParentList?.ThemeColor ?? ThemeColor.None
            : _themeColor;
        set => _themeColor = value;
    }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("list")
        .Add("can-drag", IsDragStart)
        .Add(CanDropClass, HasValidDrop)
        .Add("self-drop", HasValidDrop && NoDropTargetChildren)
        .Add(NoDropClass, DragDropListener.DropValid == false)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The list to which this one belongs, if any.
    /// </summary>
    [CascadingParameter] protected ElementList<TListItem>? ParentList { get; set; }

    private protected bool NoDropTargetChildren => _dropTargetElements.Count == 0;

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in the render
    /// tree, and the incoming values have been assigned to properties.
    /// </summary>
    /// <returns>A <see cref="Task" /> representing any asynchronous operation.</returns>
    protected override async Task OnParametersSetAsync()
    {
        if (Items is null)
        {
            if (_selectedItems.Count > 0)
            {
                _selectedItems.Clear();
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
            return;
        }

        var remaining = _selectedItems.Intersect(Items).ToList();
        if (remaining.Count == _selectedItems.Count)
        {
            return;
        }
        _selectedItems.Clear();
        _selectedItems.AddRange(remaining);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
    }

    internal void AddDropTarget(string id)
    {
        _dropTargetElements.Add(id);
        StateHasChanged();
    }

    internal void ClearDropTarget(string id)
    {
        _dropTargetElements.Remove(id);
        StateHasChanged();
    }

    internal void DragEnded(string? id)
    {
        if (!string.IsNullOrEmpty(id))
        {
            _dropTargetElements.Remove(id);
        }
        ParentList?.DragEnded(id);
        StateHasChanged();
    }

    internal DragEffect GetDropEffectShared(string[] types)
    {
        if (!IsDropTarget)
        {
            return DragEffect.None;
        }

        var hasListItem = types.Contains($"application/json-{typeof(TListItem).Name}");
        if (!hasListItem
            && types.Any(x => x.StartsWith("application/json-")))
        {
            return DragEffect.None;
        }

        return GetDropEffect?.Invoke(types)
            ?? (OnDrop.HasDelegate
            || hasListItem
            || typeof(TListItem) == typeof(string)
            ? DragEffect.All
            : DragEffect.None);
    }

    internal int? IndexOfItem(TListItem? item) => item is null ? null : Items?.IndexOf(item);

    internal async Task InsertItemAsync(TListItem item, int? index)
    {
        if (index.HasValue)
        {
            (Items ??= new()).Insert(index.Value, item);
        }
        else
        {
            (Items ??= new()).Add(item);
        }
        await ItemsChanged.InvokeAsync(Items);
        StateHasChanged();
    }

    internal async ValueTask OnToggleItemSelectionAsync(TListItem? item, bool force = false)
    {
        if (item is null
            || SelectionType == SelectionType.None)
        {
            await OnItemClick.InvokeAsync(item);
            return;
        }

        if (_selectedItems.Contains(item))
        {
            if (force || !Required || _selectedItems.Count > 1)
            {
                _selectedItems.Remove(item);
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
        }
        else
        {
            if (SelectionType == SelectionType.Single && _selectedItems.Count > 0)
            {
                _selectedItems.Clear();
            }
            _selectedItems.Add(item);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }

        await OnItemClick.InvokeAsync(item);
        StateHasChanged();
    }

    internal async Task RemoveItemAsync(TListItem item)
    {
        if (Items?.Contains(item) == true)
        {
            if (_selectedItems.Contains(item))
            {
                _selectedItems.Remove(item);
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
            Items.Remove(item);
            await ItemsChanged.InvokeAsync(Items);
        }
        StateHasChanged();
    }

    private protected override DragEffect GetDropEffectInternal(string[] types)
        => GetDropEffectShared(types);

    private protected override async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!IsDropTarget)
        {
            return;
        }

        var item = DragDropService.TryGetData<TListItem>(e);

        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(new()
            {
                Data = e,
                Item = item,
            });
        }
        else if (item is not null)
        {
            (Items ??= new()).Add(item);
            await ItemsChanged.InvokeAsync(Items);
            StateHasChanged();
        }
    }

    private async Task SetSelectionAsync(TListItem? selectedItem)
    {
        if (_selectedItems.Count == 0
            && selectedItem is null)
        {
            return;
        }

        if (_selectedItems.Count == 1
            && _selectedItems[0]?.Equals(selectedItem) == true)
        {
            return;
        }

        _selectedItems.Clear();
        if (selectedItem is not null)
        {
            _selectedItems.Add(selectedItem);
        }
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    private async Task SetSelectionAsync(IEnumerable<TListItem> selectedItems)
    {
        if (!_selectedItems.Except(selectedItems).Any()
            && !selectedItems.Except(_selectedItems).Any())
        {
            return;
        }
        _selectedItems.Clear();
        _selectedItems.AddRange(selectedItems);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }
}