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

    /// <summary>
    /// Determine whether the given value is currently selected.
    /// </summary>
    /// <param name="option">The value to check for selection.</param>
    /// <returns>
    /// <see langword="true"/> if the given value is currently selected; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public override bool IsSelected(TValue option) => Value?.Equals(option) == true;

    /// <summary>
    /// Adds the given <paramref name="value"/> to the currect selection.
    /// </summary>
    /// <param name="value">The value to add to the selection.</param>
    public override void SetValue(TValue? value)
    {
        OptionsClosed = true;
        CurrentValue = value;
        SelectedIndex = value is null
            ? -1
            : _options.FindIndex(x => x.Value?.Equals(value) == true);
    }

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

    private protected override void OnTypeClosed(TValue? value) => SetValue(value);

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
            SetValue(default);
            return;
        }

        if (_options[index].Disabled)
        {
            SelectedIndex = index;
        }
        else
        {
            SetValue(_options[index].Value, index);
        }
        if (ShowOptions)
        {
            await _options[index].ElementReference.FocusAsync();
            await ScrollService.ScrollToId(_options[index].Id);
        }
    }

    private void SetValue(TValue? value, int index)
    {
        OptionsClosed = true;
        CurrentValue = value;
        SelectedIndex = index;
    }
}