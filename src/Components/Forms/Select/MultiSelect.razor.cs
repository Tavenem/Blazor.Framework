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
public partial class MultiSelect<TValue>
{
    private readonly object _selectAll = new();
    private readonly HashSet<TValue> _selectedValues = new();

    /// <summary>
    /// Whether all options are currently selected.
    /// </summary>
    public override bool AllSelected => _selectedValues
        .SetEquals(_options
            .Select(x => x.Value)
            .Where(x => x is not null)
            .Cast<TValue>());

    /// <summary>
    /// The text displayed in the input.
    /// </summary>
    protected string? DisplayString
    {
        get
        {
            if (Value?.Any() != true)
            {
                return null;
            }
            var count = Value.Count();
            if (count == 1)
            {
                return GetValueAsString(Value.First());
            }
            var sb = new StringBuilder(GetValueAsString(Value.First()))
                .Append(" +")
                .AppendFormat("N0", count);
            return sb.ToString();
        }
    }

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected string? InputCssClass => new CssBuilder(InputClass)
        .Add("input-core")
        .ToString();

    private protected override string? OptionListCssClass => new CssBuilder(base.OptionListCssClass)
        .Add("")
        .ToString();

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public override void Clear()
    {
        _selectedValues.Clear();
        base.Clear();
    }

    /// <summary>
    /// Determine whether the given value is currently selected.
    /// </summary>
    /// <param name="option">The value to check for selection.</param>
    /// <returns>
    /// <see langword="true"/> if the given value is currently selected; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public override bool IsSelected(TValue option) => Value?.Contains(option) == true;

    /// <summary>
    /// Selects all options.
    /// </summary>
    public override void SelectAll()
    {
        var all = new HashSet<TValue>();
        foreach (var option in _options)
        {
            if (option.Value is not null)
            {
                all.Add(option.Value);
            }
        }
        CurrentValue = all;
        SelectedIndex = _options.Count - 1;
    }

    /// <summary>
    /// Adds the given <paramref name="value"/> to the currect selection.
    /// </summary>
    /// <param name="value">The value to add to the selection.</param>
    public override void SetValue(TValue? value)
    {
        if (value is null)
        {
            return;
        }

        if (_selectedValues.Contains(value))
        {
            _selectedValues.Remove(value);
        }
        else
        {
            _selectedValues.Add(value);
            SelectedIndex = value is null
                ? -1
                : _options.FindIndex(x => x.Value?.Equals(value) == true);
        }

        CurrentValue = _selectedValues;
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

        if (Converter is not null)
        {
            if (value is null)
            {
                result = Enumerable.Empty<TValue>();
                success = true;
            }
            else
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
            if (ShowOptions)
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
                _selectedValues.Clear();
            }
            SetValue(_options[index].Value, index);
        }

        if (ShowOptions)
        {
            await _options[index].ElementReference.FocusAsync();
            await ScrollService.ScrollToId(_options[index].Id);
        }
    }

    private string? GetValueAsString(TValue? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }
        return value?.ToString();
    }

    private void SetValue(TValue? value, int index)
    {
        if (value is null)
        {
            return;
        }

        if (_selectedValues.Contains(value))
        {
            _selectedValues.Remove(value);
        }
        else
        {
            _selectedValues.Add(value);
            SelectedIndex = index;
        }

        CurrentValue = _selectedValues;
    }
}