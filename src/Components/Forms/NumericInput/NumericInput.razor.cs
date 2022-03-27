using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A numeric input component
/// </summary>
/// <typeparam name="TValue">
/// The numeric type bound to the input value.
/// </typeparam>
public partial class NumericInput<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue>
{
    private readonly TValue _maxDefault, _minDefault, _one, _zero;

    private bool _disposedValue;
    private string? _newValue;
    private Timer? _timer;

    /// <summary>
    /// <para>
    /// Whether the browser's built-in autocomplete feature should be enabled for this field.
    /// </para>
    /// <para>
    /// Default is <see langword="null"/>, which means that the browser will use the default
    /// behavior.
    /// </para>
    /// <para>
    /// Note: the value of this attribute is sometimes ignored by browsers.
    /// </para>
    /// </summary>
    [Parameter] public bool? Autocomplete { get; set; }

    /// <summary>
    /// <para>
    /// The validation message displayed when this field's <see cref="InputBase{TValue}.Value"/>
    /// cannot be converted to or from its string representation.
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
    /// <para>
    /// The maximum value.
    /// </para>
    /// <para>
    /// Defaults to the maximum for <typeparamref name="TValue"/>.
    /// </para>
    /// </summary>
    [Parameter] public TValue Max { get; set; }

    /// <summary>
    /// <para>
    /// The minimum value.
    /// </para>
    /// <para>
    /// Defaults to the minimum for <typeparamref name="TValue"/>.
    /// </para>
    /// </summary>
    [Parameter] public TValue Min { get; set; }

    /// <summary>
    /// Displayed after the input.
    /// </summary>
    [Parameter] public RenderFragment<TValue?>? PostfixContent { get; set; }

    /// <summary>
    /// <para>
    /// Displayed after the input.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PostfixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PostfixIcon { get; set; }

    /// <summary>
    /// <para>
    /// Displayed after the input, before any <see cref="PostfixIcon"/>.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PostfixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PostfixText { get; set; }

    /// <summary>
    /// Displayed before the input.
    /// </summary>
    [Parameter] public RenderFragment<TValue?>? PrefixContent { get; set; }

    /// <summary>
    /// <para>
    /// Displayed before the input.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PrefixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PrefixIcon { get; set; }

    /// <summary>
    /// <para>
    /// Displayed before the input, after any <see cref="PrefixIcon"/>.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PrefixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PrefixText { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show up and down buttons in the input.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool ShowStepButtons { get; set; } = true;

    /// <summary>
    /// <para>
    /// The icon used for the decrement stepper.
    /// </para>
    /// <para>
    /// Default is "keyboard_arrow_down".
    /// </para>
    /// </summary>
    [Parameter] public string StepDownIcon { get; set; } = "keyboard_arrow_down";

    /// <summary>
    /// <para>
    /// The icon used for the increment stepper.
    /// </para>
    /// <para>
    /// Default is "keyboard_arrow_up".
    /// </para>
    /// </summary>
    [Parameter] public string StepUpIcon { get; set; } = "keyboard_arrow_up";

