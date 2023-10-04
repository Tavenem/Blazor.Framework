using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays a drawer, with support for simple theming and closing.
/// </summary>
public partial class Drawer : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// Invoked before the drawer is closed.
    /// </para>
    /// <para>
    /// If it returns <see langword="false"/> the drawer will remain open.
    /// </para>
    /// </summary>
    public event Func<Drawer, bool>? BeforeClosing;

    /// <summary>
    /// The child content of the footer.
    /// </summary>
    [Parameter] public RenderFragment? FooterContent { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the footer.
    /// </summary>
    [Parameter] public string? FooterClass { get; set; }

    /// <summary>
    /// The child content of the header.
    /// </summary>
    [Parameter] public RenderFragment? HeaderContent { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the header.
    /// </summary>
    [Parameter] public string? HeaderClass { get; set; }

    /// <summary>
    /// The breakpoint at which the drawer should be permanently hidden.
    /// </summary>
    [Parameter] public Breakpoint HideAtBreakpoint { get; set; }

    /// <summary>
    /// Whether the drawer is currently open.
    /// </summary>
    [Parameter] public bool IsOpen { get; set; }

    /// <summary>
    /// Raised when the drawer's current open status changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsOpenChanged { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the overlay (only displayed for temporary drawers).
    /// </summary>
    [Parameter] public string? OverlayClass { get; set; }

    /// <summary>
    /// The breakpoint at which the drawer should be permanently visible.
    /// </summary>
    [Parameter] public Breakpoint ShowAtBreakpoint { get; set; }

    /// <summary>
    /// The side on which the drawer is docked.
    /// </summary>
    [Parameter] public Side Side { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("card drawer")
        .Add(ShowAtBreakpointClass)
        .Add(HideAtBreakpointClass)
        .Add(Side.ToCSS())
        .Add("closed", IsClosed)
        .Add("open", IsOpen)
        .ToString();

    /// <summary>
    /// The final value assigned to the footer's class attribute, including
    /// component values.
    /// </summary>
    protected string? FooterClassName => new CssBuilder(FooterClass)
        .Add("footer toolbar")
        .Add(ThemeColor.ToCSS())
        .ToString();

    /// <summary>
    /// The final value assigned to the header's class attribute, including
    /// component values.
    /// </summary>
    protected string? HeaderClassName => new CssBuilder(HeaderClass)
        .Add("header toolbar")
        .Add("drawer-control", HeaderContent is null)
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string? HideAtBreakpointClass => HideAtBreakpoint switch
    {
        Breakpoint.None => null,
        _ => $"drawer-hidden-{HideAtBreakpoint.ToCSS()}",
    };

    private bool DisplayOverlay { get; set; }

    [Inject, NotNull] private DrawerService? DrawerService { get; set; }

    /// <summary>
    /// Whether the drawer is currently closed.
    /// </summary>
    private bool IsClosed { get; set; }

    private bool IsInteractive { get; set; }

    [Inject] private NavigationManager NavigationManager { get; set; } = default!;

    private string? ShowAtBreakpointClass => ShowAtBreakpoint switch
    {
        Breakpoint.None => "drawer-breakpoint-none",
        _ => $"drawer-{ShowAtBreakpoint.ToCSS()}",
    };

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<bool>(nameof(IsOpen), out var isOpen)
            && isOpen != IsOpen)
        {
            IsClosed = !isOpen;
        }

        await base.SetParametersAsync(parameters);
    }

    /// <inheritdoc/>
    protected override void OnInitialized() => DrawerService.Add(this);

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            NavigationManager.LocationChanged += OnLocationChanged;
            IsInteractive = true;
            StateHasChanged();
        }
    }

    /// <inheritdoc/>
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
            await IsOpenChanged.InvokeAsync(IsOpen);
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
            var canClose = BeforeClosing?.Invoke(this) ?? true;
            if (canClose)
            {
                IsOpen = false;
                IsClosed = true;
                await IsOpenChanged.InvokeAsync(IsOpen);
                StateHasChanged();
            }
        }
        else
        {
            IsOpen = true;
            IsClosed = false;
            await IsOpenChanged.InvokeAsync(IsOpen);
            StateHasChanged();
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
                DrawerService.Remove(this);
                NavigationManager.LocationChanged -= OnLocationChanged;
            }

            _disposedValue = true;
        }
    }

    private async Task OnClosedAsync()
    {
        var canClose = BeforeClosing?.Invoke(this) ?? true;
        if (canClose)
        {
            IsOpen = false;
            IsClosed = true;
            await IsOpenChanged.InvokeAsync(IsOpen);
        }
    }

    private async void OnLocationChanged(object? _, LocationChangedEventArgs _2) => await CloseAsync();
}
