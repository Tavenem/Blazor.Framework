using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Diagnostics.CodeAnalysis;
using System.Drawing;
using System.Globalization;
using System.Text;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A picker for color values.
/// </summary>
/// <typeparam name="TValue">
/// <para>
/// The type of bound value. May be either <see cref="System.Drawing.Color"/>, or <see
/// cref="string"/>.
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
public partial class ColorInput<TValue>
{
    private const int OverlayHeight = 250;
    private const int OverlayWidth = 312;
    private const int HalfSelectorSize = 13;

    private readonly Guid _overlayId = Guid.NewGuid();
    private readonly string _overlayIdString;

    private bool _addMouseOverEvent;
    private bool _disposedValue;
    private Guid? _eventListenerId;
    private double _selectorX, _selectorY;

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
    /// Whether to display this picker as an inline component.
    /// </para>
    /// <para>
    /// If not, an input field is displayed inline instead, and the picker is displayed in a popup
    /// when the field has focus.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool Inline { get; set; }

    /// <summary>
    /// Whether to display controls for the alpha component of the color.
    /// </summary>
    [Parameter] public bool ShowAlpha { get; set; }

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected override string? DisplayString => Color.Keyword ?? Color.Css;

    private protected override bool ShrinkWhen => Inline
        || base.ShrinkWhen;

    private float Alpha { get; set; }

    private string AlphaSliderStyle => new StringBuilder("background-image:linear-gradient(to right, transparent, ")
        .Append(Color.Css)
        .Append(')')
        .ToString();

    private byte Blue { get; set; }

    private ColorFormatConverter Color { get; set; } = ColorFormatConverter.DefaultPrimary;

    private byte Green { get; set; }

    private string HexColor { get; set; }

    private string? HexInput { get; set; }

    private ushort Hue { get; set; }

    [Inject] IJSEventListener JSEventListener { get; set; } = default!;

    private byte Lightness { get; set; }

    private byte Red { get; set; }