    /// <summary>
    /// <para>
    /// The step value for this input.
    /// </para>
    /// <para>
    /// Assign <see langword="null"/> (the default) to use a step value of "1" for integral types,
    /// and a step value of "any" for floating-point types.
    /// </para>
    /// </summary>
    [Parameter]
    public TValue? Step { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("number-field")
        .Add("show-steppers", ShowStepButtons && !ReadOnly)
        .ToString();

    private static string InputMode => IsFloatingPointType ? "decimal" : "numeric";

    private static bool IsFloatingPointType => typeof(TValue) == typeof(decimal)
        || typeof(TValue) == typeof(decimal?)
        || typeof(TValue) == typeof(double)
        || typeof(TValue) == typeof(double?)
        || typeof(TValue) == typeof(float)
        || typeof(TValue) == typeof(float?);

    private string? AutocompleteValue
    {
        get
        {
            if (Autocomplete.HasValue)
            {
                return Autocomplete.Value ? "on" : "off";
            }
            return null;
        }
    }

    private bool DecrementDisabled => Disabled
        || ReadOnly
        || (CurrentValue is not null
        && (ValuesEqual(CurrentValue, Min)
        || ValueIsLess(CurrentValue, Min)));

    private bool IncrementDisabled => Disabled
        || ReadOnly
        || (CurrentValue is not null
        && (ValuesEqual(CurrentValue, Max)
        || ValueIsMore(CurrentValue, Max)));

    private protected override bool ShrinkWhen => base.ShrinkWhen
        || PrefixContent is not null
        || !string.IsNullOrEmpty(PrefixIcon)
        || !string.IsNullOrEmpty(PrefixText);

    private protected string? StepString
    {
        get
        {
            if (Step is not null
                && !ValuesEqual(Step, _zero))
            {
                return SuppressScientificFormat(Step);
            }

            return IsFloatingPointType
                ? "any"
                : "1";
        }
    }

    private protected TValue StepValue => Step is not null
        && !ValuesEqual(Step, _zero)
        ? Step
        : _one;

    /// <summary>
    /// Constructs a new instance of <see cref="NumericInput{TValue}"/>.
    /// </summary>
    public NumericInput()
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            _minDefault = (TValue)(object)byte.MinValue;
            _maxDefault = (TValue)(object)byte.MaxValue;
            _one = (TValue)(object)(byte)1;
            _zero = (TValue)(object)(byte)0;
        }
        else if (targetType == typeof(decimal))
        {
            _minDefault = (TValue)(object)decimal.MinValue;
            _maxDefault = (TValue)(object)decimal.MaxValue;
            _one = (TValue)(object)1m;
            _zero = (TValue)(object)0m;
        }
        else if (targetType == typeof(double))
        {
            _minDefault = (TValue)(object)double.NegativeInfinity;
            _maxDefault = (TValue)(object)double.PositiveInfinity;
            _one = (TValue)(object)1.0;
            _zero = (TValue)(object)0.0;
        }
        else if (targetType == typeof(float))
        {
            _minDefault = (TValue)(object)float.NegativeInfinity;
            _maxDefault = (TValue)(object)float.PositiveInfinity;
            _one = (TValue)(object)1f;
            _zero = (TValue)(object)0f;
        }
        else if (targetType == typeof(int))
        {
            _minDefault = (TValue)(object)int.MinValue;
            _maxDefault = (TValue)(object)int.MaxValue;
            _one = (TValue)(object)1;
            _zero = (TValue)(object)0;
        }
        else if (targetType == typeof(long))
        {
            _minDefault = (TValue)(object)long.MinValue;
            _maxDefault = (TValue)(object)long.MaxValue;
            _one = (TValue)(object)1L;
            _zero = (TValue)(object)0L;
        }
        else if (targetType == typeof(nint))
        {
            _minDefault = (TValue)(object)nint.MinValue;
            _maxDefault = (TValue)(object)nint.MaxValue;
            _one = (TValue)(object)(nint)1;
            _zero = (TValue)(object)(nint)0;
        }
        else if (targetType == typeof(nuint))
        {
            _minDefault = (TValue)(object)nuint.MinValue;
            _maxDefault = (TValue)(object)nuint.MaxValue;
            _one = (TValue)(object)(nuint)1;
            _zero = (TValue)(object)(nuint)0;
        }
        else if (targetType == typeof(sbyte))
        {
            _minDefault = (TValue)(object)sbyte.MinValue;
            _maxDefault = (TValue)(object)sbyte.MaxValue;
            _one = (TValue)(object)(sbyte)1;
            _zero = (TValue)(object)(sbyte)0;
        }
        else if (targetType == typeof(short))
        {
            _minDefault = (TValue)(object)short.MinValue;
            _maxDefault = (TValue)(object)short.MaxValue;
            _one = (TValue)(object)(short)1;
            _zero = (TValue)(object)(short)0;
        }
        else if (targetType == typeof(uint))
        {
            _minDefault = (TValue)(object)uint.MinValue;
            _maxDefault = (TValue)(object)uint.MaxValue;
            _one = (TValue)(object)1U;
            _zero = (TValue)(object)0U;
        }
        else if (targetType == typeof(ulong))
        {
            _minDefault = (TValue)(object)ulong.MinValue;
            _maxDefault = (TValue)(object)ulong.MaxValue;
            _one = (TValue)(object)1UL;
            _zero = (TValue)(object)0UL;
        }
        else if (targetType == typeof(ushort))
        {
            _minDefault = (TValue)(object)ushort.MinValue;
            _maxDefault = (TValue)(object)ushort.MaxValue;
            _one = (TValue)(object)(ushort)1;
            _zero = (TValue)(object)(ushort)0;
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

        if (ValueIsMore(Max, _maxDefault))
        {
            Max = _maxDefault;
        }

        if (ValueIsLess(Min, _minDefault))
        {
            Min = _minDefault;
        }

        if (Value is not null)
        {
            if (ValueIsLess(Value, Min))
            {
                CurrentValue = Min;
            }
            else if (ValueIsMore(Value, Max))
            {
                CurrentValue = Max;
            }
        }

        if (string.IsNullOrEmpty(Format)
            && IsFloatingPointType
            && Step is not null
            && !ValuesEqual(Step, _zero))
        {
            var stepLength = Step?
                .ToString()?
                .TrimStart('0')
                .TrimStart('.')
                .Length ?? 0;
            Format = $"F{stepLength}";
        }
    }

