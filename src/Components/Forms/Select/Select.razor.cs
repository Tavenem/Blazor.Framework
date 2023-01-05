using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A select component.
/// </summary>
/// <typeparam name="TValue">
/// The type of bound value.
/// </typeparam>
public partial class Select<TValue> : SelectBase<TValue, TValue>
{
    /// <inheritdoc />
    protected override string? InputCssStyle => new CssBuilder(base.InputCssStyle)
        .AddStyle(
            "min-width",
            $"{Size ?? 0}ch",
            Size.HasValue)
        .AddStyle(
            "min-width",
            () => $"{Math.Max(MaxOptionSize, Options!.Max(OptionSize!))}ch",
            !Size.HasValue && OptionSize is not null && OptionTemplate is not null && Options?.Any() == true)
        .AddStyle(
            "min-width",
            () => $"{Math.Max(MaxOptionSize, Options!.Select(Labels!).Max(x => x?.Length ?? 0))}ch",
            !Size.HasValue && (OptionSize is null || OptionTemplate is null) && Labels is not null && Options?.Any() == true)
        .AddStyle(
            "min-width",
            () => $"{MaxOptionSize}ch",
            !Size.HasValue && (OptionSize is null || OptionTemplate is null) && (Labels is null || Options?.Any() != true))
        .ToString();

    /// <summary>
    /// Constructs a new instance of <see cref="Select{TValue}"/>.
    /// </summary>
    public Select() => Clearable = Nullable.GetUnderlyingType(typeof(TValue)) is not null
        || typeof(TValue).IsClass;

    /// <inheritdoc/>
    protected override string? FormatValueAsString(TValue? value)
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
        return base.FormatValueAsString(value);
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out TValue result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = default;
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
        else
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

        HasConversionError = !success;

        return success;
    }

    private protected override Task OnTypeClosedAsync(Option<TValue> option) => ToggleValueAsync(option);

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
            await ClearAsync();
            return;
        }

        if (!_options[index].Disabled)
        {
            await ToggleValueAsync(_options[index], false);
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
            await ClearAsync();
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
        CurrentValue = _selectedOptions.FirstOrDefault().Key;
        RefreshOptions();
    }

    private protected override void UpdateSelectedFromValue()
    {
        _selectedOptions.Clear();
        if (Value is not null)
        {
            var option = _options
                .FirstOrDefault(x => x.Value?.Equals(Value) == true);
            if (option is not null)
            {
                _selectedOptions.Add(new(option.Value, option.Label ?? Labels?.Invoke(option.Value) ?? option.Value?.ToString()));
            }
        }
        StateHasChanged();
    }
}