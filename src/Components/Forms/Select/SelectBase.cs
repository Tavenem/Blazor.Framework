using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Globalization;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for select components.
/// </summary>
/// <typeparam name="TValue">
/// The type of bound value.
/// </typeparam>
/// <typeparam name="TOption">
/// The type of option values.
/// </typeparam>
public abstract class SelectBase<TValue, TOption> : FormComponentBase<TValue>, ISelect<TOption>
{
    private protected readonly List<Option<TOption>> _options = new();
    private readonly AdjustableTimer _focusTimer, _typeTimer;

    private bool _disposedValue;

    /// <summary>
    /// Whether all options are currently selected.
    /// </summary>
    public virtual bool AllSelected { get; }

    /// <summary>
    /// Whether the select should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// <para>
    /// The icon displayed for the clear button.
    /// </para>
    /// <para>
    /// Default is "clear".
    /// </para>
    /// </summary>
    [Parameter] public string ClearIcon { get; set; } = DefaultIcons.Clear;

    /// <summary>
    /// <para>
    /// The converter used to convert bound values to option values, and vice versa.
    /// </para>
    /// <para>
    /// Built-in components have reasonable default converters for most data types, but you
    /// can supply your own for custom data.
    /// </para>
    /// </summary>
    [Parameter] public InputValueConverter<TOption>? Converter { get; set; }

    /// <summary>
    /// Whether the select is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// A reference to the select element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

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
    /// Any help text displayed below the select.
    /// </summary>
    [Parameter] public string? HelpText { get; set; }

    /// <summary>
    /// <para>
    /// The id of the select element.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// Custom HTML attributes for the select element.
    /// </summary>
    [Parameter] public Dictionary<string, object> InputAttributes { get; set; } = new();

    /// <summary>
    /// Custom CSS class(es) for the select element.
    /// </summary>
    [Parameter] public string? InputClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the select element.
    /// </summary>
    [Parameter] public string? InputStyle { get; set; }

    /// <summary>
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// <para>
    /// If provided, this function receives the text a user types when the select has focus, and a
    /// candidate value, and should return a boolean indicating whether that value matches the input
    /// text.
    /// </para>
    /// <para>
    /// If this function is not provided, an option is considered to match if its <see
    /// cref="Option{TOption}.Label"/> contains the given text, or if it does not have a label (e.g.
    /// because <see cref="Option{TOption}.ChildContent"/> was used instead), then the value's <see
    /// cref="object.ToString"/> is used.
    /// </para>
    /// </summary>
    [Parameter] public Func<string, TOption, bool>? MatchTypedText { get; set; }

    /// <summary>
    /// <para>
    /// An optional enumeration of available options, with labels.
    /// </para>
    /// <para>
    /// If provided, dynamic option elements will be generated for these values. The value of each
    /// radio button will be the <see cref="KeyValuePair{TKey, TValue}.Key"/>, and the label will be
    /// the <see cref="KeyValuePair{TKey, TValue}.Value"/>.
    /// </para>
    /// </summary>
    [Parameter] public IEnumerable<KeyValuePair<TOption, string>>? OptionPairs { get; set; }

    /// <summary>
    /// <para>
    /// An optional enumeration of available options.
    /// </para>
    /// <para>
    /// If provided, dynamic option elements will be generated for these values.
    /// </para>
    /// <para>
    /// If <see cref="OptionTemplate"/> is not <see langword="null"/> it will be used to generate
    /// the content for each option. If it is <see langword="null"/>, they will contain the result
    /// of calling <see cref="object.ToString"/> on the value.
    /// </para>
    /// </summary>
    [Parameter] public IEnumerable<TOption>? Options { get; set; }

    /// <summary>
    /// A template for the content of dynamic options generated from the <see cref="Options"/>
    /// collection.
    /// </summary>
    [Parameter] public RenderFragment<TOption?>? OptionTemplate { get; set; }

    /// <summary>
    /// Whether the select is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// The tabindex of the select element.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("select")
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .Add("read-only", ReadOnly)
        .Add("field")
        .Add("shrink", ShrinkWhen)
        .Add("required", Required)
        .Add("open", ShowOptions)
        .ToString();

    private protected bool ShrinkWhen => !string.IsNullOrEmpty(CurrentValueAsString);

    private bool _canClear = false;
    private protected bool CanClear => Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && (!string.IsNullOrEmpty(CurrentValueAsString)
        || _canClear);

    private protected bool Clearable { get; set; }

