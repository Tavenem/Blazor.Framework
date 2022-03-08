using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an appbar, with support for simple theming and drawer control.
/// </summary>
public partial class AppBar
{
    private Breakpoint? _breakpoint;
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
    [Parameter]
    public Breakpoint Breakpoint
    {
        get
        {
            if (_breakpoint.HasValue)
            {
                return _breakpoint.Value;
            }
            if (ControlsDrawerSide is Framework.Side.Left
                or Framework.Side.Right)
            {
                return FrameworkLayout?.SideDrawerBreakpoint ?? Breakpoint.None;
            }
            return Breakpoint.None;
        }
        set => _breakpoint = value;
    }

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

    private ThemeColor? _themeColor;
    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter]
    public ThemeColor ThemeColor
    {
        get => _themeColor ?? FrameworkLayout?.ThemeColor ?? ThemeColor.Default;
        set => _themeColor = value;
    }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("appbar")
        .Add(Side.ToCSS())
        .Add($"controls-{ControlsDrawerSide.ToCSS()}", ControlsDrawerSide != Framework.Side.None)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the drawer toggle's class attribute,
    /// including component values.
    /// </summary>
    protected string DrawerToggleClassName => Breakpoint switch
    {
        Breakpoint.None => "me-2",
        _ => $"me-2 drawer-toggle-{Breakpoint.ToCSS()}",
    };

    /// <summary>
    /// The final value assigned to the toolbar's class attribute, including
    /// component values.
    /// </summary>
    protected string ToolbarClassName => new CssBuilder("toolbar")
        .Add(ToolbarClass)
        .ToString();

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    private bool HasDrawer => ControlsDrawerSide != Framework.Side.None
        && FrameworkLayout?.HasDrawer(ControlsDrawerSide) == true;

    private async Task OnDrawerToggleAsync()
    {
        if (FrameworkLayout is not null)
        {
            await FrameworkLayout.DrawerToggleAsync(ControlsDrawerSide);
        }
    }
}
