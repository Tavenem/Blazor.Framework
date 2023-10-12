using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A range input component.
/// </summary>
/// <typeparam name="TValue">
/// The numeric type bound to the input value.
/// </typeparam>
public partial class Slider<TValue>
{
    private readonly TValue _maxDefault, _maxType, _minDefault, _minType, _zero;
    private readonly AdjustableTimer _timer;

    private bool _disposedValue;
    private int _tickCount;

    /// <summary>
    /// Whether this input should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

    /// <summary>
    /// Whether the input is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// <para>
    /// The validation message displayed when this field's <see
    /// cref="FormComponentBase{TValue}.Value"/> cannot be converted to or from its string
    /// representation.
    /// </para>
    /// <para>
    /// Default is "{DisplayName} must be a number".
    /// </para>
    /// </summary>
    [Parameter] public override string ConversionValidationMessage { get; set; } = "{0} must be a number";

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <summary>
    /// An optional list of labels for hash marks.
    /// </summary>
    [Parameter] public List<string?>? HashLabels { get; set; }

    /// <summary>
    /// <para>
    /// The id of the input element.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// Custom HTML attributes for the input element.
    /// </summary>
    [Parameter] public Dictionary<string, object> InputAttributes { get; set; } = [];

    /// <summary>
    /// Custom CSS class(es) for the input element.
    /// </summary>
    [Parameter] public string? InputClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the input element.
    /// </summary>
    [Parameter] public string? InputStyle { get; set; }

    /// <summary>
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// <para>
    /// The maximum value.
    /// </para>
    /// <para>
    /// Defaults to 100.
    /// </para>
    /// </summary>
    [Parameter] public TValue Max { get; set; }

    /// <summary>
    /// <para>
    /// The minimum value.
    /// </para>
    /// <para>
    /// Defaults to zero.
    /// </para>
    /// </summary>
    [Parameter] public TValue Min { get; set; }

    /// <summary>
    /// Whether the input is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// <para>
    /// The step value for this input.
    /// </para>
    /// <para>
    /// Assign <see langword="null"/> (the default) to use a step value of "1" for integral types,
    /// and a step value of "any" for floating-point types.
    /// </para>
    /// </summary>
    [Parameter] public TValue? Step { get; set; }

    /// <summary>
    /// The tabindex of the input element.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// Whether the bound <see cref="FormComponentBase{TValue}.Value"/> should update whenever the
    /// value changes (rather than on blur or when the enter key is pressed).
    /// </summary>
    [Parameter] public bool UpdateOnInput { get; set; }

