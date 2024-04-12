using Microsoft.AspNetCore.Components;
using System.Drawing;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A picker for color values.
/// </summary>
/// <typeparam name="TValue">
/// <para>
/// The type of bound value. May be either a <see cref="string"/> or a <see
/// cref="System.Drawing.Color"/> (including a nullable version).
/// </para>
/// <para>
/// When binding to a string, any of the following notations are accepted as input:
/// <list type="bullet">
/// <item>
/// <term>Keyword</term>
/// <description>
/// A CSS color keyword.
/// </description>
/// </item>
/// <item>
/// <term>Hexadecimal</term>
/// <description>
/// A 3-, 6-, or 8-character CSS-style hexadecimal string (with or without leading '#').
/// </description>
/// </item>
/// <item>
/// <term>RGB(A)</term>
/// <description>
/// An rgb or rgba function with comma- or space-separated values enclosed in parentheses (the alpha
/// component is separated by a forward slash ('/') in space-separated notation.
/// </description>
/// </item>
/// <item>
/// <term>HSL(A)</term>
/// <description>
/// An hsl or hsla function with comma- or space-separated values enclosed in parentheses (the alpha
/// component is separated by a forward slash ('/') in space-separated notation.
/// </description>
/// </item>
/// </list>
/// </para>
/// <para>
/// The string returned will always be a 6-character hexadecimal string for colors with no alpha
/// component, or an rgba function for colors with an alpha component.
/// </para>
/// </typeparam>
public partial class ColorInput<TValue> : PickerComponentBase<TValue>
{
    private readonly Type _baseType;
    private readonly Type? _nullableType;

    /// <summary>
    /// The alpha value of the currently selected color, as a value in the range [0-1].
    /// </summary>
    public float Alpha { get; private set; }

    /// <summary>
    /// The blue component of the currently selected color.
    /// </summary>
    public byte Blue { get; private set; }

    /// <summary>
    /// <para>
    /// The mode of color input.
    /// </para>
    /// <para>
    /// This can be toggled by the user. Setting the value only configures the initial state.
    /// </para>
    /// <para>
    /// The default is <see cref="ColorMode.Hex"/>.
    /// </para>
    /// </summary>
    [Parameter] public ColorMode ColorMode { get; set; } = ColorMode.Hex;

    /// <summary>
    /// <para>
    /// The converter used to convert bound values to HTML input element values, and vice versa.
    /// </para>
    /// <para>
    /// Built-in input components have reasonable default converters for most data types, but you
    /// can supply your own for custom data.
    /// </para>
    /// </summary>
    [Parameter] public InputValueConverter<TValue>? Converter { get; set; }

    /// <summary>
    /// <para>
    /// The way a picker's activator should be displayed.
    /// </para>
    /// <para>
    /// Defaults to <see cref="PickerDisplayType.Field"/>.
    /// </para>
    /// </summary>
    [Parameter] public PickerDisplayType DisplayType { get; set; }

    /// <summary>
    /// The green component of the currently selected color.
    /// </summary>
    public byte Green { get; private set; }

    /// <summary>
    /// A CSS-style hexadecimal string which represents the currently selected color.
    /// </summary>
    public string HexColor { get; private set; }

    /// <summary>
    /// The hue of the currently selected color, in degrees.
    /// </summary>
    public ushort Hue { get; private set; }

    /// <summary>
    /// When <see cref="DisplayType"/> is <see cref="PickerDisplayType.Button"/> and this is <see
    /// langword="true"/>, the button displays an icon rather than the current selected color.
    /// </summary>
    [Parameter] public bool IconButton { get; set; }

    /// <summary>
    /// The lightness of the currently selected color, as a percentage in the range [0-100].
    /// </summary>
    public byte Lightness { get; private set; }

    /// <summary>
    /// <para>
    /// If set to <see langword="true"/> <see cref="string"/> output will always use hex notation
    /// (either 6- or 8-digit).
    /// </para>
    /// <para>
    /// Otherwise, 6-digit hex is used for colors without an alpha component, and rgba function
    /// notation is used for colors with alpha.
    /// </para>
    /// </summary>
    [Parameter] public bool OutputHexStrings { get; set; }

    /// <summary>
    /// The red component of the currently selected color.
    /// </summary>
    public byte Red { get; private set; }

    /// <summary>
    /// The saturation of the currently selected color, as a percentage in the range [0-100].
    /// </summary>
    public byte Saturation { get; private set; }

    /// <summary>
    /// <para>
    /// Whether to display controls for the alpha component of the color.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool ShowAlpha { get; set; } = true;

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("clearable", ShowClear)
        .ToString();

    private protected override bool ShrinkWhen => DisplayType == PickerDisplayType.Inline;

