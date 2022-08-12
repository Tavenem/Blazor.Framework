using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// This class is for internal use only. It will not function properly if used directly.
/// </summary>
public partial class ListItemCollapse<TListItem> : Collapse
{
    /// <summary>
    /// The id of the collapse element.
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    [Inject] private DragDropListener DragDropListener { get; set; } = default!;

    private DragEffect DragEffectAllowed => ListItem?.GetDragEffectAllowed() ?? DragEffect.CopyMove;

    internal ElementReference ElementReference { get; set; }

    private string? HeaderClass => new CssBuilder("header flex-wrap")
        .Add("no-drag", ListItem?.IsListDraggable == true && !IsDraggable)
        .ToString();

    private string HeaderId { get; set; } = Guid.NewGuid().ToHtmlId();

    private bool IsDraggable => ListItem?.GetIsDraggable() == true;

    private bool IsDropTarget => ListItem?.GetIsDropTarget() ?? false;

    [CascadingParameter] private ListItem<TListItem>? ListItem { get; set; }

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
        if (!_disposedValue)
        {
            if (disposing)
            {
                DragDropListener.OnDrop -= OnDropAsync;
            }
            base.Dispose(disposing);

            _disposedValue = true;
        }
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
            data = DragDropService.GetDragStartData(ListItem.Item, effectAllowed: DragEffectAllowed);
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