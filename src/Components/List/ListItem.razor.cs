using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// Displays an item in a list, with support for simple theming.
/// </summary>
public partial class ListItem<TListItem> : DraggableDropTarget<TListItem, TListItem>
{
    private bool _disabled;
    /// <summary>
    /// <para>
    /// Whether this item is currently disabled.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>, but defers to the parent list.
    /// </para>
    /// </summary>
    [Parameter]
    public bool Disabled
    {
        get => _disabled
            || (Item is not null
            && ElementList?.ItemIsDisabled?.Invoke(Item) == true);
        set => _disabled = value;
    }

    private DragEffect _dragEffectAllowed = DragEffect.CopyMove;
    /// <summary>
    /// <para>
    /// Sets the allowed drag effects for drag operations with this item.
    /// </para>
    /// <para>
    /// Defaults to <see cref="DragEffect.CopyMove"/> for list items, but defers to the parent list.
    /// </para>
    /// </summary>
    [Parameter]
    public override DragEffect DragEffectAllowed
    {
        get => ElementList?.DragEffectAllowed ?? _dragEffectAllowed;
        set => _dragEffectAllowed = value;
    }

    private bool _isDraggable = true;
    /// <summary>
    /// <para>
    /// Whether this item is currently draggable.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/>, but defers to the parent list.
    /// </para>
    /// </summary>
    [Parameter]
    public override bool IsDraggable
    {
        get => _isDraggable
            && Item is not null
            && IsListDraggable
            && ElementList?.ItemIsDraggable?.Invoke(Item) != false;
        set => _isDraggable = value;
    }

    private bool _isDropTarget = true;
    /// <summary>
    /// <para>
    /// Whether this drop target is accepting drops.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/>, but defers to the parent list.
    /// </para>
    /// </summary>
    [Parameter]
    public override bool IsDropTarget
    {
        get => _isDropTarget && (ElementList?.IsDropTarget ?? false);
        set => _isDropTarget = value;
    }

    /// <summary>
    /// Indicates whether this item has been selected.
    /// </summary>
    public bool IsSelected => ParentSelectedItems?.Contains(Item) == true;

    /// <summary>
    /// Whether to show a separator after this item.
    /// </summary>
    public bool SeparatorAfter => Item is not null
        && (ElementList?.SeparatorAfter?.Invoke(Item) ?? false);

    /// <summary>
    /// Whether to show a separator before this item.
    /// </summary>
    public bool SeparatorBefore => Item is not null
        && (ElementList?.SeparatorBefore?.Invoke(Item) ?? false);

    private ThemeColor _themeColor;
    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    public ThemeColor ThemeColor
    {
        get
        {
            if (_themeColor != ThemeColor.None)
            {
                return _themeColor;
            }
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
        set => _themeColor = value;
    }

    internal string? DropPlaceholderClass => ElementList?.DropPlaceholderClass;

    internal bool IsListDraggable => ElementList?.IsDragStart == true;

    /// <summary>
    /// The final value assigned to the class attribute of a collapse used to
    /// indicate a list of child items, including component values.
    /// </summary>
    protected string CollapseClass => new CssBuilder()
        .Add(ThemeColor.ToCSS())
        .Add(ClassName)
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values.
    /// </summary>
    protected override string CssClass => new CssBuilder()
        .Add(ThemeColor.ToCSS())
        .Add(
            "clickable",
            ElementList?.OnItemClick.HasDelegate == true
                || ElementList?.SelectionType != SelectionType.None)
        .Add("active", IsSelected)
        .Add("no-drag", IsListDraggable && !IsDraggable)
        .Add(ClassName)
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

    private protected string? IconClassName => (ElementList?.ShowSelectionIcon == true
        && IsSelected)
        || Item is null
        || ElementList?.Icon is null
        || ElementList.IconClass is null
        ? null
        : ElementList.IconClass(Item);

    private protected string? IconName
    {
        get
        {
            if (ElementList?.ShowSelectionIcon == true
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

    internal async Task DropItemAsync(TListItem item)
    {
        if (ElementList is not null)
        {
            await ElementList.InsertItemAsync(
                item,
                ElementList.IndexOfItem(Item));
        }
    }

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
        if (ElementList is not null)
        {
            await ElementList.OnToggleItemSelectionAsync(Item);
        }
    }

    private protected override async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!IsDropTarget
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
            await OnDrop.InvokeAsync(new()
            {
                Data = e,
                Item = item,
            });
        }
        else if (item is not null)
        {
            await DropItemAsync(item);
        }
    }

    private protected override async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (!IsDraggable)
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