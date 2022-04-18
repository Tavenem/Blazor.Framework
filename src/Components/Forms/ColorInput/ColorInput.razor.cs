using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Drawing;
using System.Globalization;
using System.Text;

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
public partial class ColorInput<TValue>
{
    private const int OverlayHeight = 250;
    private const int OverlayMargin = 40;
    private const int OverlayWidth = 312;
    private const int HalfSelectorSize = 13;
    private readonly Type _baseType;
    private readonly Type? _nullableType;
    private readonly Guid _overlayId = Guid.NewGuid();
    private readonly string _overlayIdString;

    private bool _addMouseOverEvent;
    private bool _disposedValue;
    private Guid? _eventListenerId;
    private double _selectorX;
    private double _selectorY = OverlayHeight;

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
    /// The lightness of the currently selected color, as a percentage in the range [0-100].
    /// </summary>
    public byte Lightness { get; private set; }

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

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected override string? DisplayString => CurrentValue is null
        ? null
        : (Color.Keyword ?? Color.Css);

    private protected override bool ShrinkWhen => Inline
        || CurrentValue is not null;

    private string AlphaSliderStyle => new StringBuilder("--alpha-background:linear-gradient(to right, transparent, ")
        .Append("hsl(")
        .Append(Hue)
        .Append(",100%,50%))")
        .ToString();

    private ColorFormatConverter Color { get; set; }

    private string? CycleButtonClass => new CssBuilder("btn btn-icon")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string? HexInput { get; set; }

    private Slider<ushort>? HueSlider { get; set; }

    [Inject] IJSEventListener JSEventListener { get; set; } = default!;

    private string OverlayStyle => Disabled
        ? $"background-color:hsl({Hue},{(int)Math.Round(Math.Max(10, Saturation / 5.0))}%,{Lightness}%)"
        : $"background-color:hsl({Hue},100%,50%)";

    private string SelectorStyle => $"transform:translate({_selectorX.ToPixels(0)}, {_selectorY.ToPixels(0)})";

    private string SwatchStyle => Disabled
        ? $"background-color:hsl({Hue},{(int)Math.Round(Math.Max(10, Saturation / 5.0))}%,{Lightness}%)"
        : $"background:{Color.Css}";

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

        _overlayIdString = _overlayId.ToString("N");

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
        HexInput = Color.HexCompact;
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        await base.SetParametersAsync(parameters);

        if (!ShowAlpha)
        {
            Alpha = 1;
        }

