using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A complete layout structure for a Tavenem.Blazor.Framework app.
/// </summary>
public partial class FrameworkLayout : IDisposable
{
    private readonly List<AppBar> _appBars = new();
    private readonly List<Contents> _contents = new();
    private readonly List<ScrollToTop> _scrollToTops = new();

    private bool _disposedValue;
    private DotNetObjectReference<FrameworkLayout>? _dotNetRef;

    /// <summary>
    /// Any toolbars and drawers.
    /// </summary>
    [Parameter] public RenderFragment? FrameworkContent { get; set; }

    /// <summary>
    /// <para>
    /// The name of a CSS class of elements to observe with scroll spy.
    /// </para>
    /// <para>
    /// Defaults to the CSS class name for <see cref="Heading"/> components.
    /// </para>
    /// </summary>
    [Parameter] public string? ScrollSpyClass { get; set; } = Heading.HeadingClassName;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("framework")
        .Add(base.CssClass)
        .ToString();

    private bool AutoScrollToTop { get; set; } = true;

    [Inject] private FrameworkJsInterop JsInterop { get; set; } = default!;

    [Inject] private NavigationManager NavigationManager { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
        => NavigationManager.LocationChanged += OnLocationChanged;

    /// <summary>
    /// Method invoked after each time the component has been rendered. Note
    /// that the component does not automatically re-render after the completion
    /// of any returned <see cref="Task" />, because that would cause an
    /// infinite render loop.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <returns>A <see cref="Task" /> representing any asynchronous
    /// operation.</returns>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            foreach (var contents in _contents)
            {
                await contents.RefreshHeadingsAsync();
            }
            if (!string.IsNullOrEmpty(ScrollSpyClass))
            {
                _dotNetRef = DotNetObjectReference.Create(this);
                await JsInterop.ScrollSpy(_dotNetRef, ScrollSpyClass);
            }
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
                NavigationManager.LocationChanged -= OnLocationChanged;
                _dotNetRef?.Dispose();
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
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    public void RaiseOnScrollSpy(string? id)
    {
        foreach (var contents in _contents)
        {
            contents.SetActiveHeading(id);
        }
    }

    internal void Add(AppBar appBar)
    {
        appBar.DrawerToggle += OnAppbarDrawerToggle;
        _appBars.Add(appBar);
    }

    internal void Add(Contents contents) => _contents.Add(contents);

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

    internal void Remove(Contents contents) => _contents.Remove(contents);

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
        foreach (var contents in _contents)
        {
            await contents.RefreshHeadingsAsync();
        }

        var uri = NavigationManager.ToAbsoluteUri(NavigationManager.Uri);
        if (uri.Fragment.Length == 0)
        {
            return;
        }

        await JsInterop.ScrollToId(uri.Fragment[1..]);
    }
}