using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace Tavenem.Blazor.Framework.Components.Forms;

internal static class FormExtensions
{
    public static TValue AddValues<TValue>(TValue first, TValue second)
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

    public static TValue SubtractValues<TValue>(TValue first, TValue second)
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
    public static string? SuppressScientificFormat<TValue>(TValue? value) => (value as IFormattable)?.ToString(
        "0.###################################################################################################################################################################################################################################################################################################################################################",
        CultureInfo.InvariantCulture.NumberFormat);

    public static bool TryParseValue<TValue>(
        this string? value,
        TValue min,
        TValue max,
        [MaybeNullWhen(false)] out TValue result,
        IFormatProvider? formatProvider = null)
    {
        result = default;

#pragma warning disable CS8762 // Parameter must have a non-null value when exiting in some condition.
        if (string.IsNullOrEmpty(value))
        {
            return true;
        }
#pragma warning restore CS8762 // Parameter must have a non-null value when exiting in some condition.

        var success = false;
        var targetType = Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);
        if (targetType == typeof(decimal))
        {
            if (decimal.TryParse(value, NumberStyles.Any, formatProvider ?? CultureInfo.InvariantCulture, out var parsed))
            {
                success = true;
            }
            if (success)
            {
                result = (TValue)(object)parsed;
                if (result is not null)
                {
                    if (ValueIsLess(result, min))
                    {
                        result = min;
                    }
                    else if (ValueIsMore(result, max))
                    {
                        result = max;
                    }
                }
            }
        }
        else if (targetType == typeof(double))
        {
            if (double.TryParse(value, NumberStyles.Any, formatProvider ?? CultureInfo.InvariantCulture, out var parsed))
            {
                result = (TValue)(object)parsed;
                success = true;
            }
            if (success)
            {
                result = (TValue)(object)parsed;
                if (result is not null)
                {
                    if (ValueIsLess(result, min))
                    {
                        result = min;
                    }
                    else if (ValueIsMore(result, max))
                    {
                        result = max;
                    }
                }
            }
        }
        else if (targetType == typeof(float))
        {
            if (float.TryParse(value, NumberStyles.Any, formatProvider ?? CultureInfo.InvariantCulture, out var parsed))
            {
                result = (TValue)(object)parsed;
                success = true;
            }
            if (success)
            {
                result = (TValue)(object)parsed;
                if (result is not null)
                {
                    if (ValueIsLess(result, min))
                    {
                        result = min;
                    }
                    else if (ValueIsMore(result, max))
                    {
                        result = max;
                    }
                }
            }
        }
        else
        {
            if (long.TryParse(value, NumberStyles.Currency, formatProvider ?? CultureInfo.InvariantCulture, out var parsed))
            {
                success = true;
            }
            if (success)
            {
                if (ValueIsLess(parsed, min))
                {
                    result = min;
                }
                else if (ValueIsMore(parsed, max))
                {
                    result = max;
                }
                else
                {
                    result = (TValue)Convert.ChangeType(parsed, targetType);
                }
            }
            else
            {
                if (ulong.TryParse(value, NumberStyles.Currency, formatProvider ?? CultureInfo.InvariantCulture, out var unsignedParsed))
                {
                    success = true;
                }
                if (success)
                {
                    if (ValueIsLess(unsignedParsed, min))
                    {
                        result = min;
                    }
                    else if (ValueIsMore(unsignedParsed, max))
                    {
                        result = max;
                    }
                    else
                    {
                        result = (TValue)Convert.ChangeType(unsignedParsed, targetType);
                    }
                }
            }
        }

        return success;
    }

    public static bool TryParseSelectableValue<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue>(
        this string? value,
        [MaybeNullWhen(false)] out TValue result)
    {
        try
        {
            if (typeof(TValue) == typeof(bool))
            {
                return TryConvertToBool(value, out result);
            }
            else if (typeof(TValue) == typeof(bool?))
            {
                if (string.IsNullOrEmpty(value))
                {
                    result = default!;
                    return true;
                }

                return TryConvertToBool(value, out result);
            }
            else if (BindConverter.TryConvertTo(value, CultureInfo.CurrentCulture, out result))
            {
                return true;
            }

            result = default;
            return false;
        }
        catch
        {
            result = default;
            return false;
        }
    }

    public static bool ValuesEqual<TValue>(TValue first, TValue second)
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

    public static bool ValueIsLess<TValue>(TValue first, TValue second)
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

    public static bool ValueIsLess<TValue>(long first, TValue second)
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

    public static bool ValueIsLess<TValue>(ulong first, TValue second)
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

    public static bool ValueIsMore<TValue>(TValue first, TValue second)
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

    public static bool ValueIsMore<TValue>(long first, TValue second)
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

    public static bool ValueIsMore<TValue>(ulong first, TValue second)
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

    private static bool TryConvertToBool<TValue>(string? value, out TValue result)
    {
        if (bool.TryParse(value, out var @bool))
        {
            result = (TValue)(object)@bool;
            return true;
        }

        result = default!;
        return false;
    }
}
