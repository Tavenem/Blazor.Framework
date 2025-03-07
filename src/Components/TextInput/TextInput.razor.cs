using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A text input component.
/// </summary>
public partial class TextInput : InputComponentBase<string>
{
    private readonly AsyncAdjustableTimer _suggestionTimer;

    private bool _disposedValue;

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
    /// <para>
    /// Whether to display a clear button which erases all input text.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool Clearable { get; set; } = true;

    /// <summary>
    /// <para>
    /// The type of input.
    /// </para>
    /// <para>
    /// Defaults to <see cref="InputType.Text"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: not all HTML input types are available. The missing types are supported by different
    /// components.
    /// </remarks>
    [Parameter] public InputType InputType { get; set; }

    /// <summary>
    /// <para>
    /// A function which asynchronously loads suggestions.
    /// </para>
    /// <para>
    /// If provided, the results will be displayed as autocomplete suggestions when the input has
    /// focus.
    /// </para>
    /// <para>
    /// The <see cref="KeyValuePair{TKey, TValue}.Key"/> will be sent to the input if selected,
    /// while the <see cref="KeyValuePair{TKey, TValue}.Value"/> will be presented in the list.
    /// Values will be sent to the <see cref="SuggestionTemplate"/>, if one is provided. Otherwise,
    /// the <see cref="object.ToString"/> function will be used.
    /// </para>
    /// </summary>
    [Parameter] public Func<string?, Task<IEnumerable<KeyValuePair<string, object>>>>? LoadSuggestions { get; set; }

    /// <summary>
    /// <para>
    /// An optional mask which will be used to format the input.
    /// </para>
    /// <para>
    /// Applied on blur or when enter is pressed.
    /// </para>
    /// <para>
    /// If the input given does not match the mask format, it will not be applied.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Does not provide any validation. Use <see cref="Pattern"/> or validation rules to validate
    /// input.
    /// </remarks>
    [Parameter] public InputMask? Mask { get; set; }

    /// <summary>
    /// The maximum length of the input string.
    /// </summary>
    [Parameter] public int? MaxLength { get; set; }

    /// <summary>
    /// The minimum length of the input string.
    /// </summary>
    [Parameter] public int? MinLength { get; set; }

    /// <summary>
    /// Invoked when the enter key is pressed, and the input is valid.
    /// </summary>
    [Parameter] public EventCallback OnValidEnter { get; set; }

    /// <summary>
    /// <para>
    /// A regular expression which is used to validate input.
    /// </para>
    /// <para>
    /// This regular expression must be in javascript format (rather than .NET format), but should
    /// not be contained in forward slashes.
    /// </para>
    /// </summary>
    [Parameter] public string? Pattern { get; set; }

    /// <summary>
    /// The placeholder value.
    /// </summary>
    [Parameter] public string? Placeholder { get; set; }

    /// <summary>
    /// Displayed after the input.
    /// </summary>
    [Parameter] public RenderFragment<string?>? PostfixContent { get; set; }

    /// <summary>
    /// <para>
    /// Displayed after the input.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PostfixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PostfixIcon { get; set; }

    /// <summary>
    /// <para>
    /// Displayed after the input, before any <see cref="PostfixIcon"/>.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PostfixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PostfixText { get; set; }

    /// <summary>
    /// Displayed before the input.
    /// </summary>
    [Parameter] public RenderFragment<string?>? PrefixContent { get; set; }

    /// <summary>
    /// <para>
    /// Displayed before the input.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PrefixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PrefixIcon { get; set; }

    /// <summary>
    /// <para>
    /// Displayed before the input, after any <see cref="PrefixIcon"/>.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PrefixContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? PrefixText { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show all <see cref="Suggestions"/> rather than only those with a matching
    /// substring.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>
    /// </para>
    /// </summary>
    [Parameter] public bool ShowAllSuggestions { get; set; }

