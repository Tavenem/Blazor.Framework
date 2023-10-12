using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A complete layout structure for a Tavenem.Blazor.Framework app.
/// </summary>
public partial class FrameworkLayout
{
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
    /// The render mode to use for the built-in <see cref="SnackbarContainer"/> and <see
    /// cref="Framework.DialogContainer"/> components.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Defaults to <see cref="RenderMode.InteractiveAuto"/>.
    /// </para>
    /// <para>
    /// To disable the built-in <see cref="SnackbarContainer"/> and <see
    /// cref="Framework.DialogContainer"/> components completely, set to <see langword="null"/>.
    /// </para>
    /// </remarks>
    [Parameter] public IComponentRenderMode? InteractiveRenderMode { get; set; } = RenderMode.InteractiveAuto;

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
}