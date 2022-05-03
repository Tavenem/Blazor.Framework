using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A select component with a <see cref="DataGrid{TDataItem}"/> inside.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
public partial class DataGridSelect<TDataItem> where TDataItem : notnull
{
    /// <inheritdoc/>
    protected override string? FormatValueAsString(TDataItem? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }
        return JsonSerializer.Serialize(value);
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out TDataItem result,
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
        else if (value is null)
        {
            success = true;
        }
        else
        {
            try
            {
                result = (TDataItem?)JsonSerializer.Deserialize(value, typeof(TDataItem));
                success = true;
            }
            catch
            {
                validationErrorMessage = GetConversionValidationMessage();
            }
        }

        HasConversionError = !success;

        if (!IsTouched
            && (!EqualityComparer<TDataItem>.Default.Equals(result, InitialValue)
            || HasConversionError))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && (HasConversionError
            || (Validation is not null
            && !EqualityComparer<TDataItem>.Default.Equals(result, CurrentValue))))
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
            await DataGrid.SetSelectionAsync(Value);
        }
        StateHasChanged();
    }

    private async Task UpdateCurrentValueAsync()
    {
        if (PopoverOpen)
        {
            await TogglePopoverAsync();
        }
        if (DataGrid is null)
        {
            CurrentValue = default;
            return;
        }
        CurrentValue = DataGrid.SelectedItem;
    }
}