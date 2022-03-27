using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// Displays an item in a list, with support for simple theming.
/// </summary>
public partial class ListItem<TListItem> : DraggableDropTarget<TListItem, TListItem>
{
    /// <summary>
    /// Indicates whether this item has been selected.
    /// </summary>
    public bool IsSelected => ParentSelectedItems?.Contains(Item) == true;

    internal string? DropPlaceholderClass => ElementList?.DropPlaceholderClass;

    internal bool IsListDraggable => ElementList?.IsDragStartValue == true;

    /// <summary>
    /// The final value assigned to the class attribute of a collapse used to
    /// indicate a list of child items, including component values.
    /// </summary>
    protected string? CollapseClass => new CssBuilder()
        .Add(ThemeColor.ToCSS())
        .Add(ClassName)
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values.
    /// </summary>
    protected override string? CssClass => new CssBuilder()
        .Add(ClassName)
        .Add(ThemeColor.ToCSS())
        .Add(
            "clickable",
            ElementList?.OnItemClick.HasDelegate == true
                || (ElementList?.SelectionType != SelectionType.None
                && ElementList?.SelectionIcons != true))
        .Add("selectable", ElementList?.SelectionIcons == true)
        .Add("active", IsSelected)
        .Add("no-drag", IsListDraggable && !GetIsDraggable())
        .Add("disabled", Item is not null
            && ElementList?.ItemIsDisabled?.Invoke(Item) == true)
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
                    ? "check_box"
                    : "check_box_outline_blank";
            }
            if (ElementList?.ShowSelectionIconValue == true
                && IsSelected)
            {
                return "done";
            }
            if (Item is null
                || ElementList?.Icon is null)
            {
                return null;
            }
            return ElementList.Icon(Item);
        }
    }

    private protected bool SeparatorAfter => Item is not null
        && (ElementList?.SeparatorAfter?.Invoke(Item) ?? false);

    private protected bool SeparatorBefore => Item is not null
        && (ElementList?.SeparatorBefore?.Invoke(Item) ?? false);

    private protected ThemeColor ThemeColor
    {
        get
        {
            if (Item is null
                || ElementList is null)
            {
                return ThemeColor.None;
            }
            if (IsSelected
                && ElementList.ThemeColor != ThemeColor.None)
            {
                return ElementList.ThemeColor;
            }
            return ElementList.ItemThemeColor?.Invoke(Item)
                ?? ThemeColor.None;
        }
    }

    internal async Task DropItemAsync(TListItem item)
    {
        if (ElementList is not null)
        {
            await ElementList.InsertItemAsync(
                item,
                ElementList.IndexOfItem(Item));
        }
    }

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
            await ElementList.RemoveItemAsync(Item);
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
        if (item?.Equals(Item) == true)
        {
            return;
        }

        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(new(e));
        }
        else if (item is not null)
        {
            await DropItemAsync(item);
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