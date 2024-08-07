﻿using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for input components.
/// </summary>
public abstract class InputComponentBase<TValue> : FormComponentBase<TValue>
{
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
    /// <para>
    /// Whether the help text should only be displayed when the input has focus.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool DisplayHelpTextOnFocus { get; set; }

    /// <summary>
    /// The format string to use for conversion.
    /// </summary>
    [Parameter] public string? Format { get; set; }

    /// <summary>
    /// <para>
    /// The <see cref="IFormatProvider"/> to use for conversion.
    /// </para>
    /// <para>
    /// Default is <see cref="CultureInfo.CurrentCulture"/>.
    /// </para>
    /// </summary>
    [Parameter] public IFormatProvider? FormatProvider { get; set; }

    /// <summary>
    /// Any help text displayed below the input.
    /// </summary>
    /// <remarks>
    /// If <see cref="HelpTextContent"/> is provided, this property is ignored.
    /// </remarks>
    [Parameter] public string? HelpText { get; set; }

    /// <summary>
    /// Any help text displayed below the input, as markup content.
    /// </summary>
    /// <remarks>
    /// If provided, overrides <see cref="HelpText"/>.
    /// </remarks>
    [Parameter] public MarkupString? HelpTextContent { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the inner input element (may be a hidden element).
    /// </summary>
    [Parameter] public string? InputClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the inner input element (may be a hidden element).
    /// </summary>
    [Parameter] public string? InputStyle { get; set; }

    /// <summary>
    /// Whether the bound <see cref="InputBase{TValue}.Value"/> should update whenever the value
    /// changes (rather than on blur or when the enter key is pressed).
    /// </summary>
    [Parameter] public bool UpdateOnInput { get; set; }

    /// <summary>
    /// <para>
    /// When <see cref="UpdateOnInput"/> is true, this can be set to a number of milliseconds that
    /// the component will wait before updating the bound <see cref="InputBase{TValue}.Value"/>.
    /// </para>
    /// <para>
    /// Even when a debounce is used, the component will always update immediately on blur and when
    /// the enter key is pressed.
    /// </para>
    /// </summary>
    [Parameter] public int? UpdateOnInputDebounce { get; set; }

    /// <summary>
    /// The CSS class(es) for the field helpers section.
    /// </summary>
    protected string? HelpersClass => new CssBuilder("field-helpers")
        .Add("onfocus", DisplayHelpTextOnFocus)
        .ToString();

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected virtual string? InputCssClass => InputClass;

    /// <summary>
    /// The final value assigned to the input element's style attribute.
    /// </summary>
    protected virtual string? InputCssStyle => InputStyle;

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
        var success = false;

        if (Converter is not null
            && Converter.TryGetValue(value, out result))
        {
            success = true;
        }
        else if (typeof(TValue) == typeof(string))
        {
            result = (TValue?)(object?)value ?? default!;
            success = true;
        }
        else
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

        HasConversionError = !success;

        return success;
    }
}
