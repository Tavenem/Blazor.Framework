using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for input components.
/// </summary>
public abstract class InputComponentBase<TValue> : FormComponentBase<TValue>
{
    /// <summary>
    /// Whether this input should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

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
    /// Whether the input is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

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
    [Parameter] public Dictionary<string, object> InputAttributes { get; set; } = new();

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
    /// Whether the input is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

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
        .Add(ThemeColor.ToCSS())
        .Add("disabled", IsDisabled)
        .Add("read-only", IsReadOnly)
        .Add("field")
        .Add("shrink", ShrinkWhen)
        .Add("required", Required)
        .Add("no-label", string.IsNullOrEmpty(Label))
        .ToString();

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected virtual string? InputCssClass => InputClass;

    /// <summary>
    /// The final value assigned to the input element's style attribute, including component values.
    /// </summary>
    protected virtual string? InputCssStyle => InputStyle;

    /// <summary>
    /// The CSS class(es) for the field helpers section.
    /// </summary>
    protected string? HelpersClass => new CssBuilder("field-helpers")
        .Add("onfocus", DisplayHelpTextOnFocus)
        .ToString();

    /// <summary>
    /// The HTML <c>id</c> value for the <c>input</c> element.
    /// </summary>
    protected string InputId { get; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// Whether the control is being rendered interactively.
    /// </summary>
    protected bool Interactive { get; set; }

    /// <summary>
    /// Whether this control is currently disabled.
    /// </summary>
    /// <remarks>
    /// Returns <see langword="true"/> if <see cref="Disabled"/> is <see langword="true"/> or <see
    /// cref="Interactive"/> is <see langword="false"/>.
    /// </remarks>
    protected bool IsDisabled => Disabled || !Interactive;

    /// <summary>
    /// Whether this control is currently read-only.
    /// </summary>
    /// <remarks>
    /// Returns <see langword="true"/> if <see cref="ReadOnly"/> is <see langword="true"/> or <see
    /// cref="Interactive"/> is <see langword="false"/>.
    /// </remarks>
    protected bool IsReadOnly => ReadOnly || !Interactive;

    /// <summary>
    /// Controls when this component adds the "shrink" CSS class.
    /// </summary>
    protected virtual bool ShrinkWhen => !string.IsNullOrEmpty(CurrentValueAsString);

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
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Interactive = true;
            StateHasChanged();
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
