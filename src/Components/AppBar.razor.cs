using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an appbar, with support for simple theming and drawer control.
/// </summary>
public partial class AppBar : IDisposable
{
    private bool _disposedValue;

    private Breakpoint? _breakpoint;
    /// <summary>
    /// <para>
    /// The breakpoint at which the drawer should be permanently visible.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ControlsDrawerSide"/> is <see cref="Side.None"/>.
    /// </para>
    /// </summary>
    [Parameter]
    public Breakpoint Breakpoint
    {
        get => _breakpoint ?? FrameworkLayout?.SideDrawerBreakpoint ?? Breakpoint.None;
        set => _breakpoint = value;
    }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// The docking side of the drawer this appbar should toggle.
    /// </summary>
    [Parameter] public Side ControlsDrawerSide { get; set; }

    /// <summary>
    /// Invoked when the drawer toggle is clicked.
    /// </summary>
    [Parameter] public EventCallback<AppBar> OnDrawerToggle { get; set; }

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
    /// Invoked when the drawer toggle is clicked.
    /// </summary>
    public event EventHandler<EventArgs>? DrawerToggle;

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected string CssClass => new CssBuilder("appbar")
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
        Breakpoint.None => "icon me-2",
        _ => $"icon me-2 drawer-toggle-{Breakpoint.ToCSS()}",
    };

    /// <summary>
    /// The final value assigned to the toolbar's class attribute, including
    /// component values.
    /// </summary>
    protected string ToolbarClassName => new CssBuilder("toolbar")
        .Add(ToolbarClass)
        .ToString();

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        FrameworkLayout?.Add(this);
        if (Breakpoint == Breakpoint.None
            && FrameworkLayout is not null)
        {
            Breakpoint = FrameworkLayout.SideDrawerBreakpoint;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                FrameworkLayout?.Remove(this);
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    private async Task OnDrawerToggleAsync()
    {
        await OnDrawerToggle.InvokeAsync(this);
        DrawerToggle?.Invoke(this, EventArgs.Empty);
    }
}
