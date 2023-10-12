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

    [Inject, NotNull] private DrawerService? DrawerService { get; set; }

    [Inject, NotNull] private NavigationManager? NavigationManager { get; set; }

    private string? ShowAtBreakpointClass => ShowAtBreakpoint switch
    {
        Breakpoint.None => "drawer-breakpoint-none",
        _ => $"drawer-{ShowAtBreakpoint.ToCSS()}",
    };

    /// <inheritdoc/>
    protected override void OnInitialized()
        => NavigationManager.LocationChanged += OnLocationChanged;

    /// <inheritdoc/>
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Close this drawer if it is open, and not always shown by breakpoint settings.
    /// </summary>
    public Task CloseAsync() => DrawerService.CloseAsync(Side);

    /// <summary>
    /// Open this drawer if it is closed, and not hidden by breakpoint settings.
    /// </summary>
    public Task OpenAsync() => DrawerService.OpenAsync(Side);

    /// <summary>
    /// Toggle this drawer's open state.
    /// </summary>
    /// <remarks>
    /// May have no effect if the drawer's state is currently fixed by breakpoint settings.
    /// </remarks>
    public Task ToggleAsync() => DrawerService.ToggleAsync(Side);

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
                NavigationManager.LocationChanged -= OnLocationChanged;
            }

            _disposedValue = true;
        }
    }

    private async void OnLocationChanged(object? _, LocationChangedEventArgs _2) => await CloseAsync();
}
