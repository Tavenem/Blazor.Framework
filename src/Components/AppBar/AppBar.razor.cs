using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an appbar, with support for simple theming and drawer control.
/// </summary>
public partial class AppBar
{
    /// <summary>
    /// <para>
    /// The breakpoint at which the drawer should be permanently visible.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ControlsDrawerSide"/> is <see cref="Side.None"/>.
    /// </para>
    /// <para>
    /// Defaults to the value of <see cref="FrameworkLayout.SideDrawerBreakpoint"/>, if <see
    /// cref="ControlsDrawerSide"/> is set to left or right.
    /// </para>
    /// </summary>
    [Parameter] public Breakpoint? Breakpoint { get; set; }

    /// <summary>
    /// The docking side of the drawer this appbar should toggle.
    /// </summary>
    [Parameter] public Side ControlsDrawerSide { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the toolbar.
    /// </summary>
    [Parameter] public string? ToolbarClass { get; set; }

    /// <summary>
    /// Whether the appbar is docked at the top or bottom.
    /// </summary>
    [Parameter] public VerticalSide Side { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor? ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("appbar")
        .Add(ThemeColorValue.ToCSS())
        .Add(Side.ToCSS())
        .Add($"controls-{ControlsDrawerSide.ToCSS()}", ControlsDrawerSide != Framework.Side.None)
        .ToString();

    /// <summary>
    /// The final value assigned to the drawer toggle's class attribute,
    /// including component values.
    /// </summary>
    protected string? DrawerToggleClassName => new CssBuilder("me-2 d-print-none")
        .Add(BreakpointValue switch
        {
            Framework.Breakpoint.None => null,
            _ => $"drawer-toggle-{BreakpointValue.ToCSS()}",
        }).ToString();

    /// <summary>
    /// The final value assigned to the toolbar's class attribute, including
    /// component values.
    /// </summary>
    protected string? ToolbarClassName => new CssBuilder(ToolbarClass)
        .Add("toolbar")
        .ToString();

    private Breakpoint BreakpointValue
    {
        get
        {
            if (Breakpoint.HasValue)
            {
                return Breakpoint.Value;
            }
            if (ControlsDrawerSide is Framework.Side.Left
                or Framework.Side.Right)
            {
                return FrameworkLayout?.SideDrawerBreakpoint ?? Framework.Breakpoint.None;
            }
            return Framework.Breakpoint.None;
        }
    }

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    private bool HasDrawer => ControlsDrawerSide != Framework.Side.None
        && FrameworkLayout?.HasDrawer(ControlsDrawerSide) == true;

    private ThemeColor ThemeColorValue => ThemeColor ?? FrameworkLayout?.ThemeColor ?? Framework.ThemeColor.Default;

    private async Task OnDrawerToggleAsync()
    {
        if (FrameworkLayout is not null)
        {
            await FrameworkLayout.DrawerToggleAsync(ControlsDrawerSide);
        }
    }
}
