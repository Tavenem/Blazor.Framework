using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A radio input group which indicates a level.
/// </summary>
public partial class Rating
{
    /// <summary>
    /// <para>
    /// The name of the icon to use when a rating control is either hovered, or it is less than or
    /// equal to the rating.
    /// </para>
    /// <para>
    /// The default is "star".
    /// </para>
    /// </summary>
    [Parameter] public string ActiveIcon { get; set; } = "star";

    /// <summary>
    /// If <see langword="true"/>, the component will be disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// The value being hovered over by the user.
    /// </summary>
    [Parameter] public byte? HoveredValue { get; set; }

    /// <summary>
    /// Invoked when <see cref="HoveredValue"/> changes.
    /// </summary>
    [Parameter] public EventCallback<byte?> HoveredValueChanged { get; set; }

    /// <summary>
    /// <para>
    /// The name of the icon to use when a rating control is not hovered, and is greater than the
    /// rating.
    /// </para>
    /// <para>
    /// The default is "star_border".
    /// </para>
    /// </summary>
    [Parameter] public string InactiveIcon { get; set; } = "star_border";

    /// <summary>
    /// <para>
    /// The maximum value (number of rating icons).
    /// </para>
    /// <para>
    /// Default is 5.
    /// </para>
    /// <para>
    /// Must be at least 1. Setting it to zero results in a value of 1.
    /// </para>
    /// </summary>
    [Parameter] public byte Max { get; set; } = 5;

    /// <summary>
    /// <para>
    /// The name of the input group.
    /// </para>
    /// <para>
    /// Defaults to a random <see cref="Guid"/>.
    /// </para>
    /// </summary>
    [Parameter] public string Name { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Custom CSS class(es) for the rating item controls.
    /// </summary>
    [Parameter] public string? RatingItemClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the rating item controls.
    /// </summary>
    [Parameter] public string? RatingItemStyle { get; set; }

    /// <summary>
    /// If <see langword="true"/>, the component will not be editable, but will not have the dim
    /// color of a disabled component.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The value of this input.
    /// </summary>
    [Parameter] public byte Value { get; set; }

    /// <summary>
    /// Invoked when <see cref="Value"/> changes.
    /// </summary>
    [Parameter] public EventCallback<byte> ValueChanged { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("rating")
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .Add("readonly", ReadOnly)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssStyle => new CssBuilder()
        .Add(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the rating item controls' class attribute, including component
    /// values.
    /// </summary>
    protected string? RatingItemCssClass => new CssBuilder("btn btn-icon")
        .Add(RatingItemClass)
        .ToString();

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (Max < 1)
        {
            Max = 1;
        }
    }

    private bool IndexIsActive(int index) => HoveredValue.HasValue
        ? index < HoveredValue.Value
        : index < Value;

    private async Task OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        switch (e.Key)
        {
            case "ArrowLeft":
                if (e.ShiftKey)
                {
                    await OnValueDownAsync(Value);
                }
                else
                {
                    await OnValueDownAsync(1);
                }
                break;
            case "ArrowRight":
                if (e.ShiftKey)
                {
                    await OnValueUpAsync(Max - Value);
                }
                else
                {
                    await OnValueUpAsync(1);
                }
                break;
            default:
                break;
        }
    }

    private async Task OnMouseOutAsync()
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        HoveredValue = null;
        await HoveredValueChanged.InvokeAsync(HoveredValue);
    }

    private async Task OnMouseOverAsync(int index)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        HoveredValue = (byte)(index + 1);
        await HoveredValueChanged.InvokeAsync(HoveredValue);
    }

    private async Task OnRatingClickAsync(int index)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }
        Value = (byte)(index + 1);
        await ValueChanged.InvokeAsync(Value);
    }

    private async Task OnValueDownAsync(int value)
    {
        if (Value == 0)
        {
            return;
        }
        if (Value >= value)
        {
            Value = (byte)(Value - value);
        }
        else
        {
            Value = 0;
        }
        await ValueChanged.InvokeAsync(Value);
    }

    private async Task OnValueUpAsync(int value)
    {
        if (Value >= Max)
        {
            return;
        }
        if (Value < Max - value)
        {
            Value = (byte)(Value + value);
        }
        else
        {
            Value = Max;
        }
        await ValueChanged.InvokeAsync(Value);
    }
}