    private byte Saturation { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="ColorInput{TValue}"/>.
    /// </summary>
    public ColorInput()
    {
        var targetType = typeof(TValue);
        if (targetType != typeof(string)
            && targetType != typeof(Color))
        {
            throw new InvalidOperationException($"Type {targetType.Name} is not supported");
        }

        _overlayIdString = _overlayId.ToString("N");

        Clearable = targetType == typeof(string);

        Red = ColorFormatConverter.DefaultPrimary.Red;
        Green = ColorFormatConverter.DefaultPrimary.Green;
        Blue = ColorFormatConverter.DefaultPrimary.Blue;
        Hue = ColorFormatConverter.DefaultPrimary.Hue;
        Saturation = ColorFormatConverter.DefaultPrimary.Saturation;
        Lightness = ColorFormatConverter.DefaultPrimary.Lightness;
        Alpha = ColorFormatConverter.DefaultPrimary.AlphaFloat;
        HexColor = ColorFormatConverter.DefaultPrimary.HexCompact;
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        await base.SetParametersAsync(parameters);

        if (!ShowAlpha)
        {
            Alpha = 1;
        }

        var updated = false;
        if (parameters.TryGetValue<byte>(nameof(Red), out _)
            || parameters.TryGetValue<byte>(nameof(Green), out _)
            || parameters.TryGetValue<byte>(nameof(Blue), out _))
        {
            updated = true;
            try
            {
                Color = new ColorFormatConverter(Red, Green, Blue, Alpha);
            }
            catch
            {
                Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
            }
        }
        else if (parameters.TryGetValue<ushort>(nameof(Hue), out _)
            || parameters.TryGetValue<byte>(nameof(Saturation), out _)
            || parameters.TryGetValue<byte>(nameof(Lightness), out _))
        {
            updated = true;
            try
            {
                Color = ColorFormatConverter.FromHSLA(Hue, Saturation, Lightness, Alpha);
            }
            catch
            {
                Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
            }
        }
        else if (parameters.TryGetValue<string>(nameof(HexInput), out _))
        {
            updated = true;
            if (string.IsNullOrWhiteSpace(HexInput))
            {
                Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
            }
            else
            {
                try
                {
                    Color = new ColorFormatConverter(HexInput);
                }
                catch
                {
                    Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
                }
            }
        }
        else if (parameters.TryGetValue<TValue>(nameof(Value), out _))
        {
            updated = true;
            if (string.IsNullOrWhiteSpace(HexInput))
            {
                Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
            }
            else
            {
                try
                {
                    Color = new ColorFormatConverter(HexInput);
                }
                catch
                {
                    Color = ShowAlpha ? ColorFormatConverter.Transparent : ColorFormatConverter.Black;
                }
            }
        }

        if (updated)
        {
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
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if ((firstRender && Inline)
            || _addMouseOverEvent)
        {
            await AddMouseOverEventAsync();
        }
    }

    /// <inheritdoc/>
    protected override async void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing && _eventListenerId.HasValue)
            {
                await JSEventListener.UnsubscribeAsync(_eventListenerId.Value);
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public override void Clear()
    {
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

        if (typeof(TValue) == typeof(string))
        {
            CurrentValue = (TValue)(object)Color.Css;
        }
        else if (typeof(TValue) == typeof(Color))
        {
            CurrentValue = (TValue)(object)Color.Color;
        }
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
            return color.ToArgb().ToString(CultureInfo.InvariantCulture);
        }
        else if (value is string str)
        {
            try
            {
                return new ColorFormatConverter(str).Css;
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

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out TValue result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = default;
        validationErrorMessage = null;
        var success = false;

        if (Converter is not null
            && Converter.TryGetValue(value, out result))
        {
            success = true;
        }
        else if (typeof(TValue) == typeof(Color))
        {
            if (int.TryParse(value, CultureInfo.InvariantCulture, out var input))
            {
                result = (TValue)(object)System.Drawing.Color.FromArgb(input);
                success = true;
            }
            else
            {
                validationErrorMessage = GetConversionValidationMessage();
            }
        }
        else if (typeof(TValue) == typeof(string))
        {
            if (string.IsNullOrEmpty(value))
            {
                result = ShowAlpha
                    ? (TValue)(object)ColorFormatConverter.Transparent.Css
                    : (TValue)(object)ColorFormatConverter.Black.Css;
                success = true;
            }
            else
            {
                try
                {
                    var css = new ColorFormatConverter(value).Css;
                    result = (TValue)(object)css;
                    success = true;
                }
                catch
                {
                    validationErrorMessage = GetConversionValidationMessage();
                }
            }
        }
        else
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

        HasConversionError = !success;

        if (!IsTouched
            && (!EqualityComparer<TValue>.Default.Equals(result, InitialValue)
            || HasConversionError))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && (HasConversionError
            || !EqualityComparer<TValue>.Default.Equals(result, CurrentValue)))
        {
            EvaluateDebounced();
        }

        return success;
    }

    private protected override Task OnClosePopoverAsync()
        => RemoveMouseOverEventAsync();

    private protected override void OnOpenPopover()
    {
        _addMouseOverEvent = true;
        StateHasChanged();
    }

    private async Task AddMouseOverEventAsync() => _eventListenerId = await JSEventListener
        .SubscribeAsync<MouseEventArgs>(
        "mousemove",
        _overlayIdString,
        true,
        10,
        async e =>
        {
            var args = e as MouseEventArgs;
            if (args is not null)
            {
                await InvokeAsync(() => OnColorOverlayInteract(args));
                StateHasChanged();
            }
        });

    private string GetSelectorStyle() => $"transform:translate({_selectorX.ToPixels(2)}, {_selectorY.ToPixels(2)})";

    private void OnColorOverlayInteract(MouseEventArgs e)
    {
        if (e.Buttons != 1)
        {
            return;
        }

        _selectorX = Math.Clamp(e.OffsetX, 0, OverlayWidth);
        _selectorY = Math.Clamp(e.OffsetY, 0, OverlayHeight);
        UpdateColor();
    }

    private void OnCycleMode() => ColorMode = ColorMode switch
    {
        ColorMode.HSL => ColorMode.Hex,
        ColorMode.RGB => ColorMode.HSL,
        _ => ColorMode.RGB,
    };

    private void OnSelectorClicked(MouseEventArgs e)
    {
        _selectorX = Math.Clamp(e.OffsetX - HalfSelectorSize + _selectorX, 0, OverlayWidth);
        _selectorY = Math.Clamp(e.OffsetY - HalfSelectorSize + _selectorY, 0, OverlayHeight);
        UpdateColor();
    }

    private async Task RemoveMouseOverEventAsync()
    {
        if (_eventListenerId.HasValue)
        {
            await JSEventListener.UnsubscribeAsync(_eventListenerId.Value);
        }
    }

    private void UpdateColor()
    {
        var x = _selectorX / OverlayWidth;

        var r_x = 255 - (int)((255 - Red) * x);
        var g_x = 255 - (int)((255 - Green) * x);
        var b_x = 255 - (int)((255 - Blue) * x);

        var y = 1.0 - (_selectorY / OverlayHeight);

        var r = (byte)Math.Clamp((int)Math.Round(r_x * y), 0, 255);
        var g = (byte)Math.Clamp((int)Math.Round(g_x * y), 0, 255);
        var b = (byte)Math.Clamp((int)Math.Round(b_x * y), 0, 255);
        Color = ShowAlpha
            ? new ColorFormatConverter(r, g, b, Alpha)
            : new ColorFormatConverter(r, g, b);
        Red = Color.Red;
        Green = Color.Green;
        Blue = Color.Blue;
        Hue = Color.Hue;
        Saturation = Color.Saturation;
        Lightness = Color.Lightness;
        Alpha = Color.AlphaFloat;
        HexColor = Color.HexCompact;

        if (typeof(TValue) == typeof(string))
        {
            CurrentValue = (TValue)(object)Color.Css;
        }
        else if (typeof(TValue) == typeof(Color))
        {
            CurrentValue = (TValue)(object)Color.Color;
        }
    }
}