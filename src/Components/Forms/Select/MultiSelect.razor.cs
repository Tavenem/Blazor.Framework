using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A multiselect select component.
/// </summary>
/// <typeparam name="TValue">
/// The type of bound value.
/// </typeparam>
public partial class MultiSelect<TValue> : SelectBase<IEnumerable<TValue>, TValue>
{
    private readonly object _selectAll = new();

    /// <summary>
    /// Whether this select allows multiple selections.
    /// </summary>
    protected override bool IsMultiselect => true;

    /// <inheritdoc />
    protected override string? InputCssStyle => new CssBuilder(base.InputCssStyle)
        .AddStyle(
            "min-width",
            $"{(Size ?? 0) + 2 + (_options.Count - 1).ToString("N0").Length}ch",
            Size.HasValue)
        .AddStyle(
            "min-width",
            () => $"{Math.Max(MaxOptionSize, Options!.Max(OptionSize!)) + 2 + (_options.Count - 1).ToString("N0").Length}ch",
            !Size.HasValue && OptionSize is not null && OptionTemplate is not null && Options?.Any() == true)
        .AddStyle(
            "min-width",
            () => $"{Math.Max(MaxOptionSize, Options!.Select(Labels!).Max(x => x.Length)) + 2 + (_options.Count - 1).ToString("N0").Length}ch",
            !Size.HasValue && (OptionSize is null || OptionTemplate is null) && Labels is not null && Options?.Any() == true)
        .AddStyle(
            "min-width",
            () => $"{MaxOptionSize + 2 + (_options.Count - 1).ToString("N0").Length}ch",
            !Size.HasValue && (OptionSize is null || OptionTemplate is null) && (Labels is null || Options?.Any() != true))
        .ToString();

    private Option<TValue>? SelectAllOption { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="MultiSelect{TValue}"/>.
    /// </summary>
    public MultiSelect() => Clearable = true;

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var oldValue = Value;

        await base.SetParametersAsync(parameters);

        if (((oldValue is null) != (Value is null))
            || (oldValue is not null
            && Value is not null
            && !oldValue.SequenceEqual(Value)))
        {
            _valueUpdated = true;
        }
    }

    /// <inheritdoc/>
    public override async Task ClearAsync()
    {
        await base.ClearAsync();
        if (SelectAllOption is not null)
        {
            SelectAllOption.InvokeStateChange();
        }
    }

    /// <summary>
    /// Selects all options.
    /// </summary>
    public override async Task SelectAllAsync()
    {
        if (AllSelected)
        {
            await ClearAsync();
            return;
        }

        var count = _selectedOptions.Count;
        foreach (var option in _options
            .Where(x => !x.IsSelectAll
            && !IsSelected(x.Value)))
        {
            _selectedOptions.Add(new(option.Value, option.Label ?? Labels?.Invoke(option.Value) ?? option.Value?.ToString()));
        }
        if (_selectedOptions.Count != count)
        {
            UpdateCurrentValue();
            SelectedIndex = _options.Count - 1;
        }
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(IEnumerable<TValue>? value)
    {
        if (Converter is not null)
        {
            if (value is null)
            {
                return null;
            }

            var list = new List<string?>();
            foreach (var item in value)
            {
                if (Converter.TrySetValue(item, out var input))
                {
                    list.Add(input);
                }
            }

            if (list.Count == 0)
            {
                return "[]";
            }

            var sb = new StringBuilder("[\"")
                .Append(JsonEncodedText.Encode(list[0] ?? string.Empty))
                .Append('"');
            for (var i = 1; i < list.Count; i++)
            {
                sb.Append(", \"");
                sb.Append(JsonEncodedText.Encode(list[i] ?? string.Empty));
                sb.Append('"');
            }

            sb.Append(']');
            return sb.ToString();
        }
        return base.FormatValueAsString(value);
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out IEnumerable<TValue> result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        validationErrorMessage = null;
        var success = false;

        if (string.IsNullOrEmpty(value))
        {
            result = Enumerable.Empty<TValue>();
            success = true;
        }
        else if (Converter is not null)
        {
            result = Enumerable.Empty<TValue>();

            var reader = new Utf8JsonReader(Encoding.UTF8.GetBytes(value));
            if (JsonDocument.TryParseValue(ref reader, out var doc)
                && doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                var list = new List<TValue>();
                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    if (Converter.TryGetValue(item.ToString(), out var itemResult)
                        && itemResult is not null)
                    {
                        list.Add(itemResult);
                    }
                }
                result = list;
                success = true;
            }
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

        if (!IsTouched
            && (((result is null) != (InitialValue is null))
            || (InitialValue is not null && result?.SequenceEqual(InitialValue) != true)
            || HasConversionError))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && (HasConversionError
            || (Validation is not null
            && (((result is null) != (CurrentValue is null))
            || (CurrentValue is not null && result?.SequenceEqual(CurrentValue) != true)))))
        {
            EvaluateDebounced();
        }

        return success;
    }

    private protected override async Task SelectIndexAsync(KeyboardEventArgs e, int index)
    {
        if (index < 0)
        {
            index = _options.Count - 1;
        }
        else if (index >= _options.Count)
        {
            index = 0;
        }

        if (index < 0 || index >= _options.Count)
        {
            return;
        }

        SelectedIndex = index;

        if (e.CtrlKey)
        {
            if (ShowPicker)
            {
                await _options[index].ElementReference.FocusAsync();
                await ScrollService.ScrollToId(_options[index].Id);
            }
            return;
        }

        if (!_options[index].Disabled)
        {
            if (!e.ShiftKey)
            {
                _selectedOptions.Clear();
            }

            await ToggleValueAsync(_options[index]);
            if (PopoverOpen)
            {
                await TogglePopoverAsync();
            }
        }

        if (ShowPicker)
        {
            await _options[index].ElementReference.FocusAsync();
            await ScrollService.ScrollToId(_options[index].Id);
        }
    }

    private protected override async Task SelectItemAsync(Option<TValue>? option)
    {
        var index = option is null
            ? -1
            : _options.IndexOf(option);
        if (index == -1)
        {
            return;
        }

        SelectedIndex = index;

        if (!_options[index].Disabled)
        {
            _selectedOptions.Clear();
            await ToggleValueAsync(_options[index], false);
        }

        if (ShowPicker)
        {
            await _options[index].ElementReference.FocusAsync();
            await ScrollService.ScrollToId(_options[index].Id);
        }
    }

    private protected override void UpdateCurrentValue()
    {
        CurrentValue = SelectedValues;
        RefreshOptions();
    }

    private protected override void UpdateSelectedFromValue()
    {
        _selectedOptions.Clear();
        if (Value is not null)
        {
            foreach (var value in Value)
            {
                var option = _options
                    .FirstOrDefault(x => x.Value?.Equals(value) == true);
                if (option is not null)
                {
                    _selectedOptions.Add(new(option.Value, option.Label ?? Labels?.Invoke(option.Value) ?? option.Value?.ToString()));
                }
            }
        }
        StateHasChanged();
    }
}