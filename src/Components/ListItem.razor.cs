using Microsoft.AspNetCore.Components;
using System.Text.Json;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an item in a list, with support for simple theming.
/// </summary>
public partial class ListItem<TListItem> : DraggableDropTarget<TListItem, TListItem>
{
    private Func<TListItem, bool>? _canDropFunc;
    /// <summary>
    /// <para>
    /// This function can return a value which indicates whether a given item may be dropped onto
    /// this target via internal transfer.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/> if not provided.
    /// </para>
    /// <para>
    /// Note that this function is <strong>not</strong> invoked for dragged string data (including
    /// serialized JSON), only for items cached by reference in the <see cref="DragDropService"/>.
    /// For string data, only the type can be used to determine whether a drop should be permitted.
    /// </para>
    /// </summary>
    [Parameter]
    public override Func<TListItem, bool>? CanDrop
    {
        get => _canDropFunc ?? ElementList?.CanDrop;
        set => _canDropFunc = value;
    }

    private string? _dragClass;
    /// <summary>
    /// <para>
    /// An optional CSS class to be added to this element when it is being dragged.
    /// </para>
    /// <para>
    /// Defaults to <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter]
    public override string? DragClass
    {
        get => _dragClass ?? ElementList?.ItemDraggingClass;
        set => _dragClass = value;
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
            && ElementList?.IsDragStart == true
            && ElementList.ItemIsDraggable?.Invoke(Item) != false;
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

    private EventCallback<DragEffect> _onDropped;
    /// <summary>
    /// <para>
    /// Invoked when a drop operation completes with this element as the dropped item (including by
    /// cancellation).
    /// </para>
    /// <para>
    /// The argument parameter indicates which drag effect was ultimately selected for the drag-drop
    /// operation.
    /// </para>
    /// </summary>
    [Parameter]
    public override EventCallback<DragEffect> OnDropped
    {
        get => _onDropped.HasDelegate
            ? _onDropped
            : ElementList?.OnDropped ?? _onDropped;
        set => _onDropped = value;
    }

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

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    public ThemeColor ThemeColor => Item is null
        ? ThemeColor.None
        : ElementList?.ItemThemeColor?.Invoke(Item) ?? ThemeColor.None;

    /// <summary>
    /// The final value assigned to the class attribute of a collapse used to
    /// indicate a list of child items, including component values.
    /// </summary>
    protected string CollapseClass => new CssBuilder()
        .Add(FinalThemeColor.ToCSS())
        .Add(ClassName)
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values.
    /// </summary>
    protected override string CssClass => new CssBuilder()
        .Add(FinalThemeColor.ToCSS())
        .Add(
            "clickable",
            ElementList?.OnItemClick.HasDelegate == true
                || ElementList?.SelectionType != SelectionType.None)
        .Add("selected", IsSelected)
        .Add("no-drag", !IsDraggable)
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

    private protected ThemeColor FinalThemeColor => IsSelected
        && ElementList is not null
        && ElementList.SelectedColor != ThemeColor.None
        ? ElementList.SelectedColor
        : ThemeColor;

    private protected string? IconClassName
    {
        get
        {
            if (ElementList?.ShowSelectionIcon == true
                && IsSelected)
            {
                return "icon";
            }
            if (Item is null
                || ElementList?.Icon is null)
            {
                return null;
            }
            return ElementList.IconClass is null
                ? "icon"
                : $"icon {ElementList.IconClass(Item)}";
        }
    }

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

    internal void DragEnded() => ElementList?.DragEnded();

    internal void DragStarted() => ElementList?.DragStarted();

    internal async Task DropItemAsync(TListItem item)
    {
        if (ElementList is not null)
        {
            await ElementList.InsertItemAsync(
                item,
                ElementList.IndexOfItem(Item));
        }
    }

    internal async Task RemoveFromListAsync()
    {
        if (Item is not null
            && ElementList is not null)
        {
            await ElementList.RemoveItemAsync(Item);
        }
    }

    private protected override DragStartData GetDragDataInner()
    {
        if (!IsDraggable)
        {
            return DragStartData.None;
        }

        if (GetDragData is not null)
        {
            var data = GetDragData.Invoke();
            if (data.EffectAllowed != DragEffect.None
                && data.Data?.Any() == true)
            {
                ElementList?.DragStarted();
            }
        }

        if (Item is null || DragEffectAllowed == DragEffect.None)
        {
            return DragStartData.None;
        }

        ElementList?.DragStarted();
        return DragDropService.GetDragStartData(Item, effectAllowed: DragEffectAllowed);
    }

    private protected async Task OnClickAsync()
    {
        if (ElementList is not null)
        {
            await ElementList.OnToggleItemSelectionAsync(Item);
        }
    }

    private protected override async void OnDropAsync(object? sender, DropEventArgs e)
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
                Data = e.Data,
                Effect = e.Effect,
                Item = item,
            });
        }
        else if (item is not null)
        {
            if (e.Effect != DragEffect.Move)
            {
                try
                {
                    item = JsonSerializer.Deserialize<TListItem>(JsonSerializer.Serialize(item));
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException("Copying this type of list item is not supported.", ex);
                }
                if (item is null)
                {
                    throw new InvalidOperationException("Copying this type of list item is not supported: round-trip deserialization returned null");
                }
            }

            await DropItemAsync(item);
        }
    }

    private protected override async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (!IsDraggable)
        {
            return;
        }

        ElementList?.DragEnded();

        if (OnDropped.HasDelegate)
        {
            await OnDropped.InvokeAsync(e);
        }
        else if (e == DragEffect.Move)
        {
            await RemoveFromListAsync();
        }
    }
}