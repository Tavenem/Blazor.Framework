using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

public partial class FrameworkLayout
{
    private readonly List<AppBar> _appBars = new();
    private readonly List<Drawer> _drawers = new();

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    internal void Add(AppBar appBar)
    {
        appBar.DrawerToggle += OnAppbarDrawerToggle;
        _appBars.Add(appBar);
    }

    internal void Add(Drawer drawer) => _drawers.Add(drawer);

    internal void Remove(AppBar appBar)
    {
        appBar.DrawerToggle -= OnAppbarDrawerToggle;
        _appBars.Remove(appBar);
    }

    internal void Remove(Drawer drawer) => _drawers.Remove(drawer);

    private async void OnAppbarDrawerToggle(object? sender, EventArgs _)
    {
        if (sender is not AppBar appBar
            || appBar.ControlsDrawerSide == Side.None)
        {
            return;
        }

        var drawer = _drawers.Find(x => x.Side == appBar.ControlsDrawerSide);
        if (drawer is null)
        {
            return;
        }

        await drawer.ToggleAsync();
    }
}