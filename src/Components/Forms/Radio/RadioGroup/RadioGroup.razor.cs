using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A group for radio buttons.
/// </summary>
public partial class RadioGroup<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue> : FormComponentBase<TValue>
{
    private readonly string _defaultGroupName = Guid.NewGuid().ToHtmlId();

    private RadioContext<TValue>? _context;

    /// <summary>
    /// The icon to use for the checked state.
    /// </summary>
    [Parameter] public string CheckedIcon { get; set; } = DefaultIcons.Radio_Checked;

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

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
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// A template for the labels of dynamic radio buttons generated from the <see cref="Values"/>
    /// collection.
    /// </summary>
    [Parameter] public RenderFragment<TValue>? LabelTemplate { get; set; }

    /// <summary>
    /// Whether the input is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// The tabindex of the group.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The icon to use for the unchecked state.
    /// </summary>
    [Parameter] public string UncheckedIcon { get; set; } = DefaultIcons.Radio_Unchecked;

    /// <summary>
    /// <para>
    /// An optional enumeration of available values, with labels.
    /// </para>
    /// <para>
    /// If provided, dynamic radio buttons will be generated for these values. The value of each
    /// radio button will be the <see cref="KeyValuePair{TKey, TValue}.Key"/>, and the label will be
    /// the <see cref="KeyValuePair{TKey, TValue}.Value"/>.
    /// </para>
    /// </summary>
    [Parameter] public IEnumerable<KeyValuePair<TValue, string?>>? ValuePairs { get; set; }

    /// <summary>
    /// <para>
    /// An optional enumeration of available values.
    /// </para>
    /// <para>
    /// If provided, dynamic radio buttons will be generated for these values.
    /// </para>
    /// <para>
    /// If <see cref="LabelTemplate"/> is not <see langword="null"/> it will be used to generate the
    /// label for each button. If it is <see langword="null"/>, their labels will contain the result
    /// of calling <see cref="object.ToString"/> on the value.
    /// </para>
    /// </summary>
    [Parameter] public IEnumerable<TValue>? Values { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("radio-group")
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .Add("required", Required)
        .ToString();

    [CascadingParameter] private RadioContext<TValue>? CascadingContext { get; set; }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (_context is null
            || _context.ParentContext != CascadingContext)
        {
            var callback = EventCallback.Factory.CreateBinder<string?>(this, v => CurrentValueAsString = v, CurrentValueAsString);
            _context = new RadioContext<TValue>(CascadingContext, callback);
        }

        _context.GroupName = !string.IsNullOrEmpty(Name) ? Name : _defaultGroupName;
        _context.CurrentValue = CurrentValue;

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
        else if (value.TryParseSelectableValue(out result))
        {
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