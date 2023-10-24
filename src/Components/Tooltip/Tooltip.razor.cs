using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Attaches a <see cref="Popover"/> to an element and displays it when the anchor element is
/// hovered.
/// </summary>
public partial class Tooltip
{
    /// <summary>
    /// The HTML <c>id</c> of an element to which this tooltip should be attached. The tooltip will
    /// be displayed when the use hovers over the anchor.
    /// </summary>
    /// <remarks>
    /// If no anchor is assigned, a button will be displayed which can be used to display the
    /// tooltip. This button will also be visible even for anchored tooltips on non-hover devices
    /// (usually devices which do not use a mouse).
    /// </remarks>
    [Parameter] public string? Anchor { get; set; }

    /// <summary>
    /// <para>
    /// Whether the tooltip should have an arrow pointing towards its anchor element.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool Arrow { get; set; } = true;

    /// <summary>
    /// The delay before showing the tooltip, in milliseconds.
    /// </summary>
    [Parameter] public int Delay { get; set; } = 0;

    /// <summary>
    /// <para>
    /// Whether the tooltip should be dismissed when it is tapped with the pointer.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>, which permits interaction with the tooltip content.
    /// </para>
    /// </summary>
    [Parameter] public bool DismissOnTap { get; set; }

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
    /// <para>
    /// Sets the max-height CSS style for the tooltip.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxHeight { get; set; }

    /// <summary>
    /// The side of the element on which the tooltip will appear (if there is room).
    /// </summary>
    [Parameter] public Side Side { get; set; } = Side.Bottom;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <inheritdoc />
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("tooltip")
        .Add("arrow", Arrow)
        .ToString();

    private Origin AnchorOrigin => Side switch
    {
        Side.Top => Origin.Top_Center,
        Side.Bottom => Origin.Bottom_Center,
        Side.Left => Origin.Center_Left,
        Side.Right => Origin.Center_Right,
        _ => Origin.Center_Center,
    };

    private Origin PopoverOrigin => Side switch
    {
        Side.Top => Origin.Bottom_Center,
        Side.Bottom => Origin.Top_Center,
        Side.Left => Origin.Center_Right,
        Side.Right => Origin.Center_Left,
        _ => Origin.Center_Center,
    };

    [Inject, NotNull] private PopoverService? TooltipService { get; set; }

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
    /// Hides this tooltip.
    /// </summary>
    public Task HideAsync() => TooltipService.SetTooltipVisibilityAsync(Id, false);

    /// <summary>
    /// Shows this tooltip.
    /// </summary>
    public Task ShowAsync() => TooltipService.SetTooltipVisibilityAsync(Id, true);

    /// <summary>
    /// Toggles the visibility of this tooltip.
    /// </summary>
    public Task ToggleAsync() => TooltipService.ToggleTooltipAsync(Id);
}