    /// <summary>
    /// Clears the current input text.
    /// </summary>
    public void Clear() => CurrentValueAsString = null;

    /// <summary>
    /// <para>
    /// Decrease the current value by the <see cref="Step"/> amount.
    /// </para>
    /// <para>
    /// If <see cref="Step"/> has not been defined, decreases by one.
    /// </para>
    /// </summary>
    /// <remarks>
    /// <para>
    /// If <typeparamref name="TValue"/> allows <see langword="null"/> values, and the current value
    /// is <see langword="null"/>, a starting value of zero is assumed.
    /// </para>
    /// <para>
    /// If the decrement operation would result in a value below <see cref="Min"/>, the value is set
    /// to <see cref="Min"/> instead.
    /// </para>
    /// </remarks>
    public void Decrement()
    {
        if (CurrentValue is not null
            && (ValuesEqual(CurrentValue, Min)
            || ValueIsLess(CurrentValue, Min)))
        {
            return;
        }

        try
        {
            var newValue = SubtractValues(CurrentValue ?? _zero, StepValue);
            if (ValueIsMore(newValue, Min))
            {
                CurrentValue = newValue;
            }
            else
            {
                CurrentValue = Min;
            }
        }
        catch (OverflowException)
        {
            CurrentValue = Min;
        }
    }

    /// <summary>
    /// Focuses this input.
    /// </summary>
    public async Task FocusAsync() => await ElementReference.FocusAsync();

    /// <summary>
    /// <para>
    /// Increase the current value by the <see cref="Step"/> amount.
    /// </para>
    /// <para>
    /// If <see cref="Step"/> has not been defined, increases by one.
    /// </para>
    /// </summary>
    /// <remarks>
    /// <para>
    /// If <typeparamref name="TValue"/> allows <see langword="null"/> values, and the current value
    /// is <see langword="null"/>, a starting value of zero is assumed.
    /// </para>
    /// <para>
    /// If the decrement operation would result in a value above <see cref="Max"/>, the value is set
    /// to <see cref="Max"/> instead.
    /// </para>
    /// </remarks>
    public void Increment()
    {
        if (CurrentValue is not null
            && (ValuesEqual(CurrentValue, Max)
            || ValueIsMore(CurrentValue, Max)))
        {
            return;
        }
        try
        {
            var newValue = AddValues(CurrentValue ?? _zero, StepValue);
            if (ValueIsLess(newValue, Max))
            {
                CurrentValue = newValue;
            }
            else
            {
                CurrentValue = Max;
            }
        }
        catch (OverflowException)
        {
            CurrentValue = Max;
        }
    }

