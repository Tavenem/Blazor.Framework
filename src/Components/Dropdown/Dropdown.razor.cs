using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Services.Popovers;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A popup menu activated by a button.
/// </summary>
public partial class Dropdown
{
    private const Origin _defaultPopoverOrigin = Origin.Top_Left;

    /// <summary>
    /// <para>
    /// The type of interaction which will trigger this menu.
    /// </para>
    /// <para>
    /// Set to <see cref="MouseEvent.LeftClick"/> by default.
    /// </para>
    /// </summary>
    [Parameter] public MouseEvent ActivationType { get; set; } = MouseEvent.LeftClick;

    /// <summary>
    /// <para>
    /// The id of an element which should be used as the anchor for the popover
    /// (optional).
    /// </para>
    /// <para>
    /// If left unset the button will automatically be set as the anchor.
    /// </para>
    /// </summary>
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
    [Parameter] public Origin? AnchorOrigin { get; set; }

    /// <summary>
    /// Raised when the button is clicked, if <see cref="HideButton"/> is <see langword="false"/>
    /// and <see cref="ActivationType"/> does not include <see cref="MouseEvent.LeftClick"/>.
    /// </summary>
    /// <remarks>
    /// Only functions when the component is rendered in an interactive mode.
    /// </remarks>
    [Parameter] public EventCallback Click { get; set; }

    /// <summary>
    /// <para>
    /// When <see cref="ActivationType"/> includes <see cref="MouseEvent.MouseOver"/>, this is the
    /// delay in milliseconds between the mouseover and the dropdown opening.
    /// </para>
    /// <para>
    /// Default is zero.
    /// </para>
    /// </summary>
    [Parameter] public int Delay { get; set; }

    /// <summary>
    /// Whether the popover list should use dense padding.
    /// </summary>
    [Parameter] public bool Dense { get; set; }

    /// <summary>
    /// Whether this menu is currently disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// If <see langword="true"/> no trigger button will appear.
    /// </summary>
    [Parameter] public bool HideButton { get; set; }

    /// <summary>
    /// An icon to display on the toggle button.
    /// </summary>
    [Parameter] public string? Icon { get; set; }

    /// <summary>
    /// <para>
    /// The id of the button element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// Invoked when the dropdown opens or closes.
    /// </summary>
    /// <remarks>
    /// Only functions when the component is rendered in an interactive mode.
    /// </remarks>
    [Parameter] public EventCallback<bool> IsOpenChanged { get; set; }

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
    /// If <see langword="true"/> the popover will open at the position of the mouse click or tap
    /// event.
    /// </summary>
    [Parameter] public bool OpenAtPointer { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the popover.
    /// </summary>
    [Parameter] public string? PopoverClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the popover.
    /// </summary>
    [Parameter] public string? PopoverStyle { get; set; }

    /// <summary>
    /// <para>
    /// The connection point of the popover to the anchor point.
    /// </para>
    /// <para>
    /// For example, <see cref="Origin.Top_Left"/> means that the top-left
    /// corner of the popover will be connected to the anchor point.
    /// </para>
    /// </summary>
    [Parameter] public Origin? PopoverOrigin { get; set; }

    /// <summary>
    /// Text to display on the toggle button.
    /// </summary>
    [Parameter] public string? Text { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The trigger for the dropdown.
    /// </summary>
    /// <remarks>
    /// When omitted, a button is displayed using the <see cref="Icon"/>, <see cref="Text"/>, and
    /// <see cref="ThemeColor"/> properties to define its appearance.
    /// </remarks>
    [Parameter] public RenderFragment? TriggerContent { get; set; }

    /// <summary>
    /// The CSS class assigned to the popover's list, including component values.
    /// </summary>
    protected string? ListCssClass => new CssBuilder("list clickable filled solid")
        .Add("dense", Dense)
        .Add(ThemeColor.ToCSS())
        .ToString();

    /// <summary>
    /// The CSS class assigned to the popover, including component values.
    /// </summary>
    protected string? PopoverCssClass => new CssBuilder(PopoverClass)
        .Add("filled")
        .ToString();

    private Origin? AnchorOriginOverride => OpenAtPointer ? Origin.Top_Left : null;

    private Origin AnchorOriginValue => AnchorOriginOverride ?? AnchorOrigin ?? DefaultAnchorOrigin;

    /// <summary>
    /// The CSS class assigned to the button, including component values.
    /// </summary>
    private string? ButtonCssClass => new CssBuilder("btn")
        .Add("btn-icon", !string.IsNullOrEmpty(Icon) && string.IsNullOrEmpty(Text))
        .Add(ThemeColor.ToCSS())
        .ToString();

    private Origin DefaultAnchorOrigin => HideButton ? Origin.Top_Left : Origin.Bottom_Left;

    private double? PopoverPositionX { get; set; }

    private double? PopoverPositionY { get; set; }

    private Origin PopoverOriginValue => PopoverOrigin ?? _defaultPopoverOrigin;

    [Inject, NotNull] PopoverService? PopoverService { get; set; }

    /// <inheritdoc/>
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
    /// Close the dropdown.
    /// </summary>
    public Task CloseAsync() => PopoverService.SetDropdownOpenAsync(Id, false);

    /// <summary>
    /// Opens the dropdown.
    /// </summary>
    public Task OpenAsync() => PopoverService.SetDropdownOpenAsync(Id, true);

    /// <summary>
    /// Toggles the open state of the dropdown.
    /// </summary>
    public Task ToggleAsync() => PopoverService.ToggleDropdownAsync(Id);

    private async Task OnButtonClickAsync()
    {
        if (!ActivationType.HasFlag(MouseEvent.LeftClick))
        {
            await Click.InvokeAsync();
        }
    }

    private Task OnOpenChangedAsync(DropdownToggleEventArgs e)
        => IsOpenChanged.InvokeAsync(e.Value);
}