    private ColorFormatConverter Color { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="ColorInput{TValue}"/>.
    /// </summary>
    public ColorInput()
    {
        _nullableType = Nullable.GetUnderlyingType(typeof(TValue));
        _baseType = _nullableType ?? typeof(TValue);
        if (_baseType != typeof(string)
            && _baseType != typeof(Color))
        {
            throw new InvalidOperationException($"Type {_baseType.Name} is not supported. Only string and System.Drawing.Color are supported.");
        }

        Clearable = _nullableType is not null
            || _baseType == typeof(string);

        if (Clearable)
        {
            Color = ColorFormatConverter.Transparent;
        }
        else
        {
            Color = ColorFormatConverter.Black;
        }
        Alpha = Color.AlphaFloat;
        HexColor = Color.HexCompact;
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var newValue = parameters.TryGetValue<TValue>(
            nameof(Value),
            out var value)
            && ((value is null) != (Value is null)
                || value?.Equals(Value) == false);

        await base.SetParametersAsync(parameters);

        if (!ShowAlpha)
        {
            Alpha = 1;
        }

        if (newValue)
        {
            if (value is null)
            {
                Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
            }
            else
            {
                try
                {
                    if (_baseType == typeof(string))
                    {
                        Color = new((string)(object)value);
                    }
                    else if (_baseType == typeof(Color))
                    {
                        Color = new((Color)(object)value);
                    }
                    if (!ShowAlpha && Color.AlphaByte < 255)
                    {
                        Color = new(Color.Red, Color.Green, Color.Blue, 255);
                    }
                }
                catch
                {
                    Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
                }
            }

            Red = Color.Red;
            Green = Color.Green;
            Blue = Color.Blue;
            Hue = Color.Hue;
            Saturation = Color.Saturation;
            Lightness = Color.Lightness;
            Alpha = Color.AlphaFloat;
            HexColor = Color.HexCompact;
        }
    }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (Converter is not null)
        {
            if (Format?.Equals(Converter.Format) != true)
            {
                Converter.Format = Format;
            }
            if (FormatProvider?.Equals(Converter.FormatProvider) != true)
            {
                Converter.FormatProvider = FormatProvider;
            }
        }
    }

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public override Task ClearAsync()
    {
        if (Disabled || ReadOnly || !IsInteractive)
        {
            return Task.CompletedTask;
        }

        Color = ShowAlpha
            ? ColorFormatConverter.Transparent
            : ColorFormatConverter.Black;

        Red = Color.Red;
        Green = Color.Green;
        Blue = Color.Blue;
        Hue = Color.Hue;
        Saturation = Color.Saturation;
        Lightness = Color.Lightness;
        Alpha = Color.AlphaFloat;
        HexColor = Color.HexCompact;

        if (_nullableType is null)
        {
            if (_baseType == typeof(string))
            {
                CurrentValue = (TValue)(object)Color.HexCompact;
            }
            else if (_baseType == typeof(Color))
            {
                CurrentValue = (TValue)(object)Color.Color;
            }
        }
        else
        {
            CurrentValue = default;
        }

        StateHasChanged();

        return Task.CompletedTask;
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(TValue? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }

        if (value is Color color)
        {
            try
            {
                return new ColorFormatConverter(color).HexCompact;
            }
            catch
            {
                return base.FormatValueAsString(value);
            }
        }
        else if (value is string str)
        {
            try
            {
                return new ColorFormatConverter(str).HexCompact;
            }
            catch
            {
                return base.FormatValueAsString(value);
            }
        }
        else
        {
            return base.FormatValueAsString(value);
        }
    }

    private void OnValueChange(ValueChangeEventArgs e)
    {
        if (string.IsNullOrEmpty(e.Value))
        {
            Color = ShowAlpha
                ? ColorFormatConverter.Transparent
                : ColorFormatConverter.Black;
        }
        else
        {
            Color = new ColorFormatConverter(e.Value);
        }
        Red = Color.Red;
        Green = Color.Green;
        Blue = Color.Blue;
        Hue = Color.Hue;
        Saturation = Color.Saturation;
        Lightness = Color.Lightness;
        Alpha = Color.AlphaFloat;
        HexColor = Color.HexCompact;

        TValue? newValue;
        if (_baseType == typeof(string))
        {
            newValue = (TValue)(object)Color.HexCompact;
        }
        else if (_baseType == typeof(Color))
        {
            newValue = (TValue)(object)Color.Color;
        }
        else
        {
            newValue = default;
        }

        if (!IsNested
            && !EqualityComparer<TValue>.Default.Equals(newValue, CurrentValue))
        {
            EvaluateDebounced();
        }

        CurrentValue = newValue;
        StateHasChanged();
    }
}