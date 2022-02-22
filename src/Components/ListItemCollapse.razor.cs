using Microsoft.AspNetCore.Components;
using System.Text.Json;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// This class is for internal use only. It will not function properly if used directly.
/// </summary>
public partial class ListItemCollapse<TListItem>
{
    private Func<TListItem, bool>? CanDrop => ListItem?.CanDrop;

    private string? DragClass => ListItem?.DragClass;

    [Inject] private DragDropListener DragDropListener { get; set; } = default!;

    [Inject] private DragDropService DragDropService { get; set; } = default!;

    private DragEffect DragEffectAllowed => ListItem?.DragEffectAllowed ?? DragEffect.CopyMove;

    private bool IsDraggable => ListItem?.IsDraggable == true;

    private string HeaderClass => new CssBuilder("header")
        .Add("no-drag", !IsDraggable)
        .ToString();

    private string? Id { get; set; }

    private bool IsDropTarget => ListItem?.IsDropTarget ?? false;

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
            DragDropListener.DragClass = DragClass;
            DragDropListener.DropClass = "can-drop";
            DragDropListener.ElementId = Id;
            DragDropListener.GetData = GetDragData;
            DragDropListener.NoDropClass = "no-drop";
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
        if (!IsDraggable)
        {
            return DragStartData.None;
        }

        if (ListItem?.GetDragData is not null)
        {
            var data = ListItem.GetDragData.Invoke();
            if (data.EffectAllowed != DragEffect.None
                && data.Data?.Any() == true)
            {
                ListItem?.DragStarted();
            }
        }

        if (ListItem is null
            || ListItem.Item is null
            || DragEffectAllowed == DragEffect.None)
        {
            return DragStartData.None;
        }

        ListItem.DragStarted();
        return DragDropService.GetDragStartData(ListItem.Item, effectAllowed: DragEffectAllowed);
    }

    private async void OnDropAsync(object? sender, DropEventArgs e)
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
            await ListItem.OnDrop.InvokeAsync(new()
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

            await ListItem.DropItemAsync(item);
        }
    }

    private async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (!IsDraggable || ListItem is null)
        {
            return;
        }

        ListItem.DragEnded();

        if (ListItem.OnDropped.HasDelegate)
        {
            await ListItem.OnDropped.InvokeAsync(e);
        }
        else if (e == DragEffect.Move)
        {
            await ListItem.RemoveFromListAsync();
        }
    }
}