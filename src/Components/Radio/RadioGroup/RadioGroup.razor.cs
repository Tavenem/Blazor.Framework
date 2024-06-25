using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A group for radio buttons.
/// </summary>
public partial class RadioGroup<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue>
    : FormComponentBase<TValue>
{
    private readonly string _defaultGroupName = Guid.NewGuid().ToHtmlId();

    private RadioContext<TValue>? _context;

    /// <summary>
    /// The icon to use for the checked state.
    /// </summary>
    [Parameter] public string? CheckedIcon { get; set; }

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

    /// <inheritdoc />
    public override ElementReference ElementReference
    {
        get => FirstButton?.ElementReference ?? FieldSet;
        set
        {
            if (FirstButton is not null)
            {
                FirstButton.ElementReference = value;
            }
            else
            {
                FieldSet = value;
            }
        }
    }

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
    /// Custom HTML attributes for the input element.
    /// </summary>
    [Parameter] public Dictionary<string, object> InputAttributes { get; set; } = [];

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="CheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsCheckedIconOutlined { get; set; }

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="UncheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsUncheckedIconOutlined { get; set; }

    /// <summary>
    /// A template for the labels of dynamic radio buttons generated from the <see cref="Values"/>
    /// collection.
    /// </summary>
    [Parameter] public RenderFragment<TValue>? LabelTemplate { get; set; }

    /// <summary>
    /// The icon to use for the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedIcon { get; set; }

    /// <summary>
    /// <para>
    /// An optional list of available values, with labels.
    /// </para>
    /// <para>
    /// If provided, dynamic radio buttons will be generated for these values. The value of each
    /// radio button will be the <see cref="KeyValuePair{TKey, TValue}.Key"/>, and the label will be
    /// the <see cref="KeyValuePair{TKey, TValue}.Value"/>.
    /// </para>
    /// </summary>
    [Parameter] public IList<KeyValuePair<TValue, string?>>? ValuePairs { get; set; }

    /// <summary>
    /// <para>
    /// An optional list of available values.
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
    [Parameter] public IList<TValue>? Values { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("field")
        .Add("disabled", Disabled)
        .Add("read-only", ReadOnly)
        .Add("required", Required)
        .Add("no-label", string.IsNullOrEmpty(Label))
        .Add("modified", IsTouched)
        .Add("valid", IsValid)
        .Add("invalid", IsInvalidAndTouched)
        .Add("radio-group")
        .ToString();

    /// <inheritdoc/>
    protected override string? InputCssClass => new CssBuilder(InputClass)
        .AddClassFromDictionary(InputAttributes)
        .ToString();

    /// <inheritdoc/>
    protected override string? InputCssStyle => new CssBuilder(InputStyle)
        .AddStyleFromDictionary(InputAttributes)
        .ToString();

    [CascadingParameter] private RadioContext<TValue>? CascadingContext { get; set; }

    private ElementReference FieldSet { get; set; }

    private RadioButton<TValue>? FirstButton { get; set; }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (_context is null
            || _context.ParentContext != CascadingContext)
        {
            var callback = EventCallback.Factory.CreateBinder<string?>(
                this,
                v => CurrentValueAsString = v,
                CurrentValueAsString);
            _context = new RadioContext<TValue>(CascadingContext, callback);
        }

        _context.GroupName = string.IsNullOrEmpty(NameValue) ? _defaultGroupName : NameValue;
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