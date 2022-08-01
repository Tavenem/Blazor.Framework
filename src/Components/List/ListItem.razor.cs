using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// Displays an item in a list, with support for simple theming.
/// </summary>
public partial class ListItem<TListItem> : DraggableDropTarget<TListItem, TListItem>
{
    /// <summary>
    /// Whether this item is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// The name of the icon to be displayed before this item's content.
    /// </summary>
    [Parameter] public string? Icon { get; set; }

    /// <summary>
    /// <para>
    /// Whether this item is collapsible.
    /// </para>
    /// <para>
    /// Useful for items which contain their own sublists.
    /// </para>
    /// </summary>
    [Parameter] public bool IsCollapsible { get; set; }

    /// <summary>
    /// Indicates whether this item has been selected.
    /// </summary>
    public bool IsSelected => ParentSelectedItems?.Contains(Item) == true;

    /// <summary>
    /// A unique identifier within the list.
    /// </summary>
    [Parameter] public Guid ListId { get; set; }

    /// <summary>
    /// Invoked when an item is dropped on this item in a list.
    /// </summary>
    [Parameter] public EventCallback<DropIndexEventArgs> OnDropIndex { get; set; }

    /// <summary>
    /// Whether to show a separator after this item.
    /// </summary>
    [Parameter] public bool SeparatorAfter { get; set; }

