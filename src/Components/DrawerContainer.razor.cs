using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A container for an openable drawer.
/// </summary>
public partial class DrawerContainer
{
    private readonly List<Drawer> _drawers = new();

    /// <summary>
    /// The breakpoint at which left and right drawers should be permanently
    /// visible.
    /// </summary>
    [Parameter] public Breakpoint SideDrawerBreakpoint { get; set; } = Breakpoint.Md;

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected virtual string ClassName => new CssBuilder()
        .Add(DrawerContainerClass)
        .Add("drawer-open", HasOpenDrawer)
        .Add(Class)
        .AddClassFromDictionary(UserAttributes)
        .ToString();

    private string DrawerContainerClass => SideDrawerBreakpoint switch
    {
        Breakpoint.None => "drawer-container",
        _ => $"drawer-container-{SideDrawerBreakpoint.ToCSS()}",
    };

    private bool HasOpenDrawer { get; set; }

    internal void Add(Drawer drawer)
    {
        drawer.DrawerToggled += OnDrawerToggled;
        _drawers.Add(drawer);
    }

    internal void Remove(Drawer drawer)
    {
        drawer.DrawerToggled -= OnDrawerToggled;
        _drawers.Remove(drawer);
    }

    private protected async Task OnCloseDrawersAsync()
    {
        foreach (var drawer in _drawers)
        {
            await drawer.CloseAsync();
        }
        HasOpenDrawer = false;
    }

    private void OnDrawerToggled(object? drawer, bool state) => HasOpenDrawer = state
        || !_drawers.Any(x => x.IsOpen);
}
