using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays a drawer, with support for simple theming and closing.
/// </summary>
public partial class Drawer : IDisposable
{
    private bool _disposedValue;

    private Breakpoint? _breakpoint;
    /// <summary>
    /// <para>
    /// The breakpoint at which the drawer should be permanently visible.
    /// </para>
    /// <para>
    /// Defaults to the value of <see cref="FrameworkLayout.SideDrawerBreakpoint"/>, if <see
    /// cref="Side"/> is set to left or right.
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
            if (Side is Side.Left or Side.Right)
            {
                return FrameworkLayout?.SideDrawerBreakpoint ?? Breakpoint.None;
            }
            return Breakpoint.None;
        }
        set => _breakpoint = value;
    }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// Invoked when the drawer open state changes.
    /// </summary>
    public event EventHandler<bool>? DrawerToggled;

    /// <summary>
    /// The child content of the footer.
    /// </summary>
    [Parameter] public RenderFragment? Footer { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the footer.
    /// </summary>
    [Parameter] public string? FooterClass { get; set; }

    /// <summary>
    /// The child content of the header.
    /// </summary>
    [Parameter] public RenderFragment? Header { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the header.
    /// </summary>
    [Parameter] public string? HeaderClass { get; set; }

    private bool _isOpen;
    /// <summary>
    /// Whether the drawer is currently open.
    /// </summary>
    [Parameter]
    public bool IsOpen
    {
        get => _isOpen;
        set
        {
            if (value)
            {
                _isClosed = false;
            }
            if (_isOpen != value)
            {
                _isOpen = value;
                DrawerToggled?.Invoke(this, _isOpen);
            }
        }
    }

    /// <summary>
    /// Raised when the drawer's current open status changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsOpenChanged { get; set; }

    /// <summary>
    /// Invoked when the component is closed.
    /// </summary>
    [Parameter] public EventCallback<Drawer> OnClosed { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the overlay (only displayed for temporary drawers).
    /// </summary>
    [Parameter] public string? OverlayClass { get; set; }

    /// <summary>
    /// The side on which the drawer is docked.
    /// </summary>
    [Parameter] public Side Side { get; set; }

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
    protected override string CssClass => new CssBuilder("card drawer")
        .Add(BreakpointClass)
        .Add(Side.ToCSS())
        .Add("closed", IsClosed)
        .Add("open", IsOpen)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the footer's class attribute, including
    /// component values.
    /// </summary>
    protected string FooterToolbarClassName => new CssBuilder("toolbar filled")
        .Add(ThemeColor.ToCSS())
        .Add(FooterClass)
        .ToString();

    /// <summary>
    /// The final value assigned to the header's class attribute, including
    /// component values.
    /// </summary>
    protected string HeaderClassName => new CssBuilder("header appbar")
        .Add("drawer-control", Header is null)
        .ToString();

    /// <summary>
    /// The final value assigned to the header toolbar's class attribute, including
    /// component values.
    /// </summary>
    protected string HeaderToolbarClassName => new CssBuilder("toolbar")
        .Add(ThemeColor.ToCSS())
        .Add(HeaderClass)
        .ToString();

    /// <summary>
    /// The final value assigned to the overlay's class attribute, including
    /// component values.
    /// </summary>
    protected string OverlayClassName => new CssBuilder("overlay")
        .Add(OverlayClass)
        .ToString();

    private string? BreakpointClass => Breakpoint switch
    {
        Breakpoint.None => null,
        _ => $"drawer-{Breakpoint.ToCSS()}",
    };

    private bool DisplayOverlay { get; set; }

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    private bool _isClosed;
    /// <summary>
    /// Whether the drawer is currently closed.
    /// </summary>
    private bool IsClosed
    {
        get => _isClosed;
        set
        {
            if (value)
            {
                _isOpen = false;
            }
            _isClosed = value;
        }
    }

    [Inject] private NavigationManager NavigationManager { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        FrameworkLayout?.Add(this);
        NavigationManager.LocationChanged += OnLocationChanged;
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
                NavigationManager.LocationChanged -= OnLocationChanged;
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

    /// <summary>
    /// Close this drawer if it is open.
    /// </summary>
    public async Task CloseAsync()
    {
        if (IsOpen)
        {
            IsOpen = false;
            IsClosed = true;
            await OnClosed.InvokeAsync(this);
            await IsOpenChanged.InvokeAsync(IsOpen);
            DrawerToggled?.Invoke(this, IsOpen);
            StateHasChanged();
        }
    }

    /// <summary>
    /// Toggle this drawer's open state.
    /// </summary>
    public async Task ToggleAsync()
    {
        if (IsOpen)
        {
            IsOpen = false;
            IsClosed = true;
            await OnClosed.InvokeAsync(this);
            await IsOpenChanged.InvokeAsync(IsOpen);
            DrawerToggled?.Invoke(this, IsOpen);
            StateHasChanged();
        }
        else
        {
            IsOpen = true;
            IsClosed = false;
            await IsOpenChanged.InvokeAsync(IsOpen);
            DrawerToggled?.Invoke(this, IsOpen);
            StateHasChanged();
        }
    }

    private async Task OnClosedAsync()
    {
        if (OnClosed.HasDelegate)
        {
            await OnClosed.InvokeAsync(this);
            DrawerToggled?.Invoke(this, IsOpen);
        }
        else
        {
            IsOpen = false;
            IsClosed = true;
            await IsOpenChanged.InvokeAsync(IsOpen);
            DrawerToggled?.Invoke(this, IsOpen);
        }
    }

    private async void OnLocationChanged(object? _, LocationChangedEventArgs _2) => await CloseAsync();
}