    /// <summary>
    /// <para>
    /// When <see cref="UpdateOnInput"/> is true, this can be set to a number of milliseconds that
    /// the component will wait before updating the bound <see
    /// cref="FormComponentBase{TValue}.Value"/>.
    /// </para>
    /// <para>
    /// Even when a debounce is used, the component will always update immediately on blur and when
    /// the enter key is pressed.
    /// </para>
    /// </summary>
    [Parameter] public int? UpdateOnInputDebounce { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("slider")
        .Add(ThemeColor.ToCSS())
        .Add("disabled", IsDisabled)
        .Add("read-only", IsReadOnly)
        .Add("required", Required)
        .ToString();

    private static bool IsFloatingPointType => typeof(TValue) == typeof(decimal)
        || typeof(TValue) == typeof(decimal?)
        || typeof(TValue) == typeof(double)
        || typeof(TValue) == typeof(double?)
        || typeof(TValue) == typeof(float)
        || typeof(TValue) == typeof(float?);

    private double BarWidth { get; set; }

    private string? InputValue { get; set; }

    /// <summary>
    /// Whether the control is being rendered interactively.
    /// </summary>
    private bool Interactive { get; set; }

    /// <summary>
    /// Whether this control is currently disabled.
    /// </summary>
    /// <remarks>
    /// Returns <see langword="true"/> if <see cref="Disabled"/> is <see langword="true"/> or <see
    /// cref="Interactive"/> is <see langword="false"/>.
    /// </remarks>
    private bool IsDisabled => Disabled || !Interactive;

    /// <summary>
    /// Whether this control is currently read-only.
    /// </summary>
    /// <remarks>
    /// Returns <see langword="true"/> if <see cref="ReadOnly"/> is <see langword="true"/> or <see
    /// cref="Interactive"/> is <see langword="false"/>.
    /// </remarks>
    private bool IsReadOnly => ReadOnly || !Interactive;

    private double MaxDouble { get; set; }

    private double MinDouble { get; set; }

    private protected string? StepString
    {
        get
        {
            if (Step is not null
                && !FormExtensions.ValuesEqual(Step, _zero))
            {
                return FormExtensions.SuppressScientificFormat(Step);
            }

            return IsFloatingPointType
                ? "any"
                : "1";
        }
    }

    /// <summary>
    /// Constructs a new instance of <see cref="Slider{TValue}"/>.
    /// </summary>
    public Slider()
    {
        _timer = new(OnTimer, UpdateOnInputDebounce ?? 0);

        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            _zero = (TValue)(object)(byte)0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)(byte)100;
            _minType = (TValue)(object)byte.MinValue;
            _maxType = (TValue)(object)byte.MaxValue;
        }
        else if (targetType == typeof(decimal))
        {
            _zero = (TValue)(object)0m;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)100m;
            _minType = (TValue)(object)decimal.MinValue;
            _maxType = (TValue)(object)decimal.MaxValue;
        }
        else if (targetType == typeof(double))
        {
            _zero = (TValue)(object)0.0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)100.0;
            _minType = (TValue)(object)double.MinValue;
            _maxType = (TValue)(object)double.MaxValue;
        }
        else if (targetType == typeof(float))
        {
            _zero = (TValue)(object)0f;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)100f;
            _minType = (TValue)(object)float.MinValue;
            _maxType = (TValue)(object)float.MaxValue;
        }
        else if (targetType == typeof(int))
        {
            _zero = (TValue)(object)0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)100;
            _minType = (TValue)(object)int.MinValue;
            _maxType = (TValue)(object)int.MaxValue;
        }
        else if (targetType == typeof(long))
        {
            _zero = (TValue)(object)0L;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)100L;
            _minType = (TValue)(object)long.MinValue;
            _maxType = (TValue)(object)long.MaxValue;
        }
        else if (targetType == typeof(nint))
        {
            _zero = (TValue)(object)(nint)0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)(nint)100;
            _minType = (TValue)(object)nint.MinValue;
            _maxType = (TValue)(object)nint.MaxValue;
        }
        else if (targetType == typeof(nuint))
        {
            _zero = (TValue)(object)(nuint)0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)(nuint)100;
            _minType = (TValue)(object)nuint.MinValue;
            _maxType = (TValue)(object)nuint.MaxValue;
        }
        else if (targetType == typeof(sbyte))
        {
            _zero = (TValue)(object)(sbyte)0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)(sbyte)100;
            _minType = (TValue)(object)sbyte.MinValue;
            _maxType = (TValue)(object)sbyte.MaxValue;
        }
        else if (targetType == typeof(short))
        {
            _zero = (TValue)(object)(short)0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)(short)100;
            _minType = (TValue)(object)short.MinValue;
            _maxType = (TValue)(object)short.MaxValue;
        }
        else if (targetType == typeof(uint))
        {
            _zero = (TValue)(object)0U;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)100U;
            _minType = (TValue)(object)uint.MinValue;
            _maxType = (TValue)(object)uint.MaxValue;
        }
        else if (targetType == typeof(ulong))
        {
            _zero = (TValue)(object)0UL;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)100UL;
            _minType = (TValue)(object)ulong.MinValue;
            _maxType = (TValue)(object)ulong.MaxValue;
        }
        else if (targetType == typeof(ushort))
        {
            _zero = (TValue)(object)(ushort)0;
            _minDefault = _zero;
            _maxDefault = (TValue)(object)(ushort)100;
            _minType = (TValue)(object)ushort.MinValue;
            _maxType = (TValue)(object)ushort.MaxValue;
        }
        else
        {
            throw new InvalidOperationException($"Type {targetType.Name} is not supported");
        }

        Max = _maxDefault!;
        Min = _minDefault!;
    }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (FormExtensions.ValueIsMore(Max, _maxType))
        {
            Max = _maxType;
        }

        if (FormExtensions.ValueIsLess(Min, _minType))
        {
            Min = _minType;
        }

        if (Step is not null
            && (FormExtensions.ValueIsLess(Step, _zero)
            || FormExtensions.ValuesEqual(Step, _zero)))
        {
            Step = default;
        }

        if (Value is null)
        {
            Value = Min;
        }
        else if (FormExtensions.ValueIsLess(Value, Min))
        {
            CurrentValue = Min;
        }
        else if (FormExtensions.ValueIsMore(Value, Max))
        {
            CurrentValue = Max;
        }

        InputValue = CurrentValueAsString;

        MaxDouble = Convert.ToDouble(Max);
        MinDouble = Convert.ToDouble(Min);
        var step = Step is null ? 1 : Convert.ToDouble(Step);
        _tickCount = 1 + (int)((MaxDouble - MinDouble) / step);

        BarWidth = Math.Clamp(100.0 * (Convert.ToDouble(Value) - MinDouble) / (MaxDouble - MinDouble), 0, 100);
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Interactive = true;
            StateHasChanged();
        }
    }

    /// <summary>
    /// Focuses this input.
    /// </summary>
    public async Task FocusAsync() => await ElementReference.FocusAsync();

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _timer.Dispose();
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(TValue? value) => value switch
    {
        byte @byte => @byte.ToString(null, CultureInfo.InvariantCulture),
        decimal @decimal => @decimal.ToString(null, CultureInfo.InvariantCulture),
        double @double => @double.ToString(null, CultureInfo.InvariantCulture),
        float @float => @float.ToString(null, CultureInfo.InvariantCulture),
        int @int => @int.ToString(null, CultureInfo.InvariantCulture),
        long @long => @long.ToString(null, CultureInfo.InvariantCulture),
        nint @nint => @nint.ToString(null, CultureInfo.InvariantCulture),
        nuint @nuint => @nuint.ToString(null, CultureInfo.InvariantCulture),
        sbyte @sbyte => @sbyte.ToString(null, CultureInfo.InvariantCulture),
        short @short => @short.ToString(null, CultureInfo.InvariantCulture),
        uint @uint => @uint.ToString(null, CultureInfo.InvariantCulture),
        ulong @ulong => @ulong.ToString(null, CultureInfo.InvariantCulture),
        ushort @ushort => @ushort.ToString(null, CultureInfo.InvariantCulture),
        _ => value?.ToString(),
    };

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out TValue result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        validationErrorMessage = null;
        var success = value.TryParseValue(Min, Max, out result);

        HasConversionError = !success;
        if (success)
        {
            BarWidth = Math.Clamp(100.0 * (Convert.ToDouble(result) - MinDouble) / (MaxDouble - MinDouble), 0, 100);
        }
        else
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

        return success;
    }

    private void OnInput(ChangeEventArgs e)
    {
        InputValue = e.Value as string;
        if (string.Equals(CurrentValueAsString, InputValue))
        {
            return;
        }

        if (!UpdateOnInput)
        {
            if (InputValue.TryParseValue(Min, Max, out var result))
            {
                BarWidth = Math.Clamp(100.0 * (Convert.ToDouble(result) - MinDouble) / (MaxDouble - MinDouble), 0, 100);
            }

            return;
        }

        if (UpdateOnInputDebounce > 0)
        {
            if (InputValue.TryParseValue(Min, Max, out var result))
            {
                BarWidth = Math.Clamp(100.0 * (Convert.ToDouble(result) - MinDouble) / (MaxDouble - MinDouble), 0, 100);
            }

            _timer.Change(UpdateOnInputDebounce.Value);
        }
        else
        {
            CurrentValueAsString = InputValue;
        }
    }

    private async Task OnChangeAsync(ChangeEventArgs e)
    {
        _timer.Cancel();

        var str = e.Value as string;
        CurrentValueAsString = str;
        if (CurrentValueAsString != str)
        {
            var x = CurrentValueAsString;
            CurrentValueAsString = Equals(Value, _zero)
                ? "1"
                : "0";
            await Task.Delay(1);

            CurrentValueAsString = x;
        }
    }

    private void OnTimer()
    {
        CurrentValueAsString = InputValue;
        StateHasChanged();
    }
}