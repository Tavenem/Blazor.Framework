using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An item displayed on a <see cref="Timeline"/>.
/// </summary>
public partial class TimelineItem
{
    /// <summary>
    /// Raised when the timeline dot is clicked.
    /// </summary>
    [Parameter] public EventCallback Clicked { get; set; }

    /// <summary>
    /// An optional icon which fills the dot.
    /// </summary>
    [Parameter] public string? Icon { get; set; }

    /// <summary>
    /// Content to display on the opposite side of the timeline from the <see
    /// cref="TavenemComponentBase.ChildContent"/>.
    /// </summary>
    [Parameter] public RenderFragment? OppositeContent { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("timeline-item")
        .Add(ThemeColor.ToCSS())
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private Task OnClickAsync() => Clicked.InvokeAsync();
}