using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A range input component.
/// </summary>
/// <typeparam name="TValue">
/// The numeric type bound to the input value.
/// </typeparam>
/// <remarks>
/// Constructs a new instance of <see cref="Slider{TValue}"/>.
/// </remarks>
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ValueChangeEventArgs))]
public partial class Slider<TValue>() : FormComponentBase<TValue>
{
    private static readonly TValue _maxDefault, _maxType, _minDefault, _minType, _zero;
    private static readonly bool _isFloatingPoint;

    private int _tickCount;

    /// <summary>
    /// <para>
    /// The validation message displayed when this field's <see
    /// cref="InputBase{TValue}.Value"/> cannot be converted to or from its string
    /// representation.
    /// </para>
    /// <para>
    /// Default is "{DisplayName} must be a number".
    /// </para>
    /// </summary>
    [Parameter] public override string ConversionValidationMessage { get; set; } = "{0} must be a number";

    /// <summary>
    /// An optional list of labels for hash marks.
    /// </summary>
    [Parameter] public List<string?>? HashLabels { get; set; }

    /// <summary>
    /// <para>
    /// The maximum value.
    /// </para>
    /// <para>
    /// Defaults to 100.
    /// </para>
    /// </summary>
    [Parameter] public TValue Max { get; set; } = _maxDefault;

    /// <summary>
    /// <para>
    /// The minimum value.
    /// </para>
    /// <para>
    /// Defaults to zero.
    /// </para>
    /// </summary>
    [Parameter] public TValue Min { get; set; } = _minDefault;

    /// <summary>
    /// <para>
    /// The step value for this input.
    /// </para>
    /// <para>
    /// Assign <see langword="null"/> (the default) to use a step value of "any" for floating point
    /// types, or "1" for integral types.
    /// </para>
    /// </summary>
    [Parameter] public TValue? Step { get; set; }

    /// <summary>
    /// This can be set to a number of milliseconds that the component will wait before updating the
    /// bound <see cref="InputBase{TValue}.Value"/>.
    /// </summary>
    [Parameter] public int? UpdateOnInputDebounce { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("hash-labels", HashLabels?.Count > 0)
        .ToString();

    private double MaxDouble { get; set; }

    private string MaxString => FormExtensions.SuppressScientificFormat(MaxDouble);

    private double MinDouble { get; set; }

    private string MinString => FormExtensions.SuppressScientificFormat(MinDouble);

    private protected string? StepString
    {
        get
        {
            if (Step is not null
                && !FormExtensions.ValuesEqual(Step, _zero))
            {
                return FormExtensions.SuppressScientificFormat(Step);
            }

            return _isFloatingPoint ? "any" : "1";
        }
    }

    static Slider()
    {
        _isFloatingPoint = typeof(TValue) == typeof(decimal)
            || typeof(TValue) == typeof(decimal?)
            || typeof(TValue) == typeof(double)
            || typeof(TValue) == typeof(double?)
            || typeof(TValue) == typeof(float)
            || typeof(TValue) == typeof(float?);

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

        MaxDouble = Convert.ToDouble(Max);
        MinDouble = Convert.ToDouble(Min);
        var step = Step is null ? 1 : Convert.ToDouble(Step);
        _tickCount = 1 + (int)((MaxDouble - MinDouble) / step);
        while (_tickCount > 20)
        {
            _tickCount /= 2;
        }
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
        if (!success)
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

        return success;
    }

    private void OnChange(ValueChangeEventArgs e)
    {
        if (!string.Equals(CurrentValueAsString, e.Value, StringComparison.Ordinal))
        {
            CurrentValueAsString = e.Value;
        }
    }
}