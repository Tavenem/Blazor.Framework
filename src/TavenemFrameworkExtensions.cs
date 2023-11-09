using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Numerics;
using System.Text;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Extension methods provided by <c>Tavenem.Blazor.Framework</c>
/// </summary>
public static class TavenemFrameworkExtensions
{
    private const string Letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    private static readonly Random _Random = new();

    /// <summary>
    /// Gets a string representation of the given <see cref="Guid"/> instance suitable for use as an
    /// HTML id attribute.
    /// </summary>
    /// <param name="guid">The <see cref="Guid"/> to format as an HTML id.</param>
    /// <returns>
    /// A string suitable for use as an HTML id attribute.
    /// </returns>
    /// <remarks>
    /// Uses the "N" format for <see cref="Guid.ToString(string)"/>, and replaces a leading digit
    /// with a random letter, since leading digits are invalid in HTML ids.
    /// </remarks>
    public static string ToHtmlId(this Guid guid)
    {
        var str = guid.ToString("N");
        if (char.IsDigit(str, 0))
        {
            return Letters[_Random.Next(Letters.Length)] + str;
        }
        return str;
    }

    /// <summary>
    /// Gets a string formatted for display.
    /// </summary>
    /// <param name="value">A string to format.</param>
    /// <returns>
    /// <para>
    /// Replaces underscores with spaces.
    /// </para>
    /// <para>
    /// Prefixes uppercase letters which follow lowercase letters with a space. In other words,
    /// separates the words in <c>camelCase</c> and <c>PascalCase</c> terms.
    /// </para>
    /// </returns>
    [return: NotNullIfNotNull(nameof(value))]
    public static string? ToHumanReadable(this string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        var sb = new StringBuilder();
        var lower = false;
        for (var i = 0; i < value.Length; i++)
        {
            if (value[i] == '_')
            {
                sb.Append(' ');
                lower = false;
            }
            else if (lower && char.IsUpper(value[i]))
            {
                sb.Append(' ')
                    .Append(value[i]);
                lower = false;
            }
            else
            {
                sb.Append(value[i]);
                lower = char.IsLower(value[i]);
            }
        }

        return sb.ToString();
    }

    /// <summary>
    /// Gets a string representation of the given <paramref name="value"/> formatted for display.
    /// </summary>
    /// <param name="value">An <see cref="Enum"/> value to format.</param>
    /// <returns>
    /// <para>
    /// Replaces underscores with spaces.
    /// </para>
    /// <para>
    /// Prefixes uppercase letters which follow lowercase letters with a space. In other words,
    /// separates the words in <c>camelCase</c> and <c>PascalCase</c> terms.
    /// </para>
    /// </returns>
    public static string ToHumanReadable(this Enum value)
        => ToHumanReadable(value.ToString());

    /// <summary>
    /// Gets a string representation of the given <see cref="Enum"/> <paramref name="value"/>
    /// suitable for use as a CSS class name.
    /// </summary>
    /// <param name="value">The <see cref="Enum"/> value to convert.</param>
    /// <returns>
    /// A string representation of the given <see cref="Enum"/> <paramref name="value"/> suitable
    /// for use as a CSS class name; or <see langword="null"/> if the <paramref name="value"/> is
    /// <see langword="null"/>, or its numeric value is equal to zero.
    /// </returns>
    /// <remarks>
    /// Gets the result of <see cref="Enum.ToString()"/>, then performs <see
    /// cref="string.ToLowerInvariant()"/>, and finally replaces all instances of the '_' character
    /// with '-' (an opinionated stylistic choice, not required by CSS naming rules).
    /// </remarks>
    public static string? ToCSS(this Enum value)
    {
        if (value is null || Convert.ToInt32(value) == 0)
        {
            return null;
        }

        return value
            .ToString()
            .ToLowerInvariant()
            .Replace('_', '-');
    }

    /// <summary>
    /// Gets a string representation of the given <paramref name="value"/>, with no more than the
    /// given number of fractional digits, in its most compact form, suitable for use as a CSS
    /// property value.
    /// </summary>
    /// <param name="value">The value to convert.</param>
    /// <param name="precision">The maximum number of fractional digits.</param>
    /// <returns>
    /// <para>
    /// A string representation of <paramref name="value"/> using '.' as the decimal separator
    /// regardless of the current culture (as required in CSS), with any leading or trailing zeros
    /// removed, and the decimal indicator also trimmed if it becomes the final character.
    /// </para>
    /// <para>
    /// Or "0", if <paramref name="value"/> is between -0.00001 and 0.00001 (regardless of the value
    /// of <paramref name="precision"/>).
    /// </para>
    /// </returns>
    public static string ToCSS<T>(this T value, int precision = 5) where T : IFloatingPoint<T>
    {
        if (value < T.CreateTruncating(0.00001)
            && value > T.CreateTruncating(-0.00001))
        {
            return "0";
        }
        return precision <= 0
            ? $"{value.ToString("F0", CultureInfo.InvariantCulture).Trim('0').TrimEnd('.')}"
            : $"{value.ToString($"F{precision}", CultureInfo.InvariantCulture).Trim('0').TrimEnd('.')}";
    }

    /// <summary>
    /// Gets a string representation of the given <paramref name="value"/>, with no more than the
    /// given number of fractional digits, in its most compact form and followed by "px" for use in
    /// a CSS property.
    /// </summary>
    /// <param name="value">The value to convert.</param>
    /// <param name="precision">The maximum number of fractional digits.</param>
    /// <returns>
    /// <para>
    /// A string representation of <paramref name="value"/> using '.' as the decimal separator
    /// regardless of the current culture (as required in CSS), with any leading or trailing zeros
    /// removed, and the decimal indicator also trimmed if it becomes the final character, followed
    /// by "px".
    /// </para>
    /// <para>
    /// Or "0px", if <paramref name="value"/> is between -0.00001 and 0.00001 (regardless of the
    /// value of <paramref name="precision"/>).
    /// </para>
    /// </returns>
    public static string ToPixels<T>(this T value, int precision = 5) where T : IFloatingPoint<T>
    {
        if (value < T.CreateTruncating(0.00001)
            && value > T.CreateTruncating(-0.00001))
        {
            return "0px";
        }
        return precision <= 0
            ? $"{value.ToString("F0", CultureInfo.InvariantCulture).Trim('0').TrimEnd('.')}px"
            : $"{value.ToString($"F{precision}", CultureInfo.InvariantCulture).Trim('0').TrimEnd('.')}px";
    }
}
