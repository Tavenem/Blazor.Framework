using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A complete layout structure for a Tavenem.Blazor.Framework app.
/// </summary>
public partial class FrameworkLayout : IDisposable
{
    private readonly List<AppBar> _appBars = new();
    private readonly List<Drawer> _drawers = new();
    private readonly List<ScrollToTop> _scrollToTops = new();

    private bool _disposedValue;

    /// <summary>
    /// The name of a CSS class of elements to observe with scroll spy.
    /// </summary>
    [Parameter] public string? ScrollSpyClass { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected override string ClassName => new CssBuilder("framework")
        .Add(base.ClassName)
        .ToString();

    private bool AutoScrollToTop { get; set; }

    [Inject] private FrameworkJsInterop? JsInterop { get; set; }

    [Inject] private NavigationManager? NavigationManager { get; set; }

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree. Override this
    /// method if you will perform an asynchronous operation and want the
    /// component to refresh when that operation is completed.
    /// </summary>
    /// <returns>
    /// A <see cref="Task" /> representing any asynchronous operation.
    /// </returns>
    protected override async Task OnInitializedAsync()
    {
        if (NavigationManager is not null)
        {
            NavigationManager.LocationChanged += OnLocationChanged;
        }
        if (JsInterop is not null
            && !string.IsNullOrEmpty(ScrollSpyClass))
        {
            await JsInterop.ScrollSpy(ScrollSpyClass);
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
                if (NavigationManager is not null)
                {
                    NavigationManager.LocationChanged -= OnLocationChanged;
                }
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

    internal void Add(AppBar appBar)
    {
        appBar.DrawerToggle += OnAppbarDrawerToggle;
        _appBars.Add(appBar);
    }

    internal void Add(ScrollToTop scrollToTop)
    {
        if (string.IsNullOrEmpty(scrollToTop.Selector))
        {
            _scrollToTops.Add(scrollToTop);
            AutoScrollToTop = false;
        }
    }

    internal void Remove(AppBar appBar)
    {
        appBar.DrawerToggle -= OnAppbarDrawerToggle;
        _appBars.Remove(appBar);
    }

    internal void Remove(ScrollToTop scrollToTop)
    {
        if (string.IsNullOrEmpty(scrollToTop.Selector))
        {
            _scrollToTops.Remove(scrollToTop);
            AutoScrollToTop = _scrollToTops.Count == 0;
        }
    }

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

    private async void OnLocationChanged(object? _, LocationChangedEventArgs args)
    {
        if (JsInterop is null
            || NavigationManager is null)
        {
            return;
        }

        var uri = NavigationManager.ToAbsoluteUri(NavigationManager.Uri);
        if (uri.Fragment.Length == 0)
        {
            return;
        }

        await JsInterop.ScrollToId(uri.Fragment[1..]);
    }
}