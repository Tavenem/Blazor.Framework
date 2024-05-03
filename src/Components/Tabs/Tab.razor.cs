using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.Tabs;

/// <summary>
/// <para>
/// An individual tab within a <see cref="Tabs{TTabItem}"/> component.
/// </para>
/// <para>
/// Not intended for use in any other context.
/// </para>
/// </summary>
public partial class Tab<TTabItem>
{
    /// <summary>
    /// The associated <see cref="TabPanel{TTabItem}"/>, if this is a dynamic tab.
    /// </summary>
    [Parameter] public DynamicTabInfo<TTabItem>? TabInfo { get; set; }

    /// <summary>
    /// The associated <see cref="TabPanel{TTabItem}"/>, if this is a static tab.
    /// </summary>
    [Parameter] public TabPanel<TTabItem>? TabPanel { get; set; }

    /// <summary>
    /// The parent <see cref="Tabs{TTabItem}"/> component.
    /// </summary>
    [CascadingParameter] protected Tabs<TTabItem>? Parent { get; set; }

    private bool CanClose => TabPanel?.CanCloseTab ?? Parent?.CanClose ?? false;

    internal override bool GetIsDraggable()
        => IsDraggable
        && (TabPanel?.GetIsDraggable()
            ?? (TabInfo is not null
                && Parent?.EnableDragDrop == true));

    private string GetIsDraggableString() => GetIsDraggable().ToString().ToLowerInvariant();

    private string? GetPanelUrl() => TabPanel is null
        ? Parent?.GetDynamicPanelUrl(TabInfo)
        : Parent?.GetPanelUrl(TabPanel.Index);
}