    /// <summary>
    /// Whether to show an emoji picker button, which appends selected emoji to the current input.
    /// </summary>
    [Parameter] public bool ShowEmoji { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show the current character count and maximum length, if <see cref="MaxLength"/>
    /// has been set.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>
    /// </para>
    /// </summary>
    [Parameter] public bool ShowLength { get; set; } = true;

    /// <summary>
    /// The maximum number of characters which the input should show. Its minimum size will be set
    /// to allow this number of characters.
    /// </summary>
    [Parameter] public int? Size { get; set; }

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
    /// <para>
    /// An optional list of suggested values.
    /// </para>
    /// <para>
    /// If provided, these will be displayed as autocomplete suggestions when the input has focus.
    /// </para>
    /// </summary>
    [Parameter] public IEnumerable<string>? Suggestions { get; set; }

    /// <summary>
    /// <para>
    /// A template used to display <see cref="SuggestionValues"/> and the results of <see
    /// cref="LoadSuggestions"/>.
    /// </para>
    /// <para>
    /// The value is supplied as a context parameter.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<object>? SuggestionTemplate { get; set; }

    /// <summary>
    /// <para>
    /// An optional list of suggested items.
    /// </para>
    /// <para>
    /// If provided, these will be displayed as autocomplete suggestions when the input has focus.
    /// </para>
    /// <para>
    /// The <see cref="KeyValuePair{TKey, TValue}.Key"/> will be sent to the input if selected,
    /// while the <see cref="KeyValuePair{TKey, TValue}.Value"/> will be presented in the list.
    /// Values will be sent to the <see cref="SuggestionTemplate"/>, if one is provided. Otherwise,
    /// the <see cref="object.ToString"/> function will be used.
    /// </para>
    /// </summary>
    [Parameter] public IEnumerable<KeyValuePair<string, object>>? SuggestionValues { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("clearable", Clearable)
        .Add(
            "prefixed",
            PrefixContent is not null
                || !string.IsNullOrEmpty(PrefixIcon)
                || !string.IsNullOrEmpty(PrefixText))
        .ToString();

    /// <summary>
    /// The text displayed and edited in the input.
    /// </summary>
    protected string? DisplayString { get; set; }

    private IEnumerable<KeyValuePair<string, object>> AllSuggestionValues
    {
        get
        {
            if (SuggestionValues is null
                && LoadedSuggestions is null)
            {
                return [];
            }
            if (SuggestionValues is null)
            {
                return LoadedSuggestions!
                    .OrderBy(x => x.Key);
            }
            if (LoadedSuggestions is null)
            {
                return SuggestionValues!
                    .OrderBy(x => x.Key);
            }
            return SuggestionValues
                .Concat(LoadedSuggestions)
                .OrderBy(x => x.Key);
        }
    }

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

    private string? CurrentInput { get; set; }

    /// <summary>
    /// The CSS class(es) for the field helpers section.
    /// </summary>
    private string? HelpTextClass => new CssBuilder("mr-auto")
        .Add("onfocus", DisplayHelpTextOnFocus)
        .ToString();

    private string? SuggestionListCssClass => new CssBuilder("list clickable dense")
        .Add((ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor).ToCSS())
        .ToString();

    private IEnumerable<KeyValuePair<string, object>>? LoadedSuggestions { get; set; }

    private bool LoadingSuggestions { get; set; }

    private bool ShowSuggestions => InputType != InputType.Password
        && (LoadSuggestions is not null
        || Suggestions?.Any() == true
        || SuggestionValues?.Any() == true
        || LoadedSuggestions?.Any() == true);

    private string? SpellcheckValue
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
    /// Constructs a new instance of <see cref="TextInput"/>.
    /// </summary>
    [method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ValueChangeEventArgs))]
    public TextInput() => _suggestionTimer = new(GetSuggestionsAsync, 300);

    /// <inheritdoc/>
    public override Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<string>(
            nameof(Value),
            out var value)
            && ((value is null) != (Value is null)
                || value?.Equals(Value) == false))
        {
            CurrentInput = value;
            DisplayString = Mask is null
                ? value
                : Mask.FormatInput(value);
        }

        return base.SetParametersAsync(parameters);
    }

    /// <summary>
    /// Clears the current input text.
    /// </summary>
    public void Clear()
    {
        _suggestionTimer.Cancel();
        CurrentValueAsString = null;
        CurrentInput = null;
        DisplayString = null;
    }

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
                _suggestionTimer.Dispose();
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
        [MaybeNullWhen(false)] out string result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        validationErrorMessage = null;

        if (Converter is not null
            && Converter.TryGetValue(value, out result))
        {
            result ??= default!;
        }
        else
        {
            result = value!;
        }

        return true;
    }

    private async Task GetSuggestionsAsync()
    {
        if (LoadSuggestions is null)
        {
            return;
        }

        try
        {
            LoadedSuggestions = await LoadSuggestions(CurrentInput);
            StateHasChanged();
        }
        catch
        {
            Console.WriteLine("Tavenem Blazor Framework: Error loading suggestions");
        }
    }

    private async Task OnChangeAsync(ValueChangeEventArgs e)
    {
        if (string.Equals(CurrentValueAsString, e.Value, StringComparison.Ordinal))
        {
            return;
        }

        CurrentInput = e.Value;

        CurrentValueAsString = Mask is null
            ? e.Value
            : Mask.UnmaskInput(e.Value);

        var display = Mask is null
            ? e.Value
            : Mask.FormatInput(e.Value);

        DisplayString = e.Value;
        if (!string.Equals(display, e.Value))
        {
            await Task.Delay(1);
            DisplayString = display;
        }
    }

    private async Task OnInputAsync(ValueChangeEventArgs e)
    {
        LoadedSuggestions = null;

        CurrentInput = e.Value;

        if (UpdateOnInput)
        {
            await OnChangeAsync(e);
        }

        if (LoadSuggestions is not null)
        {
            _suggestionTimer.Start();
        }
    }

    private async Task OnEnterAsync()
    {
        if (!OnValidEnter.HasDelegate)
        {
            return;
        }
        await ValidateAsync();
        if (IsValid)
        {
            await OnValidEnter.InvokeAsync();
        }
    }
}