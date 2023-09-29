using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A complete layout structure for a Tavenem.Blazor.Framework app.
/// </summary>
public partial class FrameworkLayout
{
    private readonly List<Drawer> _drawers = new();
    private readonly List<ScrollToTop> _scrollToTops = new();

    /// <summary>
    /// <para>
    /// The breakpoint at which the table of contents should be visible.
    /// </para>
    /// <para>
    /// Set to <see cref="Breakpoint.None"/> to remove the list completely.
    /// </para>
    /// <para>
    /// Defaults to <see cref="Breakpoint.Lg"/>
    /// </para>
    /// </summary>
    [Parameter] public Breakpoint ContentsBreakpoint { get; set; } = Breakpoint.Lg;

    /// <summary>
    /// Any toolbars and drawers.
    /// </summary>
    [Parameter] public RenderFragment? FrameworkContent { get; set; }

    /// <summary>
    /// The breakpoint at which the left and right drawers should be permanently visible.
    /// </summary>
    [Parameter] public Breakpoint SideDrawerBreakpoint { get; set; } = Breakpoint.Lg;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("tavenem-framework-layout")
        .Add(DrawerContainerClass)
        .Add("drawer-open", HasOpenDrawer)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private bool AutoScrollToTop { get; set; } = true;

    private Contents? Contents { get; set; }

    private DialogContainer? DialogContainer { get; set; }

    private string DrawerContainerClass => SideDrawerBreakpoint switch
    {
        Breakpoint.None => "drawer-container",
        _ => $"drawer-container drawer-container-{SideDrawerBreakpoint.ToCSS()}",
    };

    private bool HasOpenDrawer { get; set; }

    /// <summary>
    /// Adds a heading to the layout, and all <see cref="Contents"/> components.
    /// </summary>
    /// <param name="heading">The heading to add.</param>
    /// <returns>
    /// The heading's ID. If it was <see langword="null"/> or empty, a new ID will be created.
    /// </returns>
    /// <remarks>
    /// This method can be used to add headings dynamically.
    /// </remarks>
    public string? AddHeading(HeadingInfo heading) => Contents?.AddHeading(heading);

    /// <summary>
    /// Dismisses all open dialogs.
    /// </summary>
    public void DismissAllDialogs() => DialogContainer?.DismissAllDialogs();

    /// <summary>
    /// Removes a heading from the layout, and all <see cref="Contents"/> components.
    /// </summary>
    /// <param name="heading">The heading to remove.</param>
    /// <remarks>
    /// Does not throw an error if the given heading is not present.
    /// </remarks>
    public void RemoveHeading(HeadingInfo heading) => Contents?.RemoveHeading(heading);

    internal void Add(Drawer drawer)
    {
        drawer.DrawerToggled += OnDrawerToggled;
        _drawers.Add(drawer);
    }

    internal void Add(ScrollToTop scrollToTop)
    {
        if (string.IsNullOrEmpty(scrollToTop.Selector))
        {
            _scrollToTops.Add(scrollToTop);
            AutoScrollToTop = false;
        }
    }

    internal async Task DrawerToggleAsync(Side side)
    {
        var drawer = _drawers.Find(x => x.Side == side);
        if (drawer is null)
        {
            return;
        }

        await drawer.ToggleAsync();
    }

    internal bool HasDrawer(Side side) => _drawers.Any(x => x.Side == side);

    internal void Remove(Drawer drawer)
    {
        drawer.DrawerToggled -= OnDrawerToggled;
        _drawers.Remove(drawer);
    }

    internal void Remove(ScrollToTop scrollToTop)
    {
        if (string.IsNullOrEmpty(scrollToTop.Selector))
        {
            _scrollToTops.Remove(scrollToTop);
            AutoScrollToTop = _scrollToTops.Count == 0;
        }
    }

    private protected async Task OnCloseDrawersAsync()
    {
        foreach (var drawer in _drawers)
        {
            await drawer.CloseAsync();
        }
        HasOpenDrawer = false;
    }

    private void OnDrawerToggled(object? drawer, bool state)
    {
        HasOpenDrawer = state
          || _drawers.Any(x => x.IsOpen);
        StateHasChanged();
    }
}