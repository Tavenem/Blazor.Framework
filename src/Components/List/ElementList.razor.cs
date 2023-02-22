using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Components.List;
using Tavenem.Blazor.Framework.InternalComponents;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collection of <see cref="ListItem{T}"/> items with bindable selection,
/// and drag-drop support.
/// </summary>
public partial class ElementList<TListItem> : DropTarget<TListItem>
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
    /// <para>
    /// Invoked when a drag operation starts for a list item, to get the data to be dragged, and the
    /// allowed drop type.
    /// </para>
    /// <para>
    /// If not set, defaults to returning the list item itself.
    /// </para>
    /// </summary>
    [Parameter] public Func<TListItem, DragStartData>? GetItemDragData { get; set; }

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
    /// Invoked when an item is dropped on an item in this list.
    /// </summary>
    [Parameter] public EventCallback<DropIndexEventArgs> OnDropIndex { get; set; }

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
    [Parameter] public TListItem? SelectedItem { get; set; }

    /// <summary>
    /// Invoked when <see cref="SelectedItem"/> changes.
    /// </summary>
    [Parameter] public EventCallback<TListItem?> SelectedItemChanged { get; set; }

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
    [Parameter] public List<TListItem> SelectedItems { get; set; } = new();

    /// <summary>
    /// Invoked when <see cref="SelectedItems"/> changes.
    /// </summary>
    [Parameter] public EventCallback<List<TListItem>> SelectedItemsChanged { get; set; }

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

    internal RenderFragment<TListItem>? CollapsibleTemplateValue
        => CollapsibleTemplate ?? ParentList?.CollapsibleTemplateValue;

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
    /// The items in the list.
    /// </summary>
    protected List<ListData<TListItem>> ListItems { get; set; } = new();

    /// <summary>
    /// The list to which this one belongs, if any.
    /// </summary>
    [CascadingParameter] protected ElementList<TListItem>? ParentList { get; set; }

    /// <summary>
    /// The template used to generate list items.
    /// </summary>
    protected RenderFragment<TListItem>? TemplateValue => Template ?? ParentList?.TemplateValue;

    private protected bool NoDropTargetChildren => _dropTargetElements.Count == 0;

    private int? DropIndex { get; set; }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var itemsChanged = false;
        if (parameters.TryGetValue<List<TListItem>?>(nameof(Items), out var newItems)
            && (((newItems is null) != (Items is null))
            || (Items is not null
            && !newItems!.SequenceEqual(Items))))
        {
            itemsChanged = true;
        }

        var selectedItemChanged = false;
        if (parameters.TryGetValue<TListItem>(nameof(SelectedItem), out var newSelectedItem)
            && !EqualityComparer<TListItem>.Default.Equals(newSelectedItem, SelectedItem))
        {
            selectedItemChanged = true;
        }

        var selectedItemsChanged = false;
        if (parameters.TryGetValue<List<TListItem>>(nameof(SelectedItems), out var newSelectedItems)
            && !newSelectedItems.SequenceEqual(SelectedItems))
        {
            selectedItemsChanged = true;
        }

        await base.SetParametersAsync(parameters);

        var listItemsChanged = itemsChanged || ListItems.Count != (Items?.Count ?? 0);
        if (!listItemsChanged)
        {
            for (var i = 0; i < ListItems.Count; i++)
            {
                if (!EqualityComparer<TListItem>
                    .Default
                    .Equals(ListItems[i].Item, Items![i]))
                {
                    listItemsChanged = true;
                    break;
                }
            }
        }
        if (listItemsChanged)
        {
            ListItems = Items?
                .Where(x => x is not null)
                .Select(x => new ListData<TListItem>(x!))
                .ToList() ?? new();
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
        if (Items is null)
        {
            if (SelectedItems.Count > 0)
            {
                SelectedItem = default;
                SelectedItems.Clear();
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
            return;
        }

        var remaining = SelectedItems.Intersect(Items).ToList();
        if (remaining.Count == SelectedItems.Count)
        {
            return;
        }
        SelectedItems.Clear();
        SelectedItems.AddRange(remaining);
        SelectedItem = SelectedItems.FirstOrDefault();

        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
    }

    /// <summary>
    /// Sets the currently selected item.
    /// </summary>
    /// <param name="selectedItem">
    /// The item to set as the current selection.
    /// </param>
    public async Task SetSelectionAsync(TListItem? selectedItem)
    {
        if (SelectedItems.Count == 0
            && selectedItem is null)
        {
            return;
        }

        if (SelectedItems.Count == 1
            && SelectedItems[0]?.Equals(selectedItem) == true)
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
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
                StateHasChanged();
            }
            return;
        }

        SelectedItem = selectedItem;
        SelectedItems.Add(selectedItem);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    /// <summary>
    /// Sets the currently selected items.
    /// </summary>
    /// <param name="selectedItems">
    /// The items to set as the current selection.
    /// </param>
    public async Task SetSelectionAsync(List<TListItem>? selectedItems)
    {
        selectedItems ??= new();
        if (Items is null
            || (!SelectedItems.Except(selectedItems).Any()
            && !selectedItems.Except(SelectedItems).Any()))
        {
            return;
        }

        SelectedItems.Clear();
        SelectedItems.AddRange(selectedItems);
        SelectedItem = SelectedItems.FirstOrDefault();

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

        var hasListItem = types.Contains($"application/json-{typeof(TListItem).Name.ToLowerInvariant()}");
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

    internal int? IndexOfListId(Guid id) => ListItems.FindIndex(x => x.ListId == id);

    internal void InsertItem(int? index) => DropIndex = index;

    internal async ValueTask OnToggleItemSelectionAsync(TListItem? item, bool force = false)
    {
        if (item is null
            || SelectionType == SelectionType.None)
        {
            await OnItemClick.InvokeAsync(item);
            return;
        }

        if (SelectedItems.Contains(item))
        {
            if (force || !Required || SelectedItems.Count > 1)
            {
                if (SelectedItems.IndexOf(item) == 0)
                {
                    SelectedItem = default;
                    await SelectedItemChanged.InvokeAsync(SelectedItem);
                }
                SelectedItems.Remove(item);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
        }
        else
        {
            if (SelectionType == SelectionType.Single && SelectedItems.Count > 0)
            {
                SelectedItems.Clear();
            }
            SelectedItems.Add(item);
            SelectedItem = SelectedItems.FirstOrDefault();
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }

        await OnItemClick.InvokeAsync(item);
        StateHasChanged();
    }

    internal async Task RemoveListIdAsync(Guid id)
    {
        var item = ListItems.Find(x => x.ListId == id);
        if (item is null)
        {
            return;
        }
        if (SelectedItems.Contains(item.Item))
        {
            if (SelectedItems.IndexOf(item.Item) == 0)
            {
                SelectedItem = default;
                await SelectedItemChanged.InvokeAsync(SelectedItem);
            }
            SelectedItems.Remove(item.Item);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
        ListItems.Remove(item);
        if (Items is not null)
        {
            Items.Remove(item.Item);
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
            if (DropIndex.HasValue)
            {
                (Items ??= new()).Insert(DropIndex.Value, item);
                ListItems.Insert(DropIndex.Value, new(item));
                DropIndex = null;
            }
            else
            {
                (Items ??= new()).Add(item);
                ListItems.Add(new(item));
            }
            await ItemsChanged.InvokeAsync(Items);
            StateHasChanged();
        }
    }
}