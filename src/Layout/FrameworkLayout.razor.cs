using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.JSInterop;
using System.Collections.ObjectModel;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A complete layout structure for a Tavenem.Blazor.Framework app.
/// </summary>
public partial class FrameworkLayout : IDisposable
{
    private readonly List<Contents> _contents = new();
    private readonly Collection<DialogReference> _dialogs = new();
    private readonly List<Drawer> _drawers = new();
    private readonly List<ScrollToTop> _scrollToTops = new();

    private bool _disposedValue;
    private DotNetObjectReference<FrameworkLayout>? _dotNetRef;

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// Any toolbars and drawers.
    /// </summary>
    [Parameter] public RenderFragment? FrameworkContent { get; set; }

    /// <summary>
    /// The breakpoint at which the left and right drawers should be permanently visible.
    /// </summary>
    [Parameter] public Breakpoint SideDrawerBreakpoint { get; set; } = Breakpoint.Lg;

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
        .Add(DrawerContainerClass)
        .Add("drawer-open", HasOpenDrawer)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private bool AutoScrollToTop { get; set; } = true;

    [Inject] private DialogService DialogService { get; set; } = default!;

    private string DrawerContainerClass => SideDrawerBreakpoint switch
    {
        Breakpoint.None => "drawer-container",
        _ => $"drawer-container drawer-container-{SideDrawerBreakpoint.ToCSS()}",
    };

    private bool HasOpenDrawer { get; set; }

    [Inject] private FrameworkJsInterop JsInterop { get; set; } = default!;

    [Inject] private NavigationManager NavigationManager { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        DialogService.OnDialogAdded += OnDialogAdded;
        DialogService.OnDialogClosed += DismissDialogInstance;
        NavigationManager.LocationChanged += OnLocationChanged;
    }

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
    /// Dismisses all open dialogs.
    /// </summary>
    public void DismissAllDialogs()
    {
        _dialogs
            .ToList()
            .ForEach(dialog => DismissDialogInstance(dialog, DialogResult.DefaultCancel));
        StateHasChanged();
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

    internal void Add(Contents contents) => _contents.Add(contents);

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

    internal void DismissDialogInstance(Guid id, DialogResult? result = null)
    {
        var reference = GetDialogReference(id);
        if (reference is not null)
        {
            DismissDialogInstance(reference, result);
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

    internal void Remove(Contents contents) => _contents.Remove(contents);

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

    private void DismissDialogInstance(DialogReference dialog, DialogResult? result = null)
    {
        dialog.Dismiss(result);
        _dialogs.Remove(dialog);
        StateHasChanged();
    }

    private DialogReference? GetDialogReference(Guid id) => _dialogs
        .SingleOrDefault(x => x.Id == id);

    private protected async Task OnCloseDrawersAsync()
    {
        foreach (var drawer in _drawers)
        {
            await drawer.CloseAsync();
        }
        HasOpenDrawer = false;
    }

    private void OnDialogAdded(DialogReference reference)
    {
        _dialogs.Add(reference);
        StateHasChanged();
    }

    private void OnDrawerToggled(object? drawer, bool state)
    {
        HasOpenDrawer = state
          || _drawers.Any(x => x.IsOpen);
        StateHasChanged();
    }

    private async void OnLocationChanged(object? _, LocationChangedEventArgs args)
    {
        DismissAllDialogs();

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