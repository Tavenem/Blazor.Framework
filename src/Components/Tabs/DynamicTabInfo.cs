using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

internal class DynamicTabInfo<TTabItem>
{
    public DraggableDropTarget<TTabItem, TTabItem>? DragDropComponent { get; set; }

    public ElementReference ElementReference { get; set; }

    public string Id { get; } = Guid.NewGuid().ToString();

    public bool Observed { get; set; }

    public string PanelId => $"panel-{Id}";
}