    /// <summary>
    /// Selects all text in this input.
    /// </summary>
    public ValueTask SelectAsync() => ElementReference.SelectAsync();

    /// <summary>
    /// Selects a range of text in this input.
    /// </summary>
    /// <param name="start">The index of the first character to select.</param>
    /// <param name="end">
    /// <para>
    /// The exclusive index of the last index in the selection.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the entire remaining text will be selected.
    /// </para>
    /// </param>
    public ValueTask SelectRangeAsync(int start, int? end = null)
        => ElementReference.SelectRangeAsync(start, end);

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _timer?.Dispose();
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(TValue? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }

        return value switch
        {
            byte @byte => @byte.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            decimal @decimal => @decimal.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            double @double => @double.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            float @float => @float.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            int @int => @int.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            long @long => @long.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            sbyte @sbyte => @sbyte.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            short @short => @short.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            uint @uint => @uint.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            ulong @ulong => @ulong.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            ushort @ushort => @ushort.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            IFormattable formattable => formattable.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
            _ => value?.ToString(),
        };
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
        else if (string.IsNullOrEmpty(value))
        {
            success = true;
        }
        else
        {
            var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
            if (targetType == typeof(decimal))
            {
                if (decimal.TryParse(value, NumberStyles.Any, FormatProvider ?? CultureInfo.InvariantCulture, out var parsed))
                {
                    success = true;
                }
                else if (FormatProvider is not null
                    && decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out parsed))
                {
                    success = true;
                }
                if (success)
                {
                    result = (TValue)(object)parsed;
                    if (result is not null)
                    {
                        if (ValueIsLess(result, Min))
                        {
                            result = Min;
                        }
                        else if (ValueIsMore(result, Max))
                        {
                            result = Max;
                        }
                    }
                }
            }
            else if (targetType == typeof(double))
            {
                if (double.TryParse(value, NumberStyles.Any, FormatProvider ?? CultureInfo.InvariantCulture, out var parsed))
                {
                    result = (TValue)(object)parsed;
                    success = true;
                }
                else if (FormatProvider is not null
                    && double.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out parsed))
                {
                    result = (TValue)(object)parsed;
                    success = true;
                }
                if (success)
                {
                    result = (TValue)(object)parsed;
                    if (result is not null)
                    {
                        if (ValueIsLess(result, Min))
                        {
                            result = Min;
                        }
                        else if (ValueIsMore(result, Max))
                        {
                            result = Max;
                        }
                    }
                }
            }
            else if (targetType == typeof(float))
            {
                if (float.TryParse(value, NumberStyles.Any, FormatProvider ?? CultureInfo.InvariantCulture, out var parsed))
                {
                    result = (TValue)(object)parsed;
                    success = true;
                }
                else if (FormatProvider is not null
                    && float.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out parsed))
                {
                    result = (TValue)(object)parsed;
                    success = true;
                }
                if (success)
                {
                    result = (TValue)(object)parsed;
                    if (result is not null)
                    {
                        if (ValueIsLess(result, Min))
                        {
                            result = Min;
                        }
                        else if (ValueIsMore(result, Max))
                        {
                            result = Max;
                        }
                    }
                }
            }
            else
            {
                if (long.TryParse(value, NumberStyles.Currency, FormatProvider ?? CultureInfo.InvariantCulture, out var parsed))
                {
                    success = true;
                }
                else if (FormatProvider is not null
                    && long.TryParse(value, NumberStyles.Currency, CultureInfo.InvariantCulture, out parsed))
                {
                    success = true;
                }
                if (success)
                {
                    if (ValueIsLess(parsed, Min))
                    {
                        result = Min;
                    }
                    else if (ValueIsMore(parsed, Max))
                    {
                        result = Max;
                    }
                    else
                    {
                        result = (TValue)Convert.ChangeType(parsed, targetType);
                    }
                }
                else
                {
                    if (ulong.TryParse(value, NumberStyles.Currency, FormatProvider ?? CultureInfo.InvariantCulture, out var unsignedParsed))
                    {
                        success = true;
                    }
                    else if (FormatProvider is not null
                        && ulong.TryParse(value, NumberStyles.Currency, CultureInfo.InvariantCulture, out unsignedParsed))
                    {
                        success = true;
                    }
                    if (success)
                    {
                        if (ValueIsLess(unsignedParsed, Min))
                        {
                            result = Min;
                        }
                        else if (ValueIsMore(unsignedParsed, Max))
                        {
                            result = Max;
                        }
                        else
                        {
                            result = (TValue)Convert.ChangeType(unsignedParsed, targetType);
                        }
                    }
                }
            }
        }

        HasConversionError = !success;
        if (!success)
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

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

    private static TValue AddValues(TValue first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return (TValue)(object)(byte)((byte)(object)first! + (byte)(object)second!);
        }
        else if (targetType == typeof(decimal))
        {
            return (TValue)(object)((decimal)(object)first! + (decimal)(object)second!);
        }
        else if (targetType == typeof(double))
        {
            return (TValue)(object)((double)(object)first! + (double)(object)second!);
        }
        else if (targetType == typeof(float))
        {
            return (TValue)(object)((float)(object)first! + (float)(object)second!);
        }
        else if (targetType == typeof(int))
        {
            return (TValue)(object)((int)(object)first! + (int)(object)second!);
        }
        else if (targetType == typeof(long))
        {
            return (TValue)(object)((long)(object)first! + (long)(object)second!);
        }
        else if (targetType == typeof(nint))
        {
            return (TValue)(object)((nint)(object)first! + (nint)(object)second!);
        }
        else if (targetType == typeof(nuint))
        {
            return (TValue)(object)((nuint)(object)first! + (nuint)(object)second!);
        }
        else if (targetType == typeof(sbyte))
        {
            return (TValue)(object)(sbyte)((sbyte)(object)first! + (sbyte)(object)second!);
        }
        else if (targetType == typeof(short))
        {
            return (TValue)(object)(short)((short)(object)first! + (short)(object)second!);
        }
        else if (targetType == typeof(uint))
        {
            return (TValue)(object)((uint)(object)first! + (uint)(object)second!);
        }
        else if (targetType == typeof(ulong))
        {
            return (TValue)(object)((ulong)(object)first! + (ulong)(object)second!);
        }
        else if (targetType == typeof(ushort))
        {
            return (TValue)(object)(ushort)((ushort)(object)first! + (ushort)(object)second!);
        }
        else
        {
            return default!;
        }
    }

    private static TValue SubtractValues(TValue first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return (TValue)(object)(byte)((byte)(object)first! - (byte)(object)second!);
        }
        else if (targetType == typeof(decimal))
        {
            return (TValue)(object)((decimal)(object)first! - (decimal)(object)second!);
        }
        else if (targetType == typeof(double))
        {
            return (TValue)(object)((double)(object)first! - (double)(object)second!);
        }
        else if (targetType == typeof(float))
        {
            return (TValue)(object)((float)(object)first! - (float)(object)second!);
        }
        else if (targetType == typeof(int))
        {
            return (TValue)(object)((int)(object)first! - (int)(object)second!);
        }
        else if (targetType == typeof(long))
        {
            return (TValue)(object)((long)(object)first! - (long)(object)second!);
        }
        else if (targetType == typeof(sbyte))
        {
            return (TValue)(object)(sbyte)((sbyte)(object)first! - (sbyte)(object)second!);
        }
        else if (targetType == typeof(short))
        {
            return (TValue)(object)(short)((short)(object)first! - (short)(object)second!);
        }
        else if (targetType == typeof(uint))
        {
            return (TValue)(object)((uint)(object)first! - (uint)(object)second!);
        }
        else if (targetType == typeof(ulong))
        {
            return (TValue)(object)((ulong)(object)first! - (ulong)(object)second!);
        }
        else if (targetType == typeof(ushort))
        {
            return (TValue)(object)(ushort)((ushort)(object)first! - (ushort)(object)second!);
        }
        else
        {
            return default!;
        }
    }

    /// <summary>
    /// Format for min, max, and step which prevents representing large or small floating point
    /// values in scientific notation.
    /// </summary>
    private static string? SuppressScientificFormat(TValue? value) => (value as IFormattable)?.ToString(
        "0.###################################################################################################################################################################################################################################################################################################################################################",
        CultureInfo.InvariantCulture.NumberFormat);

    private static bool ValuesEqual(TValue first, TValue second)
    {
        if (first is null)
        {
            return second is null;
        }
        else if (second is null)
        {
            return false;
        }

        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return (byte)(object)first == (byte)(object)second;
        }
        else if (targetType == typeof(decimal))
        {
            return (decimal)(object)first == (decimal)(object)second;
        }
        else if (targetType == typeof(double))
        {
            return (double)(object)first == (double)(object)second;
        }
        else if (targetType == typeof(float))
        {
            return (float)(object)first == (float)(object)second;
        }
        else if (targetType == typeof(int))
        {
            return (int)(object)first == (int)(object)second;
        }
        else if (targetType == typeof(long))
        {
            return (long)(object)first == (long)(object)second;
        }
        else if (targetType == typeof(nint))
        {
            return (nint)(object)first == (nint)(object)second;
        }
        else if (targetType == typeof(nuint))
        {
            return (nuint)(object)first == (nuint)(object)second;
        }
        else if (targetType == typeof(sbyte))
        {
            return (sbyte)(object)first == (sbyte)(object)second;
        }
        else if (targetType == typeof(short))
        {
            return (short)(object)first == (short)(object)second;
        }
        else if (targetType == typeof(uint))
        {
            return (uint)(object)first == (uint)(object)second;
        }
        else if (targetType == typeof(ulong))
        {
            return (ulong)(object)first == (ulong)(object)second;
        }
        else if (targetType == typeof(ushort))
        {
            return (ushort)(object)first == (ushort)(object)second;
        }
        else if (first is IEquatable<TValue> equatable)
        {
            return equatable.Equals(second);
        }
        else
        {
            return Equals(first, second);
        }
    }

    private static bool ValueIsLess(TValue first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return (byte)(object)first! < (byte)(object)second!;
        }
        else if (targetType == typeof(decimal))
        {
            return (decimal)(object)first! < (decimal)(object)second!;
        }
        else if (targetType == typeof(double))
        {
            return (double)(object)first! < (double)(object)second!;
        }
        else if (targetType == typeof(float))
        {
            return (float)(object)first! < (float)(object)second!;
        }
        else if (targetType == typeof(int))
        {
            return (int)(object)first! < (int)(object)second!;
        }
        else if (targetType == typeof(long))
        {
            return (long)(object)first! < (long)(object)second!;
        }
        else if (targetType == typeof(nint))
        {
            return (nint)(object)first! < (nint)(object)second!;
        }
        else if (targetType == typeof(nuint))
        {
            return (nuint)(object)first! < (nuint)(object)second!;
        }
        else if (targetType == typeof(sbyte))
        {
            return (sbyte)(object)first! < (sbyte)(object)second!;
        }
        else if (targetType == typeof(short))
        {
            return (short)(object)first! < (short)(object)second!;
        }
        else if (targetType == typeof(uint))
        {
            return (uint)(object)first! < (uint)(object)second!;
        }
        else if (targetType == typeof(ulong))
        {
            return (ulong)(object)first! < (ulong)(object)second!;
        }
        else if (targetType == typeof(ushort))
        {
            return (ushort)(object)first! < (ushort)(object)second!;
        }
        else
        {
            return default!;
        }
    }

    private static bool ValueIsLess(long first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return first < (byte)(object)second!;
        }
        else if (targetType == typeof(decimal))
        {
            return first < (decimal)(object)second!;
        }
        else if (targetType == typeof(double))
        {
            return first < (double)(object)second!;
        }
        else if (targetType == typeof(float))
        {
            return first < (float)(object)second!;
        }
        else if (targetType == typeof(int))
        {
            return first < (int)(object)second!;
        }
        else if (targetType == typeof(long))
        {
            return first < (long)(object)second!;
        }
        else if (targetType == typeof(nint))
        {
            return first < (nint)(object)second!;
        }
        else if (targetType == typeof(nuint))
        {
            if (first < 0)
            {
                return true;
            }
            return (nuint)(object)second! > long.MaxValue
                || first < (long)(object)second!;
        }
        else if (targetType == typeof(sbyte))
        {
            return first < (sbyte)(object)second!;
        }
        else if (targetType == typeof(short))
        {
            return first < (short)(object)second!;
        }
        else if (targetType == typeof(uint))
        {
            return first < (uint)(object)second!;
        }
        else if (targetType == typeof(ulong))
        {
            if (first < 0)
            {
                return true;
            }
            return (ulong)(object)second! > long.MaxValue
                || first < (long)(object)second!;
        }
        else if (targetType == typeof(ushort))
        {
            return first < (ushort)(object)second!;
        }
        else
        {
            return default!;
        }
    }

    private static bool ValueIsLess(ulong first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return first < (byte)(object)second!;
        }
        else if (targetType == typeof(decimal))
        {
            return first < (decimal)(object)second!;
        }
        else if (targetType == typeof(double))
        {
            return first < (double)(object)second!;
        }
        else if (targetType == typeof(float))
        {
            return first < (float)(object)second!;
        }
        else if (targetType == typeof(int))
        {
            return (int)(object)second! >= 0
                && first < (uint)(object)second!;
        }
        else if (targetType == typeof(long))
        {
            return (long)(object)second! >= 0
                && first < (ulong)(object)second!;
        }
        else if (targetType == typeof(nint))
        {
            return (long)(object)second! >= 0
                && first < (nuint)(object)second!;
        }
        else if (targetType == typeof(nuint))
        {
            return first < (nuint)(object)second!;
        }
        else if (targetType == typeof(sbyte))
        {
            return (sbyte)(object)second! >= 0
                && first < (uint)(object)second!;
        }
        else if (targetType == typeof(short))
        {
            var s = (short)(object)second!;
            return s >= 0
                && first < (uint)(object)second!;
        }
        else if (targetType == typeof(uint))
        {
            return first < (uint)(object)second!;
        }
        else if (targetType == typeof(ulong))
        {
            return first < (ulong)(object)second!;
        }
        else if (targetType == typeof(ushort))
        {
            return first < (ushort)(object)second!;
        }
        else
        {
            return default!;
        }
    }

    private static bool ValueIsMore(TValue first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return (byte)(object)first! > (byte)(object)second!;
        }
        else if (targetType == typeof(decimal))
        {
            return (decimal)(object)first! > (decimal)(object)second!;
        }
        else if (targetType == typeof(double))
        {
            return (double)(object)first! > (double)(object)second!;
        }
        else if (targetType == typeof(float))
        {
            return (float)(object)first! > (float)(object)second!;
        }
        else if (targetType == typeof(int))
        {
            return (int)(object)first! > (int)(object)second!;
        }
        else if (targetType == typeof(long))
        {
            return (long)(object)first! > (long)(object)second!;
        }
        else if (targetType == typeof(nint))
        {
            return (nint)(object)first! > (nint)(object)second!;
        }
        else if (targetType == typeof(nuint))
        {
            return (nuint)(object)first! > (nuint)(object)second!;
        }
        else if (targetType == typeof(sbyte))
        {
            return (sbyte)(object)first! > (sbyte)(object)second!;
        }
        else if (targetType == typeof(short))
        {
            return (short)(object)first! > (short)(object)second!;
        }
        else if (targetType == typeof(uint))
        {
            return (uint)(object)first! > (uint)(object)second!;
        }
        else if (targetType == typeof(ulong))
        {
            return (ulong)(object)first! > (ulong)(object)second!;
        }
        else if (targetType == typeof(ushort))
        {
            return (ushort)(object)first! > (ushort)(object)second!;
        }
        else
        {
            return default!;
        }
    }

    private static bool ValueIsMore(long first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return first > (byte)(object)second!;
        }
        else if (targetType == typeof(decimal))
        {
            return first > (decimal)(object)second!;
        }
        else if (targetType == typeof(double))
        {
            return first > (double)(object)second!;
        }
        else if (targetType == typeof(float))
        {
            return first > (float)(object)second!;
        }
        else if (targetType == typeof(int))
        {
            return first > (int)(object)second!;
        }
        else if (targetType == typeof(long))
        {
            return first > (long)(object)second!;
        }
        else if (targetType == typeof(nint))
        {
            return first > (nint)(object)second!;
        }
        else if (targetType == typeof(nuint))
        {
            if (first < 0)
            {
                return false;
            }
            return (ulong)first > (nuint)(object)second!;
        }
        else if (targetType == typeof(sbyte))
        {
            return first > (sbyte)(object)second!;
        }
        else if (targetType == typeof(short))
        {
            return first > (short)(object)second!;
        }
        else if (targetType == typeof(uint))
        {
            return first > (uint)(object)second!;
        }
        else if (targetType == typeof(ulong))
        {
            if (first < 0)
            {
                return false;
            }
            return (ulong)first > (ulong)(object)second!;
        }
        else if (targetType == typeof(ushort))
        {
            return first > (ushort)(object)second!;
        }
        else
        {
            return default!;
        }
    }

    private static bool ValueIsMore(ulong first, TValue second)
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            return first > (byte)(object)second!;
        }
        else if (targetType == typeof(decimal))
        {
            return first > (decimal)(object)second!;
        }
        else if (targetType == typeof(double))
        {
            return first > (double)(object)second!;
        }
        else if (targetType == typeof(float))
        {
            return first > (float)(object)second!;
        }
        else if (targetType == typeof(int))
        {
            return (int)(object)second! < 0
                || first > (uint)(object)second!;
        }
        else if (targetType == typeof(long))
        {
            return (long)(object)second! < 0
                || first > (ulong)(object)second!;
        }
        else if (targetType == typeof(nint))
        {
            return (nint)(object)second! < 0
                || first > (nuint)(object)second!;
        }
        else if (targetType == typeof(nuint))
        {
            return first > (nuint)(object)second!;
        }
        else if (targetType == typeof(sbyte))
        {
            return (sbyte)(object)second! < 0
                || first > (byte)(object)second!;
        }
        else if (targetType == typeof(short))
        {
            return (short)(object)second! < 0
                || first > (uint)(object)second!;
        }
        else if (targetType == typeof(uint))
        {
            return first > (uint)(object)second!;
        }
        else if (targetType == typeof(ulong))
        {
            return first > (ulong)(object)second!;
        }
        else if (targetType == typeof(ushort))
        {
            return first > (ushort)(object)second!;
        }
        else
        {
            return default!;
        }
    }

    private void OnInput(ChangeEventArgs e)
    {
        if (!UpdateOnInput
            || string.Equals(CurrentValueAsString, e.Value as string))
        {
            return;
        }

        if (UpdateOnInputDebounce > 0)
        {
            _newValue = e.Value as string;
            if (_timer is null)
            {
                _timer = new Timer(OnTimer, null, UpdateOnInputDebounce.Value, Timeout.Infinite);
            }
            else
            {
                _timer.Change(UpdateOnInputDebounce.Value, Timeout.Infinite);
            }
        }
        else
        {
            CurrentValueAsString = e.Value as string;
        }
    }

    private async Task OnChangeAsync(ChangeEventArgs e)
    {
        _timer?.Change(Timeout.Infinite, Timeout.Infinite);

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

    private void OnTimer(object? state)
    {
        CurrentValueAsString = _newValue;
        StateHasChanged();
    }
}