        if (parameters.TryGetValue<TValue>(nameof(Value), out var value))
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
            HexInput = Color.HexCompact;
            _selectorX = Saturation / 100.0 * OverlayWidth;
            _selectorY = ((Lightness / 100.0) + 1) * OverlayHeight;
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
        if (Disabled || ReadOnly)
        {
            return;
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
        _selectorX = Saturation / 100.0 * OverlayWidth;
        _selectorY = ((Lightness / 100.0) + 1) * OverlayHeight;

        if (_nullableType is null)
        {
            if (_baseType == typeof(string))
            {
                CurrentValue = (TValue)(object)Color.Css;
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
    }

    /// <summary>
    /// Focuses this element.
    /// </summary>
    public override async Task FocusAsync()
    {
        if (Inline && HueSlider is not null)
        {
            await HueSlider.FocusAsync();
        }
        else
        {
            await ElementReference.FocusAsync();
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

    private protected override Task OnClosePopoverAsync()
        => RemoveMouseOverEventAsync();

    private protected override void OnOpenPopover()
    {
        _addMouseOverEvent = true;
        StateHasChanged();
    }

    private async Task AddMouseOverEventAsync()
    {
        _addMouseOverEvent = false;
        _eventListenerId = await JSEventListener
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
    }

    private void OnAlphaSliderChanged(float alpha)
    {
        if (Alpha == 0 && alpha > 0)
        {
            Saturation = 100;
            Lightness = 50;
        }
        Alpha = alpha;
        OnHSLChanged();
    }

    private void OnAlphaValueChanged(float alpha)
    {
        Alpha = alpha;
        if (ColorMode == ColorMode.RGB)
        {
            OnRGBChanged();
        }
        else
        {
            OnHSLChanged();
        }
    }

    private void OnBlueChanged(byte blue)
    {
        Blue = blue;
        OnRGBChanged();
    }

    private void OnColorOverlayClick(MouseEventArgs e)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        _selectorX = Math.Clamp(e.OffsetX - OverlayMargin, 0, OverlayWidth);
        _selectorY = Math.Clamp(e.OffsetY - OverlayMargin, 0, OverlayHeight);
        UpdateColor();
    }

    private void OnColorOverlayInteract(MouseEventArgs e)
    {
        if (e.Buttons == 1)
        {
            OnColorOverlayClick(e);
        }
    }

    private void OnCycleMode()
    {
        if (Disabled)
        {
            return;
        }

        ColorMode = ColorMode switch
        {
            ColorMode.HSL => ColorMode.Hex,
            ColorMode.RGB => ColorMode.HSL,
            _ => ColorMode.RGB,
        };
    }

    private void OnGreenChanged(byte green)
    {
        Green = green;
        OnRGBChanged();
    }

    private void OnHSLChanged()
    {
        try
        {
            Color = ColorFormatConverter.FromHSLA(Hue, Saturation, Lightness, Alpha);
            Red = Color.Red;
            Green = Color.Green;
            Blue = Color.Blue;
            HexColor = Color.HexCompact;
            HexInput = Color.HexCompact;
            _selectorX = Saturation / 100.0 * OverlayWidth;
            _selectorY = ((Lightness / 100.0) + 1) * OverlayHeight;
            SetValue();
        }
        catch { }
    }

    private void OnHexChanged(string? hex)
    {
        HexInput = hex;
        if (string.IsNullOrWhiteSpace(HexInput))
        {
            return;
        }

        try
        {
            Color = new ColorFormatConverter(HexInput);
            Red = Color.Red;
            Green = Color.Green;
            Blue = Color.Blue;
            Hue = Color.Hue;
            Saturation = Color.Saturation;
            Lightness = Color.Lightness;
            Alpha = Color.AlphaFloat;
            HexColor = Color.HexCompact;
            _selectorX = Saturation / 100.0 * OverlayWidth;
            _selectorY = ((Lightness / 100.0) + 1) * OverlayHeight;
            SetValue();
        }
        catch { }
    }

    private void OnHueChanged(ushort hue)
    {
        Hue = hue;
        OnHSLChanged();
    }

    private void OnLightnessChanged(byte lightness)
    {
        Lightness = lightness;
        OnHSLChanged();
    }

    private void OnRedChanged(byte red)
    {
        Red = red;
        OnRGBChanged();
    }

    private void OnRGBChanged()
    {
        try
        {
            Color = new ColorFormatConverter(Red, Green, Blue, Alpha);
            Hue = Color.Hue;
            Saturation = Color.Saturation;
            Lightness = Color.Lightness;
            HexColor = Color.HexCompact;
            HexInput = Color.HexCompact;
            _selectorX = Saturation / 100.0 * OverlayWidth;
            _selectorY = ((Lightness / 100.0) + 1) * OverlayHeight;
            SetValue();
        }
        catch { }
    }

    private void OnSaturationChanged(byte saturation)
    {
        Saturation = saturation;
        OnHSLChanged();
    }

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

    private void SetValue()
    {
        TValue? newValue;
        if (_baseType == typeof(string))
        {
            newValue = (TValue)(object)Color.Css;
        }
        else if (_baseType == typeof(Color))
        {
            newValue = (TValue)(object)Color.Color;
        }
        else
        {
            newValue = default;
        }

        if (!IsTouched
            && !EqualityComparer<TValue>.Default.Equals(newValue, InitialValue))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && !EqualityComparer<TValue>.Default.Equals(newValue, CurrentValue))
        {
            EvaluateDebounced();
        }

        CurrentValue = newValue;
        StateHasChanged();
    }

    private void UpdateColor()
    {
        var x = Math.Clamp(_selectorX / OverlayWidth, 0, 1);
        var y = Math.Clamp(1 - (_selectorY / OverlayHeight), 0, 1);

        var saturation = (int)Math.Round(100 * x);
        var lightness = (int)Math.Round(100 * y);
        Color = ShowAlpha && Alpha > 0
            ? ColorFormatConverter.FromHSLA(Hue, saturation, lightness, Alpha)
            : ColorFormatConverter.FromHSLA(Hue, saturation, lightness);
        Red = Color.Red;
        Green = Color.Green;
        Blue = Color.Blue;
        Hue = Color.Hue;
        Saturation = Color.Saturation;
        Lightness = Color.Lightness;
        Alpha = Color.AlphaFloat;
        HexColor = Color.HexCompact;

        SetValue();
    }
}