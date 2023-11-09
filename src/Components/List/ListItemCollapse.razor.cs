using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// This class is for internal use only. It will not function properly if used directly.
/// </summary>
public partial class ListItemCollapse<TListItem>
{
    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    [Inject] private DragDropListener DragDropListener { get; set; } = default!;

    private DragEffect DragEffectAllowed => ListItem?.GetDragEffectAllowed() ?? DragEffect.CopyMove;

    /// <summary>
    /// The list to which this item belongs, if any.
    /// </summary>
    [CascadingParameter] protected ElementList<TListItem>? ElementList { get; set; }

    internal ElementReference ElementReference { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("collapse")
        .Add("closed", !IsOpen)
        .Add("disabled", DisabledValue || Accordion?.Disabled == true)
        .Add("loading", IsLoading)
        .Add(ThemeColorValue.ToCSS())
        .Add(
            "clickable",
            ElementList?.OnItemClick.HasDelegate == true
                || (ElementList?.SelectionType != SelectionType.None
                && ElementList?.SelectionIcons != true))
        .Add("selectable", ElementList?.SelectionIcons == true)
        .Add("active", ListItem?.IsSelected == true)
        .Add("no-drag", ListItem?.IsListDraggable == true && !IsDraggable)
        .ToString();

#pragma warning disable RCS1146 // Use conditional access: TListItem cannot be made nullable
    private protected bool DisabledValue => Disabled
        || (ListItem is not null
        && ListItem.Item is not null
        && ElementList?.ItemIsDisabled?.Invoke(ListItem.Item) == true);
#pragma warning restore RCS1146 // Use conditional access.

    private string? HeaderClass => new CssBuilder("header flex-wrap")
        .Add("no-drag", ListItem?.IsListDraggable == true && !IsDraggable)
        .ToString();

    private string HeaderId { get; set; } = Guid.NewGuid().ToHtmlId();

    private bool IsDraggable => ListItem?.GetIsDraggable() == true;

    private bool IsDropTarget => ListItem?.GetIsDropTarget() ?? false;

    private string? ListIconClassName
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
                && ListItem?.IsSelected == true)
                || ListItem is null
                || ListItem.Item is null
                || ElementList.Icon is null
                || ElementList.IconClass is null
                ? null
                : ElementList.IconClass(ListItem.Item);
        }
    }

    private string? ListIconName
    {
        get
        {
            if (ElementList?.SelectionIcons == true)
            {
                return ListItem?.IsSelected == true
                    ? DefaultIcons.CheckBox_Checked
                    : DefaultIcons.CheckBox_Unchecked;
            }
            if (ElementList?.ShowSelectionIconValue == true
                && ListItem?.IsSelected == true)
            {
                return DefaultIcons.Selected;
            }
            if (ListItem is null
                || string.IsNullOrEmpty(ListItem.Icon))
            {
                if (ListItem is null
                    || ListItem.Item is null
                    || ElementList?.Icon is null)
                {
                    return null;
                }
                return ElementList.Icon(ListItem.Item);
            }
            else
            {
                return ListItem.Icon;
            }
        }
    }

    [CascadingParameter] private ListItem<TListItem>? ListItem { get; set; }

    private ThemeColor ThemeColorValue
    {
        get
        {
            if (ListItem is null
                || ListItem.Item is null
                || ElementList is null)
            {
                return ThemeColor;
            }
            if (ListItem.IsSelected
                && ElementList.ThemeColor != ThemeColor.None)
            {
                return ElementList.ThemeColor;
            }
            if (ThemeColor == ThemeColor.None)
            {
                return ElementList.ItemThemeColor?.Invoke(ListItem.Item)
                    ?? ThemeColor.None;
            }
            else
            {
                return ThemeColor;
            }
        }
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            DragDropListener.DragElementId = HeaderId;
            DragDropListener.ElementId = Id;
            DragDropListener.GetData = GetDragData;
            DragDropListener.GetEffect = GetDropEffect;
            DragDropListener.OnDrop += OnDropAsync;
            DragDropListener.OnDropped += OnDroppedAsync;
        }
    }

    internal ValueTask FocusAsync() => ElementReference.FocusAsync();

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue && disposing)
        {
            DragDropListener.OnDrop -= OnDropAsync;
        }
        base.Dispose(disposing);
    }

    private DragStartData GetDragData()
    {
        if (!IsDraggable || DragEffectAllowed == DragEffect.None)
        {
            return DragStartData.None;
        }

        DragStartData data;
        if (ListItem?.GetDragData is not null)
        {
            data = ListItem.GetDragData.Invoke();
        }
        else if (ListItem is null
            || ListItem.Item is null)
        {
            return DragStartData.None;
        }
        else
        {
            data = DragDropService.GetDragStartData(ListItem.Item, effectAllowed: DragEffectAllowed, jsonTypeInfo: ListItem.JsonTypeInfo);
        }

        return data;
    }

    private DragEffect GetDropEffect(string[] types)
    {
        if (!IsDropTarget)
        {
            return DragEffect.None;
        }

        if (!types.Contains($"application/json-{typeof(TListItem).Name.ToLowerInvariant()}")
            && types.Any(x => x.StartsWith("application/json-")))
        {
            return DragEffect.None;
        }

        return DragEffect.All;
    }

    private async Task OnClickAsync()
    {
        if (ListItem is not null
            && ElementList is not null
            && ElementList.SelectionType != SelectionType.None)
        {
            await ElementList.OnToggleItemSelectionAsync(ListItem.Item);
        }
    }

    private protected async Task OnClickIconAsync()
    {
        if (ListItem is not null
            && ElementList is not null
            && ElementList.SelectionType != SelectionType.None)
        {
            await ElementList.OnToggleItemSelectionAsync(ListItem.Item);
        }
    }

    private async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!IsDropTarget
            || ListItem is null)
        {
            return;
        }

        var item = DragDropService.TryGetData<TListItem>(e);
        if (item?.Equals(ListItem.Item) == true)
        {
            return;
        }

        if (ListItem.OnDrop.HasDelegate)
        {
            await ListItem.OnDrop.InvokeAsync(new(e));
        }
        else if (item is not null)
        {
            ListItem.DropItem();
        }
    }

    private async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (!IsDraggable || ListItem is null)
        {
            return;
        }

        await ListItem.ItemDroppedAsync(e);
    }
}