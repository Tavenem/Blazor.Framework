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

    /// <summary>
    /// <para>
    /// Sets the allowed drag effects for drag operations with list items.
    /// </para>
    /// <para>
    /// Defaults to <see cref="DragEffect.CopyMove"/> for list items, but defers to parent lists.
    /// </para>
    /// </summary>
    [Parameter] public DragEffect DragEffectAllowed { get; set; } = DragEffect.CopyMove;

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

    /// <summary>
    /// <para>
    /// Whether the items in this list can be dragged.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>, but defers to a parent list.
    /// </para>
    /// <para>
    /// Both this and <see cref="DropTarget{TDropItem}.IsDropTarget"/> must be <see
    /// langword="true"/> in order to enable re-ordering items within the same list.
    /// </para>
    /// </summary>
    [Parameter] public bool IsDragStart { get; set; }

    /// <summary>
    /// A function which returns any CSS class(es) for an item.
    /// </summary>
    [Parameter] public Func<TListItem, string?>? ItemClass { get; set; }

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
    public TListItem? SelectedItem => _selectedItems.FirstOrDefault();

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
    public IEnumerable<TListItem> SelectedItems => _selectedItems;

    /// <summary>
    /// Invoked when <see cref="SelectedItems"/> changes.
    /// </summary>
    [Parameter] public EventCallback<IEnumerable<TListItem>> SelectedItemsChanged { get; set; }

    /// <summary>
    /// If <see langword="true"/> an icon is shown before the content of list items which toggles
    /// their selection state, and the item itself is not clickable.
    /// </summary>
    [Parameter] public bool SelectionIcons { get; set; }

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

    /// <summary>
    /// <para>
    /// If <see langword="true"/> the icon of selected items will display a
    /// checkmark (replacing any existing icon).
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>, but defers to the parent list.
    /// </para>
    /// </summary>
    [Parameter] public bool ShowSelectionIcon { get; set; }

    /// <summary>
    /// <para>
    /// A template used to generate list items.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> each item's <see cref="object.ToString"/>
    /// method will be used to generate its content.
    /// </para>
    /// </summary>
    [Parameter] public virtual RenderFragment<TListItem>? Template { get; set; }

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

    internal DragEffect DragEffectAllowedValue => ParentList?.DragEffectAllowed ?? DragEffectAllowed;

    internal bool IsDragStartValue => IsDragStart || ParentList?.IsDragStart == true;

    internal bool ShowSelectionIconValue => ShowSelectionIcon || ParentList?.ShowSelectionIconValue == true;

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("list")
        .Add("can-drag", IsDragStartValue)
        .Add(CanDropClass, HasValidDrop)
        .Add("self-drop", HasValidDrop && NoDropTargetChildren)
        .Add(NoDropClass, DragDropListener.DropValid == false)
        .ToString();

    /// <summary>
    /// The list to which this one belongs, if any.
    /// </summary>
    [CascadingParameter] protected ElementList<TListItem>? ParentList { get; set; }

    /// <summary>
    /// The template used to generate list items.
    /// </summary>
    protected RenderFragment<TListItem>? TemplateValue => Template ?? ParentList?.TemplateValue;

    private protected bool NoDropTargetChildren => _dropTargetElements.Count == 0;

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var selectedItemChanged = false;
        TListItem? newSelectedItem = default;
        if (!parameters.TryGetValue<IEnumerable<TListItem>>(nameof(SelectedItems), out var newSelectedItems)
            && parameters.TryGetValue(nameof(SelectedItem), out newSelectedItem)
            && !EqualityComparer<TListItem>.Default.Equals(newSelectedItem, SelectedItem))
        {
            selectedItemChanged = true;
        }

        await base.SetParametersAsync(parameters);

        if (newSelectedItems is not null)
        {
            await SetSelectionAsync(newSelectedItems);
        }
        else if (selectedItemChanged)
        {
            await SetSelectionAsync(newSelectedItem);
        }
    }

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
    public async Task SetSelectionAsync(TListItem? selectedItem)
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

        var hadSelection = _selectedItems.Count > 0;
        _selectedItems.Clear();

        if (selectedItem is null
            || Items?.Contains(selectedItem) != true)
        {
            if (hadSelection)
            {
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
                StateHasChanged();
            }
            return;
        }

        _selectedItems.Add(selectedItem);
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
    public async Task SetSelectionAsync(IEnumerable<TListItem> selectedItems)
    {
        if (Items is null
            || (!_selectedItems.Except(selectedItems).Any()
            && !selectedItems.Except(_selectedItems).Any()))
        {
            return;
        }

        _selectedItems.Clear();
        _selectedItems.AddRange(selectedItems.Intersect(Items));
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
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
        if (!GetIsDropTarget())
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

    internal override bool GetIsDropTarget() => IsDropTarget || ParentList?.GetIsDropTarget() == true;

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
        if (_selectedItems.Contains(item))
        {
            _selectedItems.Remove(item);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
        if (Items?.Contains(item) == true)
        {
            Items.Remove(item);
            await ItemsChanged.InvokeAsync(Items);
        }
        StateHasChanged();
    }

    private protected override DragEffect GetDropEffectInternal(string[] types)
        => GetDropEffectShared(types);

    private protected override async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!GetIsDropTarget())
        {
            return;
        }

        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(new(e));
            return;
        }

        var item = DragDropService.TryGetData<TListItem>(e);
        if (item is not null)
        {
            (Items ??= new()).Add(item);
            await ItemsChanged.InvokeAsync(Items);
            StateHasChanged();
        }
    }
}