using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A multiselect select component with a <see cref="DataGrid{TDataItem}"/> inside.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
public partial class DataGridMultiSelect<TDataItem> where TDataItem : notnull
{
    /// <inheritdoc/>
    protected override string? FormatValueAsString(IEnumerable<TDataItem>? value)
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
        return JsonSerializer.Serialize(value);
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out IEnumerable<TDataItem> result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = default;
        validationErrorMessage = null;
        var success = false;

        if (string.IsNullOrEmpty(value))
        {
            result = Enumerable.Empty<TDataItem>();
            success = true;
        }
        else if (Converter is not null)
        {
            result = Enumerable.Empty<TDataItem>();

            var reader = new Utf8JsonReader(Encoding.UTF8.GetBytes(value));
            if (JsonDocument.TryParseValue(ref reader, out var doc)
                && doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                var list = new List<TDataItem>();
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
        else
        {
            try
            {
                result = (IEnumerable<TDataItem>?)JsonSerializer.Deserialize(value, typeof(IEnumerable<TDataItem>));
                success = true;
            }
            catch
            {
                validationErrorMessage = GetConversionValidationMessage();
            }
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

    private protected override Task OnArrowDownAsync() => DataGrid?.SelectNext() ?? Task.CompletedTask;

    private protected override Task OnArrowUpAsync() => DataGrid?.SelectPrevious() ?? Task.CompletedTask;

    private protected override async Task UpdateSelectedFromValueAsync()
    {
        if (DataGrid is not null)
        {
            await DataGrid.SetSelectionAsync(Value?.ToList());
        }
        StateHasChanged();
    }

    private void UpdateCurrentValue()
    {
        if (DataGrid is null)
        {
            CurrentValue = Enumerable.Empty<TDataItem>();
            return;
        }
        CurrentValue = DataGrid.SelectedItems;
    }
}