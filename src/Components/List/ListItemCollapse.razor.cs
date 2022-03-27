using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// This class is for internal use only. It will not function properly if used directly.
/// </summary>
public partial class ListItemCollapse<TListItem>
{
    [Inject] private DragDropListener DragDropListener { get; set; } = default!;

    private DragEffect DragEffectAllowed => ListItem?.GetDragEffectAllowed() ?? DragEffect.CopyMove;

    private bool IsDraggable => ListItem?.GetIsDraggable() == true;

    private string? HeaderClass => new CssBuilder("header")
        .Add("no-drag", ListItem?.IsListDraggable == true && !IsDraggable)
        .ToString();

    private string? Id { get; set; }

    private bool IsDropTarget => ListItem?.GetIsDropTarget() ?? false;

    [CascadingParameter] private ListItem<TListItem>? ListItem { get; set; }

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized() => Id = Guid.NewGuid().ToString();

    /// <summary>
    /// Method invoked after each time the component has been rendered.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            DragDropListener.ElementId = Id;
            DragDropListener.GetData = GetDragData;
            DragDropListener.GetEffect = GetDropEffect;
            DragDropListener.OnDrop += OnDropAsync;
            DragDropListener.OnDropped += OnDroppedAsync;
        }
    }

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

        if (!types.Contains($"application/json-{typeof(TListItem).Name}")
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
            await ListItem.DropItemAsync(item);
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