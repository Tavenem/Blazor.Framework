using System.Globalization;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Converts an HTML input element's value string to and from a bound data type.
/// </summary>
/// <typeparam name="TValue">The bound data type.</typeparam>
public class InputValueConverter<TValue>
{
    /// <summary>
    /// An optional format string used during conversion.
    /// </summary>
    /// <remarks>
    /// Only used if the default implementation is used.
    /// </remarks>
    public string? Format { get; set; }

    /// <summary>
    /// <para>
    /// The <see cref="IFormatProvider"/> to use for conversion.
    /// </para>
    /// <para>
    /// Default is <see cref="CultureInfo.CurrentCulture"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Only used if the default implementation is used.
    /// </remarks>
    public IFormatProvider? FormatProvider { get; set; } = CultureInfo.CurrentCulture;

    /// <summary>
    /// A function to convert the input value to a bound value.
    /// </summary>
    public Func<string?, IFormatProvider?, TValue?> Getter { get; }

    /// <summary>
    /// A function to convert the bound value to an input value.
    /// </summary>
    public Func<TValue?, IFormatProvider?, string?, string?> Setter { get; }

    /// <summary>
    /// Initializes a new instance of <see cref="InputValueConverter{TValue}"/>.
    /// </summary>
    /// <param name="getter">
    /// A function to convert the input value to a bound value.
    /// </param>
    /// <param name="setter">
    /// <para>
    /// A function to convert the bound value to an input value.
    /// </para>
    /// </param>
    public InputValueConverter(
        Func<string?, IFormatProvider?, TValue?> getter,
        Func<TValue?, IFormatProvider?, string?, string?> setter)
    {
        Getter = getter;
        Setter = setter;
    }

    /// <summary>
    /// Tries to convert an input value to a bound value.
    /// </summary>
    /// <param name="input">The input value.</param>
    /// <param name="value">
    /// If the conversion succeeds, this will be set to the converted value.
    /// </param>
    /// <returns>
    /// <see langword="true"/> if the conversion succeeds; otherwise <see langword="false"/>.
    /// </returns>
    public bool TryGetValue(string? input, out TValue? value)
    {
        value = default;
        try
        {
            value = Getter(input, FormatProvider);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Tries to convert a bound value to an input value.
    /// </summary>
    /// <param name="value">The bound value.</param>
    /// <param name="input">
    /// If the conversion succeeds, this will be set to the converted value.
    /// </param>
    /// <returns>
    /// <see langword="true"/> if the conversion succeeds; otherwise <see langword="false"/>.
    /// </returns>
    public bool TrySetValue(TValue? value, out string? input)
    {
        input = default;
        try
        {
            input = Setter(value, FormatProvider, Format);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
