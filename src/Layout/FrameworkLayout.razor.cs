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

    internal Heading? ActiveHeading { get; private set; }

    internal List<Heading> Headings { get; } = new();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("framework")
        .Add(DrawerContainerClass)
        .Add("drawer-open", HasOpenDrawer)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private bool AutoScrollToTop { get; set; } = true;

    [Inject] private DialogService DialogService { get; set; } = default!;

    private Snackbar? ExtraSnackbarBottomLeft => SnackbarService.GetExtraSnackbar(Corner.Bottom_Left);

    private Snackbar? ExtraSnackbarBottomRight => SnackbarService.GetExtraSnackbar(Corner.Bottom_Right);

    private Snackbar? ExtraSnackbarTopLeft => SnackbarService.GetExtraSnackbar(Corner.Top_Left);

    private Snackbar? ExtraSnackbarTopRight => SnackbarService.GetExtraSnackbar(Corner.Top_Right);

    private string DrawerContainerClass => SideDrawerBreakpoint switch
    {
        Breakpoint.None => "drawer-container",
        _ => $"drawer-container drawer-container-{SideDrawerBreakpoint.ToCSS()}",
    };

    private bool HasOpenDrawer { get; set; }

    [Inject] private ScrollService ScrollService { get; set; } = default!;

    private IEnumerable<Snackbar> SnackbarsBottomLeft => SnackbarService.GetDisplayedSnackbars(Corner.Bottom_Left).Reverse();

    private IEnumerable<Snackbar> SnackbarsBottomRight => SnackbarService.GetDisplayedSnackbars(Corner.Bottom_Right).Reverse();

    private IEnumerable<Snackbar> SnackbarsTopLeft => SnackbarService.GetDisplayedSnackbars(Corner.Top_Left);

    private IEnumerable<Snackbar> SnackbarsTopRight => SnackbarService.GetDisplayedSnackbars(Corner.Top_Right);

    [Inject] private SnackbarService SnackbarService { get; set; } = default!;

    [Inject] private NavigationManager NavigationManager { get; set; } = default!;

    [Inject] private UtilityService UtilityService { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        DialogService.OnDialogAdded += OnDialogAdded;
        DialogService.OnDialogClosed += DismissDialogInstance;
        SnackbarService.OnSnackbarsUpdated += OnSnackbarsUpdated;
        NavigationManager.LocationChanged += OnLocationChanged;
    }

    /// <summary>
    /// Method invoked when the component is ready to start, having received its initial parameters
    /// from its parent in the render tree. Override this method if you will perform an asynchronous
    /// operation and want the component to refresh when that operation is completed.
    /// </summary>
    /// <returns>A <see cref="Task" /> representing any asynchronous operation.</returns>
    protected override Task OnInitializedAsync() => UtilityService.RegisterComponents().AsTask();

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
            if (!string.IsNullOrEmpty(ScrollSpyClass))
            {
                _dotNetRef = DotNetObjectReference.Create(this);
                await ScrollService.ScrollSpy(_dotNetRef, ScrollSpyClass);
            }

            var uri = NavigationManager.ToAbsoluteUri(NavigationManager.Uri);
            if (uri.Fragment.Length == 0)
            {
                return;
            }

            await ScrollService.ScrollToId(uri.Fragment[1..]);
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
        ActiveHeading = string.IsNullOrEmpty(id)
            ? null
            : Headings.Find(x => x.IdValue == id);
        RefreshContents();
    }

    internal void Add(Contents contents) => _contents.Add(contents);

    internal void Add(Drawer drawer)
    {
        drawer.DrawerToggled += OnDrawerToggled;
        _drawers.Add(drawer);
    }

    internal string Add(Heading heading)
    {
        Headings.Add(heading);
        return $"heading-{Headings.Count}";
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

    internal void RefreshContents()
    {
        foreach (var contents in _contents)
        {
            contents.Refresh();
        }
    }

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

    internal void Remove(Heading heading) => Headings.Remove(heading);

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
                SnackbarService.OnSnackbarsUpdated -= OnSnackbarsUpdated;
                NavigationManager.LocationChanged -= OnLocationChanged;
                _dotNetRef?.Dispose();
            }

            _disposedValue = true;
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

        var uri = NavigationManager.ToAbsoluteUri(NavigationManager.Uri);
        if (uri.Fragment.Length == 0)
        {
            return;
        }

        await ScrollService.ScrollToId(uri.Fragment[1..]);
    }

    private void OnSnackbarsUpdated() => InvokeAsync(StateHasChanged);
}