    private protected bool HasFocus { get; set; }

    private protected virtual string? OptionListCssClass => new CssBuilder("list clickable dense")
        .Add((ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor).ToCSS())
        .ToString();

    private protected bool OptionsClosed { get; set; } = true;

    [Inject] private protected ScrollService ScrollService { get; set; } = default!;

    private protected int SelectedIndex { get; set; } = -1;

    private protected bool ShowOptions => HasFocus
        && !OptionsClosed;

    private protected string? TypedValue { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="SelectBase{TValue, TOption}"/>.
    /// </summary>
    protected SelectBase()
    {
        _focusTimer = new(ClearFocus, 200);
        _typeTimer = new(ClearTyped, 2000);
    }

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

    /// <summary>
    /// Called internally.
    /// </summary>
    public void Add(Option<TOption> option) => _options.Add(option);

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public virtual void Clear()
    {
        _canClear = false;
        CurrentValueAsString = null;
        SelectedIndex = -1;
    }

    /// <summary>
    /// Focuses this select.
    /// </summary>
    public async Task FocusAsync() => await ElementReference.FocusAsync();

    /// <summary>
    /// Determine whether the given value is currently selected.
    /// </summary>
    /// <param name="option">The value to check for selection.</param>
    /// <returns>
    /// <see langword="true"/> if the given value is currently selected; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public abstract bool IsSelected(TOption option);

    /// <summary>
    /// Called internally.
    /// </summary>
    public void Remove(Option<TOption> option) => _options.Remove(option);

    /// <summary>
    /// <para>
    /// Selects all options.
    /// </para>
    /// <para>
    /// Has no effect on single-select components.
    /// </para>
    /// </summary>
    public virtual void SelectAll() { }

    /// <summary>
    /// Adds the given <paramref name="value"/> to the currect selection.
    /// </summary>
    /// <param name="value">The value to add to the selection.</param>
    public abstract void SetValue(TOption? value);

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _focusTimer.Dispose();
                _typeTimer.Dispose();
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    private protected Task OnArrowDownAsync(KeyboardEventArgs e) => SelectIndexAsync(e, SelectedIndex + 1);

    private protected Task OnArrowUpAsync(KeyboardEventArgs e) => SelectIndexAsync(e, SelectedIndex - 1);

    private protected void OnClick() => OptionsClosed = !OptionsClosed;

    private protected void OnFocusIn()
    {
        _focusTimer.Cancel();
        HasFocus = true;
    }

    private protected void OnFocusOut() => _focusTimer.Start();

    private protected async Task OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        var key = e.Key.ToLowerInvariant();
        switch (key)
        {
            case "escape":
            case "tab":
                OptionsClosed = true;
                break;
            case "arrowdown":
                await OnArrowDownAsync(e);
                break;
            case "arrowup":
                await OnArrowUpAsync(e);
                break;
            case " ":
            case "enter":
                OptionsClosed = !OptionsClosed;
                break;
            case "a":
                if (e.CtrlKey)
                {
                    SelectAll();
                }
                else
                {
                    await OnTypeAsync(key);
                }
                break;
            default:
                if (key.Length == 1
                    && !e.AltKey
                    && !e.CtrlKey
                    && !e.MetaKey)
                {
                    await OnTypeAsync(key);
                }
                break;
        }
    }

    private protected virtual void OnTypeClosed(TOption? value) { }

    private protected abstract Task SelectIndexAsync(KeyboardEventArgs e, int index);

    private void ClearFocus()
    {
        HasFocus = false;
        OptionsClosed = true;
        StateHasChanged();
    }

    private void ClearTyped() => TypedValue = null;

    private async Task OnTypeAsync(string value)
    {
        TypedValue += value;

        foreach (var option in _options.Where(x => !x.Disabled))
        {
            var matched = false;
            if (MatchTypedText is null)
            {
                var matchText = string.IsNullOrEmpty(option.Label)
                    ? option.Value?.ToString()
                    : option.Label;
                matched = matchText?.Contains(TypedValue) == true;
            }
            else
            {
                matched = option.Value is not null
                    && MatchTypedText(TypedValue, option.Value);
            }
            if (matched)
            {
                if (ShowOptions)
                {
                    await option.ElementReference.FocusAsync();
                    await ScrollService.ScrollToId(option.Id);
                }
                else
                {
                    OnTypeClosed(option.Value);
                }
            }
        }

        _typeTimer.Start();
    }
}
