using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A radio input group which indicates a level.
/// </summary>
public partial class Rating : FormComponentBase<byte>
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
    [Parameter] public string ActiveIcon { get; set; } = DefaultIcons.Star;

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
    [Parameter] public string InactiveIcon { get; set; } = DefaultIcons.Star;

    /// <summary>
    /// <para>
    /// Whether to add the "outlined" class to the icon when a rating control is either hovered, or
    /// it is less than or equal to the rating.
    /// </para>
    /// <para>
    /// The default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool IsActiveOutlined { get; set; }

    /// <summary>
    /// <para>
    /// Whether to add the "outlined" class to the icon when a rating control is not hovered, and is
    /// greater than the rating.
    /// </para>
    /// <para>
    /// The default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool IsInactiveOutlined { get; set; } = true;

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
    [Parameter] public override string? Name { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// Custom CSS class(es) for the rating item controls.
    /// </summary>
    [Parameter] public string? RatingItemClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the rating item controls.
    /// </summary>
    [Parameter] public string? RatingItemStyle { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("field")
        .Add("disabled", Disabled)
        .Add("read-only", ReadOnly)
        .Add("required", Required)
        .Add("no-label", string.IsNullOrEmpty(Label))
        .Add("modified", IsTouched)
        .Add("valid", IsValid)
        .Add("invalid", IsInvalidAndTouched)
        .Add(EffectiveThemeColor.ToCSS())
        .Add("rating")
        .ToString();

    /// <summary>
    /// The final value assigned to the rating item controls' class attribute, including component
    /// values.
    /// </summary>
    protected string? RatingItemCssClass => new CssBuilder("btn btn-icon")
        .Add(RatingItemClass)
        .ToString();

    private string? ActiveIconClass => IsActiveOutlined ? "checked outlined" : "checked";

    private string? InactiveIconClass => IsInactiveOutlined ? "unchecked outlined" : "unchecked";

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

    private void OnKeyDown(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly || !IsInteractive)
        {
            return;
        }

        switch (e.Key)
        {
            case "ArrowLeft":
                if (e.ShiftKey)
                {
                    OnValueDown(Value);
                }
                else
                {
                    OnValueDown(1);
                }
                break;
            case "ArrowRight":
                if (e.ShiftKey)
                {
                    OnValueUp(Max - Value);
                }
                else
                {
                    OnValueUp(1);
                }
                break;
            default:
                break;
        }
    }

    private async Task OnMouseOutAsync()
    {
        if (Disabled || ReadOnly || !IsInteractive)
        {
            return;
        }

        HoveredValue = null;
        await HoveredValueChanged.InvokeAsync(HoveredValue);
    }

    private async Task OnMouseOverAsync(int index)
    {
        if (Disabled || ReadOnly || !IsInteractive)
        {
            return;
        }

        HoveredValue = (byte)(index + 1);
        await HoveredValueChanged.InvokeAsync(HoveredValue);
    }

    private void OnRatingClick(int index)
    {
        if (Disabled || ReadOnly || !IsInteractive)
        {
            return;
        }
        SetValue((byte)(index + 1));
    }

    private void OnValueDown(int value)
    {
        if (Value == 0)
        {
            return;
        }
        if (Value >= value)
        {
            SetValue((byte)(Value - value));
        }
        else
        {
            SetValue(0);
        }
    }

    private void OnValueUp(int value)
    {
        if (Value >= Max)
        {
            return;
        }
        if (Value < Max - value)
        {
            SetValue((byte)(Value + value));
        }
        else
        {
            SetValue(Max);
        }
    }

    private void SetValue(byte value)
    {
        if (Equals(value, CurrentValue))
        {
            return;
        }

        CurrentValue = value;
        HasConversionError = false;

        if (!IsNested)
        {
            EvaluateDebounced();
        }

        if (!IsTouched
            && !Equals(value, InitialValue))
        {
            SetTouchedDebounced();
        }
    }
}