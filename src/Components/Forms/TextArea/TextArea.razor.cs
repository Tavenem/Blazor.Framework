using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A textarea input component.
/// </summary>
public partial class TextArea : InputComponentBase<string?>
{
    private readonly AdjustableTimer _timer;

    private bool _disposedValue;
    private string? _newValue;

    /// <summary>
    /// <para>
    /// Whether the browser's built-in autocomplete feature should be enabled for this field.
    /// </para>
    /// <para>
    /// Default is <see langword="null"/>, which means that the browser will use the default
    /// behavior.
    /// </para>
    /// <para>
    /// Note: the value of this attribute is sometimes ignored by browsers.
    /// </para>
    /// </summary>
    [Parameter] public bool? Autocomplete { get; set; }

    /// <summary>
    /// <para>
    /// Whether the browser's built-in autocorrect feature should be enabled for this field.
    /// </para>
    /// <para>
    /// Default is <see langword="null"/>, which means that the browser will use the default
    /// behavior.
    /// </para>
    /// <para>
    /// Note: this attribute is non-standard, and may not be supported by all browsers.
    /// </para>
    /// </summary>
    [Parameter] public bool? Autocorrect { get; set; }

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <summary>
    /// The maximum length of the input string.
    /// </summary>
    [Parameter] public int? MaxLength { get; set; }

    /// <summary>
    /// <para>
    /// The number of visible text lines in this text area.
    /// </para>
    /// <para>
    /// Default is 2. Minimum is 1.
    /// </para>
    /// </summary>
    [Parameter] public int Rows { get; set; } = 2;

    /// <summary>
    /// The placeholder value.
    /// </summary>
    [Parameter] public string? Placeholder { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show the current character count and maximum length, if <see cref="MaxLength"/>
    /// has been set.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>
    /// </para>
    /// </summary>
    [Parameter] public bool ShowLength { get; set; }

    /// <summary>
    /// <para>
    /// Whether the browser's built-in spellcheck feature should be enabled for this field.
    /// </para>
    /// <para>
    /// Default is <see langword="null"/>, which means that the browser will use the default
    /// behavior.
    /// </para>
    /// <para>
    /// Note: this attribute may not be supported by all browsers.
    /// </para>
    /// </summary>
    [Parameter] public bool? Spellcheck { get; set; }

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected override string? InputCssClass => new CssBuilder(InputClass)
        .Add("input-core")
        .ToString();

    private string? AutocompleteValue
    {
        get
        {
            if (Autocomplete.HasValue)
            {
                return Autocomplete.Value ? "on" : "off";
            }
            return null;
        }
    }

    private string? AutocorrectValue
    {
        get
        {
            if (Autocorrect.HasValue)
            {
                return Autocorrect.Value ? "on" : "off";
            }
            return null;
        }
    }

    private int CurrentLength { get; set; }

    private protected override bool ShrinkWhen => base.ShrinkWhen
        || !string.IsNullOrEmpty(Placeholder);

    private protected string? SpellcheckValue
    {
        get
        {
            if (Spellcheck.HasValue)
            {
                return Spellcheck.Value ? "true" : "false";
            }
            return "default";
        }
    }

    /// <summary>
    /// Constructs a new instance of <see cref="TextArea"/>.
    /// </summary>
    public TextArea() => _timer = new(OnTimer, UpdateOnInputDebounce ?? 0);

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (Rows < 1)
        {
            Rows = 1;
        }
    }

    /// <summary>
    /// Clears the current input text.
    /// </summary>
    public void Clear()
    {
        _timer.Cancel();
        CurrentLength = 0;
        CurrentValueAsString = null;
    }

    /// <summary>
    /// Focuses this input.
    /// </summary>
    public async Task FocusAsync() => await ElementReference.FocusAsync();

    /// <summary>
    /// Selects all text in this input.
    /// </summary>
    public ValueTask SelectAsync() => ElementReference.SelectAsync();

    /// <summary>
    /// Selects a range of text in this input.
    /// </summary>
    /// <param name="start">The index of the first character to select.</param>
    /// <param name="end">
    /// <para>
    /// The exclusive index of the last index in the selection.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the entire remaining text will be selected.
    /// </para>
    /// </param>
    public ValueTask SelectRangeAsync(int start, int? end = null)
        => ElementReference.SelectRangeAsync(start, end);

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _timer.Dispose();
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(string? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }
        return value;
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out string? result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        validationErrorMessage = null;

        if (Converter is not null
            && Converter.TryGetValue(value, out result))
        {
            if (result is null)
            {
                result = default!;
            }
        }
        else
        {
            result = value;
        }

        if (!IsTouched
            && !string.Equals(result, InitialValue))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && !string.Equals(result, CurrentValue))
        {
            EvaluateDebounced();
        }

        return true;
    }

    private void OnInput(ChangeEventArgs e)
    {
        var str = e.Value as string;

        CurrentLength = str?.Length ?? 0;

        if (!UpdateOnInput
            || string.Equals(CurrentValueAsString, str))
        {
            return;
        }

        if (UpdateOnInputDebounce > 0)
        {
            _newValue = str;
            _timer.Change(UpdateOnInputDebounce.Value);
        }
        else
        {
            CurrentValueAsString = str;
        }
    }

    private void OnChange(ChangeEventArgs e)
    {
        _timer.Cancel();

        var str = e.Value as string;

        CurrentLength = str?.Length ?? 0;

        CurrentValueAsString = str;
    }

    private void OnTimer() => CurrentValueAsString = _newValue;
}