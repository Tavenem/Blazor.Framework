using Microsoft.AspNetCore.Components;
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
public partial class MultiSelect<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue>
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
            () => $"{Math.Max(MaxOptionSize, Options!.Select(Labels!).Max(x => x?.Length ?? 0)) + 2 + (_options.Count - 1).ToString("N0").Length}ch",
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
        SelectAllOption?.InvokeStateChange();

        StateHasChanged();
    }

    /// <inheritdoc/>
    public override string? GetOptionValueAsString(Option<TValue>? option) => FormatSingleValueAsString(option is null ? default : option.Value);

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

    /// <summary>
    /// Formats a single value as a string. Derived classes can override this to determine
    /// the formatting used for <see cref="GetOptionValueAsString"/>.
    /// </summary>
    /// <param name="value">The value to format.</param>
    /// <returns>A string representation of the value.</returns>
    protected virtual string? FormatSingleValueAsString(TValue? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }
        if (typeof(TValue) == typeof(bool))
        {
            return (bool)(object)value! ? "true" : "false";
        }
        else if (typeof(TValue) == typeof(bool?))
        {
            return value is not null && (bool)(object)value ? "true" : "false";
        }
        return value?.ToString();
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
            result = [];
            success = true;
        }
        else if (Converter is not null)
        {
            result = [];

            var reader = new Utf8JsonReader(Encoding.UTF8.GetBytes(value));
            if (JsonDocument.TryParseValue(ref reader, out var doc))
            {
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
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
                else if (Converter.TryGetValue(doc.RootElement.ToString(), out var itemResult)
                    && itemResult is not null)
                {
                    result = [itemResult];
                    success = true;
                }
            }
        }
        else if (value.TryParseSelectableValue(out result))
        {
            success = true;
        }
        else
        {
            result = [];

            var reader = new Utf8JsonReader(Encoding.UTF8.GetBytes(value));
            if (JsonDocument.TryParseValue(ref reader, out var doc))
            {
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    var list = new List<TValue>();
                    foreach (var item in doc.RootElement.EnumerateArray())
                    {
                        if (item.ToString().TryParseSelectableValue<TValue>(out var itemResult)
                            && itemResult is not null)
                        {
                            list.Add(itemResult);
                        }
                    }
                    result = list;
                    success = true;
                }
                else if (doc.RootElement.ToString().TryParseSelectableValue<TValue>(out var itemResult)
                    && itemResult is not null)
                {
                    result = [itemResult];
                    success = true;
                }
            }
            else
            {
                validationErrorMessage = GetConversionValidationMessage();
            }
        }

        HasConversionError = !success;

        return success;
    }

    private protected override Task SelectItemAsync(Option<TValue>? option)
    {
        var index = option is null
            ? -1
            : _options.IndexOf(option);
        if (index == -1)
        {
            return Task.CompletedTask;
        }

        SelectedIndex = index;

        if (!_options[index].Disabled)
        {
            _selectedOptions.Clear();
            ToggleValue(_options[index]);
        }

        return Task.CompletedTask;
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