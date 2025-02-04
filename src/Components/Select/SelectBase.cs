using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Services;

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
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ValueChangeEventArgs))]
public abstract class SelectBase<TValue, TOption>()
    : PickerComponentBase<TValue>, ISelect<TOption>
{
    private protected readonly List<Option<TOption>> _options = [];
    private protected readonly List<KeyValuePair<TOption?, string?>> _selectedOptions = [];

    private protected bool _valueUpdated;

    /// <summary>
    /// Whether all (non-<see langword="null"/>) options are currently selected.
    /// </summary>
    public bool AllSelected => _options
        .Where(x => x.Value is not null)
        .All(x => SelectedValues.Contains(x.Value));

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
    /// Custom CSS class(es) for the inner input element (may be a hidden element).
    /// </summary>
    [Parameter] public string? InputClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the inner input element (may be a hidden element).
    /// </summary>
    [Parameter] public string? InputStyle { get; set; }

    /// <summary>
    /// A function to retrieve labels for the values in <see cref="Options"/>.
    /// </summary>
    [Parameter] public Func<TOption?, string?>? Labels { get; set; }

    /// <summary>
    /// <para>
    /// If provided, this function receives the text a user types when the select has focus, and a
    /// candidate value, and should return a boolean indicating whether that value matches the input
    /// text.
    /// </para>
    /// <para>
    /// Simple string matching is attempted first, using the labels of the options. Only if no match
    /// is found for the current search text will this function be invoked to determine if a match
    /// exists based on logic other than item labels.
    /// </para>
    /// </summary>
    [Parameter] public Func<string, TOption, bool>? MatchTypedText { get; set; }

    /// <summary>
    /// <para>
    /// An optional enumeration of available options, with labels.
    /// </para>
    /// <para>
    /// If provided, dynamic option elements will be generated for these values. The value of each
    /// option will be the <see cref="KeyValuePair{TKey, TValue}.Key"/>, and the label will be the
    /// <see cref="KeyValuePair{TKey, TValue}.Value"/>.
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
    [Parameter] public RenderFragment<TOption>? OptionTemplate { get; set; }

    /// <summary>
    /// <para>
    /// The currently selected values.
    /// </para>
    /// <para>
    /// This list contains only distinct values, even if multiple options with identical values are
    /// currently selected.
    /// </para>
    /// <para>
    /// This list also omits <see langword="null"/> values, even if some selected options contain a
    /// <see langword="null"/> value.
    /// </para>
    /// </summary>
    public IEnumerable<TOption> SelectedValues => _selectedOptions
        .Select(x => x.Key)
        .Distinct()
        .Where(x => x is not null)
        .Cast<TOption>();

    /// <summary>
    /// An optional function which determines the size of options provided by the <see
    /// cref="OptionTemplate"/> property.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This function is not utilized for <see cref="OptionPairs"/>: an automatic determination is
    /// made using the length of the resulting strings.
    /// </para>
    /// <para>
    /// This function is ignored if the <see cref="Size"/> property is provided.
    /// </para>
    /// </remarks>
    [Parameter] public Func<TOption, int>? OptionSize { get; set; }

    /// <summary>
    /// The maximum number of characters which the select should show. Its minimum size will be set
    /// to allow this number of characters.
    /// </summary>
    /// <remarks>
    /// When this property is not set, <see cref="OptionSize"/> will be used. If that property is
    /// also unset, an automatic determination will be made. In the event that no automatic minimum
    /// width can be determined, the select will be a minimum width.
    /// </remarks>
    [Parameter] public int? Size { get; set; }

    /// <summary>
    /// Whether the containing HTML form element (if any) should be submitted when a value is
    /// selected. Default is <see langword="false"/>.
    /// </summary>
    /// <remarks>
    /// Even when <see langword="true"/>, the form will not be submitted if the value of the
    /// selected option is null or empty. This prevents unintended form submissions when selecting a
    /// placeholder option (e.g. "Pick a value").
    /// </remarks>
    [Parameter] public bool SubmitOnSelect { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("select")
        .Add("clearable", ShowClear)
        .Add("clearable-readonly", ShowClear)
        .ToString();

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected virtual string? InputCssClass => InputClass;

    /// <summary>
    /// The final value assigned to the input element's style attribute.
    /// </summary>
    protected virtual string? InputCssStyle => InputStyle;

    /// <summary>
    /// Whether this select allows multiple selections.
    /// </summary>
    protected virtual bool IsMultiselect => false;

    private protected int MaxOptionSize { get; set; }

    private protected virtual string? OptionListCssClass => new CssBuilder("option-list list clickable dense")
        .Add((ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor).ToCSS())
        .ToString();

    private protected int SelectedIndex { get; set; } = -1;

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var oldValue = Value;

        await base.SetParametersAsync(parameters);

        if (((oldValue is null) != (Value is null))
            || oldValue?.Equals(Value) == false)
        {
            _valueUpdated = true;
        }
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

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if ((firstRender || _valueUpdated)
            && _options.Count > 0)
        {
            _valueUpdated = false;
            UpdateSelectedFromValue();
        }
        await base.OnAfterRenderAsync(firstRender);
    }

    /// <summary>
    /// Called internally.
    /// </summary>
    public void Add(Option<TOption> option)
    {
        _options.Add(option);
        MaxOptionSize = Math.Max(
            MaxOptionSize,
            (option.Label
                ?? GetOptionValueAsString(option)
                ?? option.Value?.ToString())?
                .Length
                ?? 0);
        StateHasChanged();
    }

    /// <inheritdoc/>
    public override Task ClearAsync()
    {
        _selectedOptions.Clear();
        CurrentValueAsString = null;
        SelectedIndex = -1;
        _options.ForEach(x => x.InvokeStateChange());
        StateHasChanged();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Converts the given <paramref name="option"/> to its equivalent value as a string.
    /// </summary>
    /// <param name="option">The <see cref="Option{T}"/> to convert.</param>
    /// <returns>The string which represents the value of <paramref name="option"/>.</returns>
    public abstract string? GetOptionValueAsString(Option<TOption>? option);

    /// <summary>
    /// Determine whether the given value is currently selected.
    /// </summary>
    /// <param name="option">The value to check for selection.</param>
    /// <returns>
    /// <see langword="true"/> if the given value is currently selected; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public bool IsSelected(TOption? option)
    {
        if (option is null)
        {
            return _selectedOptions.Any(x => x.Key is null);
        }
        return _selectedOptions.Any(x => x.Key is not null && x.Key.Equals(option));
    }

    /// <summary>
    /// Called internally.
    /// </summary>
    public void Remove(Option<TOption> option)
    {
        _options.Remove(option);
        MaxOptionSize = _options.Count == 0
            ? 0
            : _options.Max(x => (x.Label
                ?? GetOptionValueAsString(x)
                ?? x.Value?.ToString())?
                .Length
                ?? 0);
    }

    /// <summary>
    /// <para>
    /// Selects all options.
    /// </para>
    /// <para>
    /// Has no effect on single-select components.
    /// </para>
    /// </summary>
    public virtual Task SelectAllAsync() => Task.CompletedTask;

    /// <summary>
    /// Toggle the given option's selected state.
    /// </summary>
    /// <param name="option">The option to toggle.</param>
    public void ToggleValue(Option<TOption> option)
    {
        SelectedIndex = _options.IndexOf(option);
        if (IsSelected(option.Value))
        {
            _selectedOptions.RemoveAll(x => option.Value is null ? x.Key is null : x.Key?.Equals(option.Value) == true);
        }
        else
        {
            if (!IsMultiselect)
            {
                _selectedOptions.Clear();
            }
            _selectedOptions.Add(new(option.Value, option.Label ?? Labels?.Invoke(option.Value) ?? option.Value?.ToString()));
        }
        UpdateCurrentValue();
    }

    private protected void OnPickerValueChange(ValueChangeEventArgs e)
    {
        CurrentValueAsString = e.Value;
        UpdateSelectedFromValue();
        RefreshOptions();
    }

    private protected async Task OnSearchInputAsync(ValueChangeEventArgs e)
    {
        if (MatchTypedText is null
            || string.IsNullOrWhiteSpace(e.Value))
        {
            _options.ForEach(x => x.SearchNonmatch = false);
            return;
        }

        foreach (var option in _options)
        {
            if (option.Value is not null
                && MatchTypedText(e.Value, option.Value))
            {
                option.SearchNonmatch = false;

                if (option.Disabled)
                {
                    continue;
                }

                await SelectItemAsync(option);
            }
            else
            {
                option.SearchNonmatch = true;
            }
        }
    }

    private protected void RefreshOptions()
    {
        _options.ForEach(x => x.InvokeStateChange());
        StateHasChanged();
    }

    private protected abstract Task SelectItemAsync(Option<TOption> option);

    private protected abstract void UpdateCurrentValue();

    private protected abstract void UpdateSelectedFromValue();
}
