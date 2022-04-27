using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A select component.
/// </summary>
/// <typeparam name="TValue">
/// The type of bound value.
/// </typeparam>
public partial class Select<TValue>
{
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

        if (!IsTouched
            && (!EqualityComparer<TValue>.Default.Equals(result, InitialValue)
            || HasConversionError))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && (HasConversionError
            || (Validation is not null
            && !EqualityComparer<TValue>.Default.Equals(result, CurrentValue))))
        {
            EvaluateDebounced();
        }

        return success;
    }

    private protected override void OnTypeClosed(Option<TValue> option) => ToggleValue(option);

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
            ToggleValue(_options[index]);
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