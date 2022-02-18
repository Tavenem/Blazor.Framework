using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an item in a list, with support for simple theming.
/// </summary>
public partial class ListItem<TListItem> : DraggableDropTarget<TListItem, TListItem>
{
    private Func<TListItem, bool>? _canDropFunc;
    /// <summary>
    /// <para>
    /// This function can return a value which indicates whether a given item
    /// may be dropped onto this target.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/> if not provided.
    /// </para>
    /// </summary>
    [Parameter]
    public override Func<TListItem, bool>? CanDrop
    {
        get => _canDropFunc ?? ElementList?.CanDrop;
        set => _canDropFunc = value;
    }

    /// <summary>
    /// Whether this item can be dragged.
    /// </summary>
    public bool Draggable => Item is not null
        && ElementList?.IsDragStartValue == true
        && ElementList.ItemIsDraggable?.Invoke(Item) != false;

    private bool _isDropTarget;
    /// <summary>
    /// Whether this drop target is accepting drops.
    /// </summary>
    [Parameter]
    public override bool IsDropTarget
    {
        get => _isDropTarget || (ElementList?.IsDropTarget ?? false);
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

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    public ThemeColor ThemeColor => Item is null
        ? ThemeColor.None
        : ElementList?.ItemThemeColor?.Invoke(Item) ?? ThemeColor.None;

    internal string? ItemDraggingClass => ElementList?.ItemDraggingClassValue;

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
        .Add("no-drag", !Draggable)
        .Add("can-drop", _dragOver && _canDrop)
        .Add("no-drop", _dragOver && !_canDrop)
        .Add(ElementList?.ItemDraggingClassValue, _dragOperationIsInProgress)
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
        && ElementList.SelectedColorValue != ThemeColor.None
        ? ElementList.SelectedColorValue
        : ThemeColor;

    private protected string? IconClassName
    {
        get
        {
            if (ElementList?.ShowSelectionIconValue == true
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

    internal async Task RemoveFromListAsync()
    {
        if (Item is not null
            && ElementList is not null)
        {
            await ElementList.RemoveItemAsync(Item);
        }
    }

    /// <summary>
    /// Called when a drag operation involving this item completes (including by cancellation).
    /// </summary>
    protected override Task OnDragCompleteAsync(DropTarget<TListItem>? target)
        => RemoveFromListAsync();

    /// <summary>
    /// Invoked when a drag operation completes.
    /// </summary>
    /// <param name="item">The droped item.</param>
    protected override async Task OnDropCompleteAsync(TListItem item)
    {
        if (Item?.Equals(item) != true
            && ElementList is not null)
        {
            await ElementList.InsertItemAsync(
                item,
                ElementList.IndexOfItem(Item));
        }
    }

    private protected async Task OnClickAsync(MouseEventArgs e)
    {
        if (ElementList is not null)
        {
            await ElementList.OnToggleItemSelectionAsync(Item);
        }
    }
}