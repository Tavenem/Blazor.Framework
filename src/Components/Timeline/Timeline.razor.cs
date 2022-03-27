using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays a collection of <see cref="TimelineItem"/>s along a line.
/// </summary>
public partial class Timeline
{
    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("timeline")
        .Add(ThemeColor.ToCSS())
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();
}