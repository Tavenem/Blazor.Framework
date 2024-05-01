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
    public override string? GetOptionValueAsString(Option<TValue>? option) => FormatValueAsString(option is null ? default : option.Value);

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
            ToggleValue(_options[index]);
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