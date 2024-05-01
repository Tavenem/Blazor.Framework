using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A select component with a <see cref="DataGrid{TDataItem}"/> inside.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
/// <typeparam name="TValue">The type of bound value.</typeparam>
public partial class DataGridSelect<
    [DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicParameterlessConstructor
        | DynamicallyAccessedMemberTypes.PublicFields
        | DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem,
    TValue>
    : DataGridSelectBase<TDataItem, TValue, TValue>
{
    /// <summary>
    /// Constructs a new instance of <see cref="DataGridSelect{TDataItem, TValue}"/>.
    /// </summary>
    public DataGridSelect()
        => Clearable = typeof(TValue).IsClass
        || Nullable.GetUnderlyingType(typeof(TValue)) is not null;

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var oldValue = Value;

        await base.SetParametersAsync(parameters);

        if (((oldValue is null) != (Value is null))
            || oldValue?.Equals(Value) == false)
        {
            _valueUpdated = true;
        }
    }

    /// <inheritdoc/>
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Warning and workaround provided on JsonTypeInfo property.")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Warning and workaround provided on JsonTypeInfo property.")]
    protected override string? FormatValueAsString(TValue? value) => GetValueAsString(value);

    /// <inheritdoc/>
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Warning and workaround provided on JsonTypeInfo property.")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Warning and workaround provided on JsonTypeInfo property.")]
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
        else if (value is null)
        {
            success = true;
        }
        else if (JsonTypeInfo is null)
        {
            try
            {
                result = (TValue?)JsonSerializer.Deserialize(value, typeof(TDataItem));
                success = true;
            }
            catch
            {
                validationErrorMessage = GetConversionValidationMessage();
            }
        }
        else
        {
            try
            {
                result = JsonSerializer.Deserialize(value, JsonTypeInfo);
                success = true;
            }
            catch
            {
                validationErrorMessage = GetConversionValidationMessage();
            }
        }

        HasConversionError = !success;

        return success;
    }

    private protected override async Task UpdateSelectedFromValueAsync()
    {
        if (DataGrid is not null)
        {
            await DataGrid.SetSelectionAsync(RowValue, Value);
        }
        StateHasChanged();
    }

    private void UpdateCurrentValue()
    {
        if (DataGrid is null)
        {
            CurrentValue = default;
            return;
        }
        if (RowValue is null)
        {
            if (DataGrid.SelectedItem is null
                || !typeof(TValue).IsAssignableFrom(typeof(TDataItem)))
            {
                CurrentValue = default;
            }
            else
            {
                CurrentValue = (TValue)(object)DataGrid.SelectedItem;
            }
        }
        else if (DataGrid.SelectedItem is null)
        {
            CurrentValue = default;
        }
        else
        {
            CurrentValue = RowValue.Invoke(DataGrid.SelectedItem);
        }
    }
}