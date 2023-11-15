namespace Tavenem.Blazor.Framework;

internal class DynamicTabInfo<TTabItem>
{
    public DraggableDropTarget<TTabItem, TTabItem>? DragDropComponent { get; set; }

    public string Id { get; } = Guid.NewGuid().ToHtmlId();

    public string PanelId => $"panel-{Id}";
}
