namespace Tavenem.Blazor.Framework.Components.Tabs;

/// <summary>
/// Information about a dynamic tab. Used internally.
/// </summary>
public class DynamicTabInfo<TTabItem>
{
    /// <summary>
    /// The <see cref="DraggableDropTarget{TDragItem, TDropItem}"/>.
    /// </summary>
    public DraggableDropTarget<TTabItem, TTabItem>? DragDropComponent { get; set; }

    /// <summary>
    /// The tab's HTML id.
    /// </summary>
    public string Id { get; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// The panel's HTML id.
    /// </summary>
    public string PanelId => $"panel-{Id}";
}
