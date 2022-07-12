using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Text;

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
public abstract class SelectBase<TValue, TOption> : PickerComponentBase<TValue>, ISelect<TOption>
{
    private protected readonly List<Option<TOption>> _options = new();
    private protected readonly List<KeyValuePair<TOption?, string?>> _selectedOptions = new();
    private readonly AdjustableTimer _typeTimer;

    private protected bool _valueUpdated;
    private bool _disposedValue;

    /// <summary>
    /// Whether all (non-<see langword="null"/>) options are currently selected.
    /// </summary>
    public bool AllSelected => _options
        .Where(x => x.Value is not null)
        .All(x => SelectedValues.Contains(x.Value));

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

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
    /// A function to retrieve labels for the values in <see cref="Options"/>.
    /// </summary>
    [Parameter] public Func<TOption?, string>? Labels { get; set; }

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

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("select")
        .ToString();

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected override string? DisplayString
    {
        get
        {
            if (_selectedOptions.Count == 0)
            {
                return null;
            }

            var first = _selectedOptions[0].Value;
            if (_selectedOptions.Count == 1)
            {
                return first;
            }

            var sb = new StringBuilder(first);
            if (sb.Length > 0)
            {
                sb.Append(" +")
                    .Append((_selectedOptions.Count - 1).ToString("N0"));
            }
            else
            {
                sb.Append(_selectedOptions.Count.ToString("N0"));
            }

            return sb.ToString();
        }
    }

    /// <summary>
    /// Whether this select allows multiple selections.
    /// </summary>
    protected virtual bool IsMultiselect => false;

    private protected override bool CanClear => AllowClear
        && Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && _selectedOptions.Count > 0;

    private protected virtual string? OptionListCssClass => new CssBuilder("list clickable dense")
        .Add((ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor).ToCSS())
        .ToString();

    [Inject] private protected ScrollService ScrollService { get; set; } = default!;

    private protected int SelectedIndex { get; set; } = -1;

    private protected string? TypedValue { get; set; }

    private protected override List<KeyOptions> KeyOptions { get; set; } = new()
    {
        new()
        {
            Key = "/^(?!Tab$)/",
            SubscribeDown = true,
            PreventDown = "any",
        },
        new()
        {
            Key = "Tab",
            SubscribeDown = true,
        }
    };

    /// <summary>
    /// Constructs a new instance of <see cref="SelectBase{TValue, TOption}"/>.
    /// </summary>
    protected SelectBase() => _typeTimer = new(ClearTyped, 2000);

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var oldValue = Value;

        await base.SetParametersAsync(parameters);

        if (((oldValue is null) != (Value is null))
            || (oldValue is not null
            && Value is not null
            && !oldValue.Equals(Value)))
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
    protected override void OnAfterRender(bool firstRender)
    {
        if ((firstRender || _valueUpdated)
            && _options.Count > 0)
        {
            _valueUpdated = false;
            UpdateSelectedFromValue();
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
    public override Task ClearAsync()
    {
        _selectedOptions.Clear();
        CurrentValueAsString = null;
        SelectedIndex = -1;
        return Task.CompletedTask;
    }

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
    public virtual void Remove(Option<TOption> option) => _options.Remove(option);

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
    public Task ToggleValueAsync(Option<TOption> option)
        => ToggleValueAsync(option, true);

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _typeTimer.Dispose();
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    private protected Task OnArrowDownAsync(KeyboardEventArgs e) => SelectIndexAsync(e, SelectedIndex + 1);

    private protected Task OnArrowUpAsync(KeyboardEventArgs e) => SelectIndexAsync(e, SelectedIndex - 1);

    private protected override async void OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        switch (e.Key)
        {
            case "Escape":
            case "Tab":
                if (PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "Delete":
                if (CanClear)
                {
                    await ClearAsync();
                }
                break;
            case "ArrowDown":
                await OnArrowDownAsync(e);
                break;
            case "ArrowUp":
                await OnArrowUpAsync(e);
                break;
            case " ":
            case "Enter":
                await TogglePopoverAsync();
                break;
            case "a":
                if (e.CtrlKey)
                {
                    await SelectAllAsync();
                }
                else
                {
                    await OnTypeAsync(e.Key);
                }
                break;
            default:
                if (e.Key.Length == 1
                    && !e.AltKey
                    && !e.CtrlKey
                    && !e.MetaKey)
                {
                    await OnTypeAsync(e.Key);
                }
                break;
        }
    }

    private protected virtual Task OnTypeClosedAsync(Option<TOption> option) => Task.CompletedTask;

    private protected void RefreshOptions()
    {
        _options.ForEach(x => x.InvokeStateChange());
        StateHasChanged();
    }

    private protected abstract Task SelectIndexAsync(KeyboardEventArgs e, int index);

    private protected abstract Task SelectItemAsync(Option<TOption> option);

    private protected async Task ToggleValueAsync(Option<TOption> option, bool close)
    {
        if (PopoverOpen && close)
        {
            await TogglePopoverAsync();
        }
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

    private protected abstract void UpdateCurrentValue();

    private protected abstract void UpdateSelectedFromValue();

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
                if (ShowPicker)
                {
                    await option.ElementReference.FocusAsync();
                    await ScrollService.ScrollToId(option.Id);
                    await SelectItemAsync(option);
                }
                else
                {
                    await OnTypeClosedAsync(option);
                }
            }
        }

        _typeTimer.Start();
    }
}
