using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A text input component.
/// </summary>
public partial class TextInput : InputComponentBase<string?>
{
    private bool _disposedValue;
    private Timer? _focusTimer;
    private Timer? _inputTimer;
    private Timer? _suggestionTimer;
    private bool _suggestionTimerCanceled;

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
    [Parameter, NotNull] public bool Clearable { get; set; } = true;

    /// <summary>
    /// <para>
    /// The icon displayed for the clear button.
    /// </para>
    /// <para>
    /// Default is "clear".
    /// </para>
    /// </summary>
    [Parameter] public string ClearIcon { get; set; } = "clear";

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

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

    private string? _dataListId;
    /// <summary>
    /// The id of the <c>datalist</c> element, if <see cref="Suggestions"/> is non-empty.
    /// </summary>
    protected string? DataListId => InputType != InputType.Password
        && Suggestions?.Any() == true
        ? (_dataListId ??= Guid.NewGuid().ToString())
        : null;

    private protected override bool ShrinkWhen => base.ShrinkWhen
        || PrefixContent is not null
        || !string.IsNullOrEmpty(Placeholder)
        || !string.IsNullOrEmpty(PrefixIcon)
        || !string.IsNullOrEmpty(PrefixText);

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

    private bool _canClear = false;
    private bool CanClear => Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && (!string.IsNullOrEmpty(CurrentValue)
        || _canClear);

    private string? CurrentInput { get; set; }

    private int CurrentLength { get; set; }

    private IEnumerable<string> FilteredSuggestions
    {
        get
        {
            if (Suggestions is null)
            {
                return Enumerable.Empty<string>();
            }
            if (string.IsNullOrEmpty(CurrentInput))
            {
                return Suggestions;
            }
            return Suggestions
                .Where(x => x.Contains(CurrentInput, StringComparison.InvariantCultureIgnoreCase))
                .OrderBy(x => x);
        }
    }

    private IEnumerable<KeyValuePair<string, object>> FilteredSuggestionValues
    {
        get
        {
            if (SuggestionValues is null
                && LoadedSuggestions is null)
            {
                return Enumerable.Empty<KeyValuePair<string, object>>();
            }
            if (string.IsNullOrEmpty(CurrentInput))
            {
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
            if (SuggestionValues is null)
            {
                return LoadedSuggestions!
                    .Where(x => x.Key.Contains(CurrentInput, StringComparison.InvariantCultureIgnoreCase))
                    .OrderBy(x => x.Key);
            }
            if (LoadedSuggestions is null)
            {
                return SuggestionValues!
                    .Where(x => x.Key.Contains(CurrentInput, StringComparison.InvariantCultureIgnoreCase))
                    .OrderBy(x => x.Key);
            }
            return SuggestionValues
                .Concat(LoadedSuggestions)
                .Where(x => x.Key.Contains(CurrentInput, StringComparison.InvariantCultureIgnoreCase))
                .OrderBy(x => x.Key);
        }
    }

    private bool HasFocus { get; set; }

    private bool HasSuggestions => Suggestions?.Any() == true
        || SuggestionValues?.Any() == true
        || LoadedSuggestions?.Any() == true;

    private string? SuggestionListCssClass => new CssBuilder("list clickable dense")
        .Add((ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor).ToCSS())
        .ToString();

    private IEnumerable<KeyValuePair<string, object>>? LoadedSuggestions { get; set; }

    private bool LoadingSuggestions { get; set; }

    private bool ShowSuggestions => InputType != InputType.Password
        && HasFocus
        && HasSuggestions
        && !SuggestionsClosed;

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

    private bool SuggestionsClosed { get; set; }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        CurrentInput = Value;
    }

    /// <summary>
    /// Clears the current input text.
    /// </summary>
    public void Clear()
    {
        _canClear = false;
        CurrentLength = 0;
        CurrentValueAsString = null;
        CurrentInput = null;
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
                _focusTimer?.Dispose();
                _inputTimer?.Dispose();
                _suggestionTimer?.Dispose();
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

    private void ClearFocus(object? _)
    {
        HasFocus = false;
        StateHasChanged();
    }

    private async void GetSuggestions(object? _)
    {
        if (LoadSuggestions is null
            || _suggestionTimerCanceled)
        {
            return;
        }

        try
        {
            LoadedSuggestions = await LoadSuggestions(CurrentInput);
        }
        catch { }
    }

    private void OnClick() => SuggestionsClosed = false;

    private void OnFocusIn() => HasFocus = true;

    private void OnFocusOut()
    {
        _suggestionTimerCanceled = true;
        if (_focusTimer is null)
        {
            _focusTimer = new Timer(ClearFocus, null, 200, Timeout.Infinite);
        }
        else
        {
            _focusTimer.Change(200, Timeout.Infinite);
        }
    }

    private void OnInput(ChangeEventArgs e)
    {
        SuggestionsClosed = false;
        LoadedSuggestions = null;

        CurrentInput = e.Value as string;

        _canClear = CurrentInput?.Length > 0;

        CurrentLength = CurrentInput?.Length ?? 0;

        if (!UpdateOnInput
            || string.Equals(CurrentValueAsString, CurrentInput))
        {
            return;
        }

        if (UpdateOnInputDebounce > 0)
        {
            if (_inputTimer is null)
            {
                _inputTimer = new Timer(OnTimer, null, UpdateOnInputDebounce.Value, Timeout.Infinite);
            }
            else
            {
                _inputTimer.Change(UpdateOnInputDebounce.Value, Timeout.Infinite);
            }
        }
        else
        {
            CurrentValueAsString = CurrentInput;
        }

        if (LoadSuggestions is not null)
        {
            _suggestionTimerCanceled = false;
            if (_suggestionTimer is null)
            {
                _suggestionTimer = new Timer(GetSuggestions, null, 300, Timeout.Infinite);
            }
            else
            {
                _suggestionTimer.Change(300, Timeout.Infinite);
            }
        }
    }

    private Task OnChangeAsync(ChangeEventArgs e) => SetValueAsync(e.Value as string);

    private void OnTimer(object? state)
    {
        CurrentValueAsString = CurrentInput;
        StateHasChanged();
    }

    private async Task SetValueAsync(string? value)
    {
        _inputTimer?.Change(Timeout.Infinite, Timeout.Infinite);

        CurrentInput = value;

        _canClear = value?.Length > 0;

        CurrentLength = value?.Length ?? 0;

        CurrentValueAsString = Mask is null
            ? value
            : Mask.FormatInput(value);
        if (CurrentValueAsString != value)
        {
            var x = CurrentValueAsString;
            CurrentValueAsString = string.IsNullOrEmpty(Value)
                ? " "
                : null;
            await Task.Delay(1);

            CurrentValueAsString = x;
        }
    }

    private async Task SuggestionSelectedAsync(string? suggestion)
    {
        SuggestionsClosed = true;
        await SetValueAsync(suggestion);
    }
}