    /// <summary>
    /// Whether to show a separator before this item.
    /// </summary>
    [Parameter] public bool SeparatorBefore { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    internal string? DropPlaceholderClass => ElementList?.DropPlaceholderClass;

    internal bool IsListDraggable => ElementList?.IsDragStartValue == true;

    /// <summary>
    /// The final value assigned to the class attribute of a collapse used to
    /// indicate a list of child items, including component values.
    /// </summary>
    protected string? CollapseClass => new CssBuilder()
        .Add(ThemeColorValue.ToCSS())
        .Add(ClassName)
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .Add(ClassName)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add(ThemeColorValue.ToCSS())
        .Add(
            "clickable",
            ElementList?.OnItemClick.HasDelegate == true
                || (ElementList?.SelectionType != SelectionType.None
                && ElementList?.SelectionIcons != true))
        .Add("selectable", ElementList?.SelectionIcons == true)
        .Add("active", IsSelected)
        .Add("no-drag", IsListDraggable && !GetIsDraggable())
        .Add("disabled", DisabledValue)
        .ToString();

    /// <summary>
    /// The list to which this item belongs, if any.
    /// </summary>
    [CascadingParameter] protected ElementList<TListItem>? ElementList { get; set; }

    /// <summary>
    /// The selected items of the list to which this item belongs, if any.
    /// </summary>
    [CascadingParameter] protected IEnumerable<TListItem>? ParentSelectedItems { get; set; }

    private protected string? ClassName
    {
        get
        {
            if (Item is null
                || ElementList?.ItemClass is null)
            {
                return null;
            }
            return ElementList.ItemClass(Item);
        }
    }

    private protected bool DisabledValue => Disabled
        || (Item is not null
        && ElementList?.ItemIsDisabled?.Invoke(Item) == true);

    private protected string? IconClassName
    {
        get
        {
            if (ElementList is null)
            {
                return null;
            }
            if (ElementList.SelectionIcons)
            {
                return "outlined";
            }
            return (ElementList.ShowSelectionIconValue
                && IsSelected)
                || Item is null
                || ElementList.Icon is null
                || ElementList.IconClass is null
                ? null
                : ElementList.IconClass(Item);
        }
    }

    private protected string? IconName
    {
        get
        {
            if (ElementList?.SelectionIcons == true)
            {
                return IsSelected
                    ? DefaultIcons.CheckBox_Checked
                    : DefaultIcons.CheckBox_Unchecked;
            }
            if (ElementList?.ShowSelectionIconValue == true
                && IsSelected)
            {
                return DefaultIcons.Selected;
            }
            if (string.IsNullOrEmpty(Icon))
            {
                if (Item is null
                    || ElementList?.Icon is null)
                {
                    return null;
                }
                return ElementList.Icon(Item);
            }
            else
            {
                return Icon;
            }
        }
    }

    private protected bool IsCollapsibleValue => IsCollapsible
        || (Item is not null
        && ElementList?.ItemIsCollapsible?.Invoke(Item) == true);

    private protected bool SeparatorAfterValue => SeparatorAfter
        || (Item is not null
        && (ElementList?.SeparatorAfter?.Invoke(Item) ?? false));

    private protected bool SeparatorBeforeValue => SeparatorBefore
        || (Item is not null
        && (ElementList?.SeparatorBefore?.Invoke(Item) ?? false));

    private protected ThemeColor ThemeColorValue
    {
        get
        {
            if (Item is null
                || ElementList is null)
            {
                return ThemeColor;
            }
            if (IsSelected
                && ElementList.ThemeColor != ThemeColor.None)
            {
                return ElementList.ThemeColor;
            }
            if (ThemeColor == ThemeColor.None)
            {
                return ElementList.ItemThemeColor?.Invoke(Item)
                    ?? ThemeColor.None;
            }
            else
            {
                return ThemeColor;
            }
        }
    }

    private ListItemCollapse<TListItem>? CollapseReference { get; set; }

    private ElementReference ElementReference { get; set; }

    [Inject] private ScrollService ScrollService { get; set; } = default!;

    /// <summary>
    /// Focuses on this list item, and scrolls to it.
    /// </summary>
    public async ValueTask FocusAsync()
    {
        if (CollapseReference is null)
        {
            await ElementReference.FocusAsync();
        }
        else
        {
            await CollapseReference.FocusAsync();
        }
        await ScrollService.ScrollToId(Id);
    }

    internal void DropItem() => ElementList?
        .InsertItem(ElementList.IndexOfListId(ListId));

    internal override DragEffect GetDragEffectAllowed()
        => ElementList?.DragEffectAllowedValue ?? DragEffectAllowed;

    internal override bool GetIsDraggable() => IsDraggable
        && Item is not null
        && IsListDraggable
        && ElementList?.ItemIsDraggable?.Invoke(Item) != false;

    internal override bool GetIsDropTarget() => IsDropTarget && (ElementList?.GetIsDropTarget() ?? false);

    internal async Task ItemDroppedAsync(DragEffect e)
    {
        ElementList?.DragEnded(Id);

        if (OnDropped.HasDelegate)
        {
            await OnDropped.InvokeAsync(e);
        }
        else if (ElementList?.OnDropped.HasDelegate == true)
        {
            await ElementList.OnDropped.InvokeAsync(e);
        }
        else if (e == DragEffect.Move
            && Item is not null
            && ElementList is not null)
        {
            await ElementList.RemoveListIdAsync(ListId);
        }
    }

    private protected override DragEffect GetDropEffectInternal(string[] types)
        => ElementList?.GetDropEffectShared(types)
        ?? DragEffect.None;

    private protected async Task OnClickAsync()
    {
        if (ElementList is not null
            && ElementList.SelectionType != SelectionType.None
            && !ElementList.SelectionIcons)
        {
            await ElementList.OnToggleItemSelectionAsync(Item);
        }
    }

    private protected async Task OnClickIconAsync()
    {
        if (ElementList is not null
            && ElementList.SelectionType != SelectionType.None)
        {
            await ElementList.OnToggleItemSelectionAsync(Item);
        }
    }

    private protected override async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!GetIsDropTarget()
            || ElementList is null)
        {
            return;
        }

        var item = DragDropService.TryGetData<TListItem>(e);

        if (OnDropIndex.HasDelegate)
        {
            await OnDropIndex.InvokeAsync(new(e, ElementList.IndexOfListId(ListId)));
        }
        else if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(new(e));
        }
        else if (item is not null)
        {
            DropItem();
        }
    }

    private protected override async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (!GetIsDraggable())
        {
            return;
        }

        await ItemDroppedAsync(e);
    }

    private protected override void OnDropValidChanged(object? sender, EventArgs e)
    {
        if (ElementList is not null
            && !string.IsNullOrEmpty(Id))
        {
            if (DragDropListener.DropValid == true)
            {
                ElementList.AddDropTarget(Id);
            }
            else
            {
                ElementList.ClearDropTarget(Id);
            }
        }
        StateHasChanged();
    }
}