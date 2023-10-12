using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A toggle button for a <see cref="Drawer"/> component.
/// </summary>
public partial class DrawerToggle
{
    /// <summary>
    /// The breakpoint at which the corresponding drawer is permanently hidden.
    /// </summary>
    [Parameter] public Breakpoint HideAtBreakpoint { get; set; }

    /// <summary>
    /// The breakpoint at which the corresponding drawer is permanently visible.
    /// </summary>
    [Parameter] public Breakpoint ShowAtBreakpoint { get; set; }

    /// <summary>
    /// The drawer side controlled by this toggle.
    /// </summary>
    [Parameter] public Side Side { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add(HideAtBreakpointClass)
        .Add(ShowAtBreakpointClass)
        .ToString();

    private string? HideAtBreakpointClass => HideAtBreakpoint switch
    {
        Breakpoint.None => null,
        _ => $"hidden-{HideAtBreakpoint.ToCSS()}",
    };

    private string? ShowAtBreakpointClass => ShowAtBreakpoint switch
    {
        Breakpoint.None => null,
        _ => $"visible-{ShowAtBreakpoint.ToCSS()}",
    };
}