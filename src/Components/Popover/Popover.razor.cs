using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A popover component which displays above other elements.
/// </summary>
public partial class Popover
{
    /// <summary>
    /// <para>
    /// The id of an HTML element which should be used as the anchor for this popover (optional).
    /// </para>
    /// <para>
    /// If no anchor element is set, the popover's nearest containing parent with relative position
    /// is used as its anchor, as well as its container.
    /// </para>
    /// </summary>
    /// <remarks>
    /// The anchor element must have the same offset parent as the popover (nearest positioned
    /// ancestor element in the containment hierarchy).
    /// </remarks>
    [Parameter] public string? AnchorId { get; set; }

    /// <summary>
    /// <para>
    /// The anchor point of the element to which the popover is attached.
    /// </para>
    /// <para>
    /// For example, <see cref="Origin.Bottom_Right"/> means that the popover
    /// will be attached to the bottom-right corner of the anchor element.
    /// </para>
    /// </summary>
    [Parameter] public Origin AnchorOrigin { get; set; } = Origin.Bottom_Center;

    /// <summary>
    /// The delay between opening the popover and performing the visibility
    /// transition, in milliseconds.
    /// </summary>
    [Parameter] public double Delay { get; set; } = 0;

    /// <summary>
    /// <para>
    /// Whether the popover should be dismissed when clicking outside it.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool DismissOnTapOutside { get; set; }

    /// <summary>
    /// <para>
    /// Controls how the popover behaves when there isn't enough space in the
    /// direction it would normally open.
    /// </para>
    /// <para>
    /// Defaults to <see cref="FlipBehavior.Flip_OnOpen"/>.
    /// </para>
    /// </summary>
    [Parameter] public FlipBehavior FlipBehavior { get; set; } = FlipBehavior.Flip_OnOpen;

    /// <summary>
    /// <para>
    /// The id of an HTML element which should be ignored for the purpose of determining when the
    /// popover's focus state changes.
    /// </para>
    /// <para>
    /// The may be the same as <see cref="AnchorId"/>, but does not need to be.
    /// </para>
    /// </summary>
    [Parameter] public string? FocusId { get; set; }

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A generated id will be assigned if none is supplied (including through splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// Whether the popover is currently visible.
    /// </summary>
    [Parameter] public bool IsOpen { get; set; }

    /// <summary>
    /// Whether the popover should have its max-width set to the width of its anchor element.
    /// </summary>
    [Parameter] public bool LimitWidth { get; set; }

    /// <summary>
    /// Whether the popover should have its min-width set to the width of its anchor element.
    /// </summary>
    [Parameter] public bool MatchWidth { get; set; }

    /// <summary>
    /// <para>
    /// Sets the max-height CSS style for the popover.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxHeight { get; set; }

    /// <summary>
    /// <para>
    /// Sets the max-width CSS style for the popover.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// <para>
    /// Default is "90vw."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxWidth { get; set; } = "90vw";

    /// <summary>
    /// A number of pixels this popover is offset from the left edge of its anchor.
    /// </summary>
    [Parameter] public double? OffsetX { get; set; }

    /// <summary>
    /// A number of pixels this popover is offset from the top edge of its anchor.
    /// </summary>
    [Parameter] public double? OffsetY { get; set; }

    /// <summary>
    /// <para>
    /// Set to enable absolute positioning. The popover will be placed this number of pixels from
    /// the left edge of the viewport.
    /// </para>
    /// <para>
    /// Note: both this and <see cref="PositionY"/> must be set, or the value will be ignored.
    /// </para>
    /// </summary>
    [Parameter] public double? PositionX { get; set; }

    /// <summary>
    /// <para>
    /// Set to enable absolute positioning. The popover will be placed this number of pixels from
    /// the top edge of the viewport.
    /// </para>
    /// <para>
    /// Note: both this and <see cref="PositionX"/> must be set, or the value will be ignored.
    /// </para>
    /// </summary>
    [Parameter] public double? PositionY { get; set; }

    /// <summary>
    /// <para>
    /// The connection point of the popover to the anchor point.
    /// </para>
    /// <para>
    /// For example, <see cref="Origin.Top_Left"/> means that the top-left
    /// corner of the popover will be connected to the anchor point.
    /// </para>
    /// </summary>
    [Parameter] public Origin PopoverOrigin { get; set; } = Origin.Top_Center;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    internal ElementReference ElementReference { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add(FlipBehavior.ToCSS())
        .Add(ThemeColor.ToCSS())
        .Add("limit-width", LimitWidth)
        .Add("match-width", MatchWidth)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .AddStyle("transition-delay", $"{Delay}ms")
        .AddStyle("max-height", MaxHeight)
        .AddStyle("max-width", MaxWidth)
        .AddStyle("overflow-y", "auto", !string.IsNullOrEmpty(MaxHeight))
        .ToString();

    /// <inheritdoc />
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
    }

    /// <summary>
    /// Gives focus to the popover element.
    /// </summary>
    public ValueTask FocusAsync() => ElementReference.FocusFirstAsync();
}