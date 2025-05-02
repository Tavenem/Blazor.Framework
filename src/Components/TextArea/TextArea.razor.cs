using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A textarea input component.
/// </summary>
public partial class TextArea : InputComponentBase<string>, IAsyncDisposable
{
    private readonly AdjustableTimer _timer;

    private bool _disposedValue;
    private IJSObjectReference? _module;
    private string? _newValue;
    private DotNetObjectReference<TextArea>? _objRef;

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
    /// Invoked when the enter key is pressed, and the input is valid.
    /// </summary>
    [Parameter] public EventCallback OnValidEnter { get; set; }

    /// <summary>
    /// The placeholder value.
    /// </summary>
    [Parameter] public string? Placeholder { get; set; }

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
    /// If <see langword="true"/>, pressing the Enter key will have no effect unless the Shift key
    /// is also pressed.
    /// </summary>
    /// <remarks>
    /// This is especially useful in combination with <see cref="OnValidEnter"/> when the Enter key
    /// is expected to submit the content of the textarea, without adding a newline to the text.
    /// </remarks>
    [Parameter] public bool SuppressEnter { get; set; }

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
        .ToString();

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected override string? InputCssClass => new CssBuilder(base.InputCssClass)
        .Add("has-placeholder", !string.IsNullOrEmpty(Placeholder))
        .ToString();

    [Inject] private IJSRuntime JSRuntime { get; set; } = default!;

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

    private protected string? SpellcheckValue => Spellcheck == true ? "true" : "false";

    /// <summary>
    /// Constructs a new instance of <see cref="TextArea"/>.
    /// </summary>
    public TextArea() => _timer = new(OnTimer, UpdateOnInputDebounce ?? 0);

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _objRef = DotNetObjectReference.Create(this);
            _module = await JSRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-text-area.js");
            await _module.InvokeVoidAsync("init", Id, _objRef);
        }
    }

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
        CurrentValueAsString = null;
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
                _timer.Dispose();
                _objRef?.Dispose();
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    /// <inheritdoc/>
    public async ValueTask DisposeAsync()
    {
        await DisposeAsyncCore().ConfigureAwait(false);

        Dispose(disposing: false);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous dispose operation.</returns>
    protected virtual async ValueTask DisposeAsyncCore()
    {
        if (_module is not null)
        {
            await _module.DisposeAsync();
        }
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

    /// <summary>
    /// Invoked by JavaScript.
    /// </summary>
    [JSInvokable]
    public async Task OnEnterAsync()
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

    private void OnInput(ChangeEventArgs e)
    {
        var str = e.Value as string;

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
        CurrentValueAsString = e.Value as string;
    }

    private void OnTimer() => CurrentValueAsString = _newValue;
}