using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Converts an HTML input element's value string to and from a bound data type.
/// </summary>
/// <typeparam name="TValue">The bound data type.</typeparam>
public class InputValueConverter<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue>
{
    private static readonly Func<string?, IFormatProvider?, TValue?> DefaultGetter = (input, formatProvider) =>
    {
        var result = Convert.ChangeType(input, typeof(TValue), formatProvider);
        if (result is TValue value)
        {
            return value;
        }

        throw new InvalidOperationException("Conversion using the default getter failed");
    };

    private static readonly Func<TValue?, IFormatProvider?, string?, string?> DefaultSetter = (value, formatProvider, format) =>
    {
        if (value is IFormattable formattable)
        {
            return formattable.ToString(format, formatProvider);
        }

        return value?.ToString();
    };

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
    /// <para>
    /// If left <see langword="null"/> and <typeparamref name="TValue"/> implements <see
    /// cref="IFormattable"/>, its <see cref="IFormattable.ToString(string?, IFormatProvider?)"/>
    /// will be used. If it does not, <see cref="object.ToString()"/> is used.
    /// </para>
    /// </param>
    public InputValueConverter(Func<string?, IFormatProvider?, TValue?> getter, Func<TValue?, IFormatProvider?, string?, string?>? setter = null)
    {
        Getter = getter;
        Setter = setter ?? DefaultSetter;
    }

    /// <summary>
    /// Initializes a new instance of <see cref="InputValueConverter{TValue}"/>.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Uses a default getter implementation: <see cref="Convert.ChangeType(object?, Type)"/> is
    /// used. If the type does not implement <see cref="IConvertible"/> or the conversion to string
    /// is invalid, exceptions might be thrown.
    /// </para>
    /// <para>
    /// Uses a default setter implementation: if <typeparamref name="TValue"/> implements <see
    /// cref="IFormattable"/>, its <see cref="IFormattable.ToString(string?, IFormatProvider?)"/>
    /// will be used. If it does not, <see cref="object.ToString()"/> is used.
    /// </para>
    /// </remarks>
    public InputValueConverter() : this(DefaultGetter, null) { }

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
