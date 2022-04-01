using Microsoft.AspNetCore.Components;
using System.Globalization;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A rich wrapper for the meter element.
/// </summary>
/// <typeparam name="TValue">
/// The numeric type used to specify the value.
/// </typeparam>
public partial class Meter<TValue>
{
    private readonly TValue _maxDefault, _maxType, _minDefault, _minType;

    private bool _optimumSet;

    /// <summary>
    /// A reference to the meter element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <summary>
    /// The lower bound of the high value range (from this value to <see cref="Max"/>).
    /// </summary>
    [Parameter] public TValue? High { get; set; }

    /// <summary>
    /// <para>
    /// The id of the meter element.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// A label which describes the meter.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// The upper bound of the low value range (from <see cref="Min"/> to this value).
    /// </summary>
    [Parameter] public TValue? Low { get; set; }

    /// <summary>
    /// Custom HTML attributes for the meter element.
    /// </summary>
    [Parameter] public Dictionary<string, object> MeterAttributes { get; set; } = new();

    /// <summary>
    /// Custom CSS class(es) for the meter element.
    /// </summary>
    [Parameter] public string? MeterClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the meter element.
    /// </summary>
    [Parameter] public string? MeterStyle { get; set; }

    /// <summary>
    /// <para>
    /// The maximum value.
    /// </para>
    /// <para>
    /// Defaults to 1 for floating-point types, and 100 for integral types.
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
    /// The optimal value. Indicates which range (<see cref="Min"/> to <see cref="Low"/>, <see
    /// cref="Low"/> to <see cref="High"/>, or <see cref="High"/> to <see cref="Max"/>) is
    /// considered ideal, which is considered sub-optimal (a range adjacent to the optimal range),
    /// and which poor (a range non-adjacent to the optimal range).
    /// </summary>
    [Parameter] public TValue? Optimum { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The content of the tooltip.
    /// </summary>
    [Parameter] public RenderFragment? TooltipContent { get; set; }

    /// <summary>
    /// <para>
    /// HTML to display as a tooltip.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TooltipContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public MarkupString? TooltipMarkup { get; set; }

    /// <summary>
    /// <para>
    /// The text to display as a tooltip.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TooltipMarkup"/> or <see cref="TooltipContent"/> is non-<see
    /// langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? TooltipText { get; set; }

    /// <summary>
    /// The current value of this meter.
    /// </summary>
    [Parameter] public TValue? Value { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component values and anything
    /// assigned by the user in <see cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("meter")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string? HighString
    {
        get
        {
            if (High is IFormattable formattable)
            {
                return formattable.ToString("F2", CultureInfo.InvariantCulture);
            }
            return High?.ToString();
        }
    }

    private string? LowString
    {
        get
        {
            if (Low is IFormattable formattable)
            {
                return formattable.ToString("F2", CultureInfo.InvariantCulture);
            }
            return Low?.ToString();
        }
    }

    private string? MaxString
    {
        get
        {
            if (Max is IFormattable formattable)
            {
                return formattable.ToString("F2", CultureInfo.InvariantCulture);
            }
            return Max?.ToString();
        }
    }

    private string? MinString
    {
        get
        {
            if (Min is IFormattable formattable)
            {
                return formattable.ToString("F2", CultureInfo.InvariantCulture);
            }
            return Min?.ToString();
        }
    }

    private string? OptimumString
    {
        get
        {
            if (_optimumSet)
            {
                if (Optimum is IFormattable formattable)
                {
                    return formattable.ToString("F2", CultureInfo.InvariantCulture);
                }
                return Optimum?.ToString();
            }
            return null;
        }
    }

    private string? TooltipTextValue => string.IsNullOrEmpty(TooltipText)
        ? ValueString
        : TooltipText;

    private string? ValueString
    {
        get
        {
            if (Value is IFormattable formattable)
            {
                return formattable.ToString("F2", CultureInfo.InvariantCulture);
            }
            return Value?.ToString();
        }
    }

    /// <summary>
    /// Constructs a new instance of <see cref="Meter{TValue}"/>.
    /// </summary>
    public Meter()
    {
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(byte))
        {
            _minDefault = (TValue)(object)(byte)0;
            _maxDefault = (TValue)(object)(byte)100;
            _minType = (TValue)(object)byte.MinValue;
            _maxType = (TValue)(object)byte.MaxValue;
        }
        else if (targetType == typeof(decimal))
        {
            _minDefault = (TValue)(object)0m;
            _maxDefault = (TValue)(object)1m;
            _minType = (TValue)(object)decimal.MinValue;
            _maxType = (TValue)(object)decimal.MaxValue;
        }
        else if (targetType == typeof(double))
        {
            _minDefault = (TValue)(object)0.0;
            _maxDefault = (TValue)(object)1.0;
            _minType = (TValue)(object)double.MinValue;
            _maxType = (TValue)(object)double.MaxValue;
        }
        else if (targetType == typeof(float))
        {
            _minDefault = (TValue)(object)0f;
            _maxDefault = (TValue)(object)1f;
            _minType = (TValue)(object)float.MinValue;
            _maxType = (TValue)(object)float.MaxValue;
        }
        else if (targetType == typeof(int))
        {
            _minDefault = (TValue)(object)0;
            _maxDefault = (TValue)(object)100;
            _minType = (TValue)(object)int.MinValue;
            _maxType = (TValue)(object)int.MaxValue;
        }
        else if (targetType == typeof(long))
        {
            _minDefault = (TValue)(object)0L;
            _maxDefault = (TValue)(object)100L;
            _minType = (TValue)(object)long.MinValue;
            _maxType = (TValue)(object)long.MaxValue;
        }
        else if (targetType == typeof(nint))
        {
            _minDefault = (TValue)(object)(nint)0;
            _maxDefault = (TValue)(object)(nint)100;
            _minType = (TValue)(object)nint.MinValue;
            _maxType = (TValue)(object)nint.MaxValue;
        }
        else if (targetType == typeof(nuint))
        {
            _minDefault = (TValue)(object)(nuint)0;
            _maxDefault = (TValue)(object)(nuint)100;
            _minType = (TValue)(object)nuint.MinValue;
            _maxType = (TValue)(object)nuint.MaxValue;
        }
        else if (targetType == typeof(sbyte))
        {
            _minDefault = (TValue)(object)(sbyte)0;
            _maxDefault = (TValue)(object)(sbyte)100;
            _minType = (TValue)(object)sbyte.MinValue;
            _maxType = (TValue)(object)sbyte.MaxValue;
        }
        else if (targetType == typeof(short))
        {
            _minDefault = (TValue)(object)(short)0;
            _maxDefault = (TValue)(object)(short)100;
            _minType = (TValue)(object)short.MinValue;
            _maxType = (TValue)(object)short.MaxValue;
        }
        else if (targetType == typeof(uint))
        {
            _minDefault = (TValue)(object)0U;
            _maxDefault = (TValue)(object)100U;
            _minType = (TValue)(object)uint.MinValue;
            _maxType = (TValue)(object)uint.MaxValue;
        }
        else if (targetType == typeof(ulong))
        {
            _minDefault = (TValue)(object)0UL;
            _maxDefault = (TValue)(object)100UL;
            _minType = (TValue)(object)ulong.MinValue;
            _maxType = (TValue)(object)ulong.MaxValue;
        }
        else if (targetType == typeof(ushort))
        {
            _minDefault = (TValue)(object)(ushort)0;
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
    public override Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue(nameof(Optimum), out TValue? optimum))
        {
            if (Nullable.GetUnderlyingType(typeof(TValue)) is not null)
            {
                _optimumSet = optimum is not null;
            }
            else
            {
                _optimumSet = true;
            }
        }
        return base.SetParametersAsync(parameters);
    }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (ValueIsMore(Max, _maxType))
        {
            Max = _maxType;
        }

        if (High is null
            || ValueIsMore(High, Max))
        {
            High = Max;
        }

        if (Low is null
            || ValueIsLess(Low, Min))
        {
            Low = Min;
        }

        if (Value is null)
        {
            Value = Min;
        }
        else if (ValueIsLess(Value, Min))
        {
            Value = Min;
        }
        else if (ValueIsMore(Value, Max))
        {
            Value = Max;
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
}