using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays a <see cref="Popover"/> when an associated element is hovered.
/// </summary>
/// <remarks>
/// <para>
/// Set the <c>data-tooltip-id</c> HTML attribute on any element to the <see cref="Id"/> value
/// of a <c>Tooltip</c> component to associate the element with that tooltip.
/// </para>
/// <para>
/// Nest a <c>Tooltip</c> inside an element to associate them automatically.
/// </para>
/// </remarks>
public partial class Tooltip
{
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
    [Parameter] public int Delay { get; set; }

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
    /// If <see langword="true"/> this component will render as a visible button, which will be
    /// automatically associated with the tooltip.
    /// </summary>
    /// <remarks>
    /// A tooltip with a visible button can still be associated with elements which reference it by
    /// <see cref="Id"/>, but will not respond to events for its containing element.
    /// </remarks>
    [Parameter] public bool IsButton { get; set; }

    /// <summary>
    /// <para>
    /// Whether the <c>Tooltip</c> component's containing element should act as a tooltip trigger.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// This should usually be set to <see langword="false"/> for tooltips which are intended to be
    /// triggered by <see cref="Id"/>, unless their container is also intended to be a tooltip
    /// trigger.
    /// </remarks>
    [Parameter] public bool IsContainerTrigger { get; set; } = true;

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