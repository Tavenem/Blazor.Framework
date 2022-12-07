using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A numeric input component
/// </summary>
/// <typeparam name="TValue">
/// The numeric type bound to the input value.
/// </typeparam>
public partial class NumericInput<TValue> : InputComponentBase<TValue>
{
    private readonly TValue _maxDefault, _minDefault, _one, _zero;
    private readonly AdjustableTimer _timer;

    private bool _disposedValue;
    private string? _newValue;

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
    /// The maximum number of characters which the input should show. Its minimum size will be set
    /// to allow this number of characters.
    /// </summary>
    [Parameter] public int? Size { get; set; }

    /// <summary>
    /// <para>
    /// The icon used for the decrement stepper.
    /// </para>
    /// <para>
    /// Default is <see cref="DefaultIcons.Down"/>.
    /// </para>
    /// </summary>
    [Parameter] public string StepDownIcon { get; set; } = DefaultIcons.Down;

    /// <summary>
    /// <para>
    /// The icon used for the increment stepper.
    /// </para>
    /// <para>
    /// Default is <see cref="DefaultIcons.Up"/>.
    /// </para>
    /// </summary>
    [Parameter] public string StepUpIcon { get; set; } = DefaultIcons.Up;

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
    /// The text displayed and edited in the input.
    /// </summary>
    protected string? DisplayString { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("number-field")
        .Add("show-steppers", ShowStepButtons && !ReadOnly)
        .ToString();

    /// <inheritdoc/>
    protected override string? InputCssClass => new CssBuilder(InputClass)
        .Add("input-core")
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
        && (FormExtensions.ValuesEqual(CurrentValue, Min)
        || FormExtensions.ValueIsLess(CurrentValue, Min)));

    private int EffectiveSize => Math.Max(1, Size ?? 1);

    private bool IncrementDisabled => Disabled
        || ReadOnly
        || (CurrentValue is not null
        && (FormExtensions.ValuesEqual(CurrentValue, Max)
        || FormExtensions.ValueIsMore(CurrentValue, Max)));

    private protected override bool ShrinkWhen => base.ShrinkWhen
        || PrefixContent is not null
        || !string.IsNullOrEmpty(PrefixIcon)
        || !string.IsNullOrEmpty(PrefixText);

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

    private protected TValue StepValue => Step is not null
        && !FormExtensions.ValuesEqual(Step, _zero)
        ? Step
        : _one;

    /// <summary>
    /// Constructs a new instance of <see cref="NumericInput{TValue}"/>.
    /// </summary>
    public NumericInput()
    {
        _timer = new(OnTimer, UpdateOnInputDebounce ?? 0);

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

        if (FormExtensions.ValueIsMore(Max, _maxDefault))
        {
            Max = _maxDefault;
        }

        if (FormExtensions.ValueIsLess(Min, _minDefault))
        {
            Min = _minDefault;
        }

        if (Step is not null
            && (FormExtensions.ValueIsLess(Step, _zero)
            || FormExtensions.ValuesEqual(Step, _zero)))
        {
            Step = default;
        }

        if (Value is not null)
        {
            if (FormExtensions.ValueIsLess(Value, Min))
            {
                CurrentValue = Min;
            }
            else if (FormExtensions.ValueIsMore(Value, Max))
            {
                CurrentValue = Max;
            }
        }

        if (string.IsNullOrEmpty(Format)
            && IsFloatingPointType
            && Step is not null
            && !FormExtensions.ValuesEqual(Step, _zero))
        {
            var stepLength = Step?
                .ToString()?
                .TrimStart('0')
                .TrimStart('.')
                .Length ?? 0;
            Format = $"F{stepLength}";
        }

        SetDisplay();
    }

    /// <summary>
    /// Clears the current input text.
    /// </summary>
    public void Clear()
    {
        _timer.Cancel();
        CurrentValueAsString = null;
    }

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
            && (FormExtensions.ValuesEqual(CurrentValue, Min)
            || FormExtensions.ValueIsLess(CurrentValue, Min)))
        {
            return;
        }

        try
        {
            var newValue = FormExtensions.SubtractValues(CurrentValue ?? _zero, StepValue);
            if (FormExtensions.ValueIsMore(newValue, Min))
            {
                SetValue(newValue);
            }
            else
            {
                SetValue(Min);
            }
        }
        catch (OverflowException)
        {
            SetValue(Min);
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
            && (FormExtensions.ValuesEqual(CurrentValue, Max)
            || FormExtensions.ValueIsMore(CurrentValue, Max)))
        {
            return;
        }
        try
        {
            var newValue = FormExtensions.AddValues(CurrentValue ?? _zero, StepValue);
            if (FormExtensions.ValueIsLess(newValue, Max))
            {
                SetValue(newValue);
            }
            else
            {
                SetValue(Max);
            }
        }
        catch (OverflowException)
        {
            SetValue(Max);
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
                _timer.Dispose();
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
        return base.FormatValueAsString(value);
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out TValue result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = default;
        validationErrorMessage = null;
        bool success;

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
            success = value.TryParseValue(Min, Max, out result, FormatProvider);
        }

        HasConversionError = !success;
        if (!success)
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

        return success;
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
            _timer.Change(UpdateOnInputDebounce.Value);
        }
        else
        {
            CurrentValueAsString = e.Value as string;
        }
    }

    private void OnChange(ChangeEventArgs e)
    {
        _timer.Cancel();
        CurrentValueAsString = e.Value as string;
        SetDisplay();
    }

    private void OnTimer()
    {
        CurrentValueAsString = _newValue;
        StateHasChanged();
    }

    private void SetDisplay() => DisplayString = Value switch
    {
        byte @byte => @byte.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        decimal @decimal => @decimal.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        double @double => @double.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        float @float => @float.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        int @int => @int.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        long @long => @long.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        nint @nint => @nint.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        nuint @nuint => @nuint.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        sbyte @sbyte => @sbyte.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        short @short => @short.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        uint @uint => @uint.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        ulong @ulong => @ulong.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        ushort @ushort => @ushort.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        IFormattable formattable => formattable.ToString(Format, FormatProvider ?? CultureInfo.InvariantCulture),
        _ => Value?.ToString(),
    };

    private void SetValue(TValue? value)
    {
        if (EqualityComparer<TValue>.Default.Equals(value, CurrentValue))
        {
            return;
        }

        CurrentValue = value;
        SetDisplay();
        HasConversionError = false;

        if (!IsNested)
        {
            EvaluateDebounced();
        }

        if (!IsTouched
            && !EqualityComparer<TValue>.Default.Equals(value, InitialValue))
        {
            SetTouchedDebounced();
        }
    }
}