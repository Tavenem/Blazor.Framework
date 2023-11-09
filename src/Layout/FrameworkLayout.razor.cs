using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A complete layout structure for a Tavenem.Blazor.Framework app.
/// </summary>
public partial class FrameworkLayout : IDisposable
{
    private bool _disposedValue;
    private IDisposable? _locationChangingRegistration;

    /// <summary>
    /// Whether to include a <c>tf-scroll-top</c> element.
    /// </summary>
    [Parameter] public bool AutoScrollToTop { get; set; } = true;

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
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("tavenem-framework-layout")
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private Contents? Contents { get; set; }

    private DialogContainer? DialogContainer { get; set; }

    [Inject, NotNull] private NavigationManager? NavigationManager { get; set; }

    [Inject, NotNull] private ScrollService? ScrollService { get; set; }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            _locationChangingRegistration = NavigationManager
                .RegisterLocationChangingHandler(OnLocationChangedAsync);
        }
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Adds a heading to the default <see cref="Contents"/> component.
    /// </summary>
    /// <param name="heading">The heading to add.</param>
    /// <returns>
    /// The heading's ID. If it was <see langword="null"/> or empty, a new ID will be created.
    /// </returns>
    /// <remarks>
    /// This method can be used to add headings dynamically.
    /// </remarks>
    public string? AddHeading(HeadingInfo heading) => Contents?.AddHeading(heading);

    /// <summary>
    /// Dismisses all open dialogs.
    /// </summary>
    public void DismissAllDialogs() => DialogContainer?.DismissAllDialogs();

    /// <summary>
    /// Removes a heading from the default <see cref="Contents"/> component.
    /// </summary>
    /// <param name="heading">The heading to remove.</param>
    /// <remarks>
    /// Does not throw an error if the given heading is not present.
    /// </remarks>
    public void RemoveHeading(HeadingInfo heading) => Contents?.RemoveHeading(heading);

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _locationChangingRegistration?.Dispose();
            }
            _disposedValue = true;
        }
    }

    private async ValueTask OnLocationChangedAsync(LocationChangingContext e)
    {
        if (Uri.TryCreate(e.TargetLocation, UriKind.Absolute, out var target)
            && Uri.TryCreate(NavigationManager.Uri, UriKind.Absolute, out var current)
            && !target.GetLeftPart(UriPartial.Path)
            .Equals(current.GetLeftPart(UriPartial.Path)))
        {
            await ScrollService.ScrollToTop("main");
        }
    }
}