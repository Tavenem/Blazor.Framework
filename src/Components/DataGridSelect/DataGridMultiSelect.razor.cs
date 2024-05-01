using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A multiselect select component with a <see cref="DataGrid{TDataItem}"/> inside.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
/// <typeparam name="TValue">The type of bound value.</typeparam>
public partial class DataGridMultiSelect<
    [DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicParameterlessConstructor
        | DynamicallyAccessedMemberTypes.PublicFields
        | DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem,
    TValue>
    : DataGridSelectBase<TDataItem, IEnumerable<TValue>, TValue>
{
    /// <summary>
    /// JSON serialization metadata about the bound value type.
    /// </summary>
    /// <remarks>
    /// This is used to (de)serialize a collection of bound values to and from a string for the
    /// <c>value</c> attribute of the underlying HTML <c>input</c> element. If omitted, the
    /// reflection-based JSON serializer will be used, which is not trim safe or AOT-compilation
    /// compatible.
    /// </remarks>
    [Parameter] public JsonTypeInfo<IEnumerable<TValue>>? ListJsonTypeInfo { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="DataGridMultiSelect{TDataItem, TValue}"/>.
    /// </summary>
    public DataGridMultiSelect() => Clearable = true;

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

    /// <summary>
    /// Selects all options.
    /// </summary>
    public Task SelectAllAsync() => DataGrid?.SelectAllAsync() ?? Task.CompletedTask;

    /// <inheritdoc/>
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Warning and workaround provided on JsonTypeInfo property.")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Warning and workaround provided on JsonTypeInfo property.")]
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
        if (JsonTypeInfo is null)
        {
            return JsonSerializer.Serialize(value);
        }
        else
        {
            return JsonSerializer.Serialize(value, JsonTypeInfo);
        }
    }

    /// <inheritdoc/>
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Warning and workaround provided on ListJsonTypeInfo property.")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Warning and workaround provided on ListJsonTypeInfo property.")]
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out IEnumerable<TValue> result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = default;
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
        else if (ListJsonTypeInfo is null)
        {
            try
            {
                result = (IEnumerable<TValue>?)JsonSerializer.Deserialize(value, typeof(IEnumerable<TValue>));
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
                result = JsonSerializer.Deserialize(value, ListJsonTypeInfo);
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
            await DataGrid.SetSelectionAsync(RowValue, Value?.ToList());
        }
        StateHasChanged();
    }

    private void UpdateCurrentValue()
    {
        if (DataGrid is null)
        {
            CurrentValue = [];
            return;
        }
        if (RowValue is null)
        {
            if (typeof(TValue).IsAssignableFrom(typeof(TDataItem)))
            {
                CurrentValue = DataGrid.SelectedItems.Cast<TValue>();
            }
            else
            {
                CurrentValue = [];
            }
        }
        else
        {
            CurrentValue = DataGrid
                .SelectedItems
                .Select(RowValue.Invoke)
                .Where(x => x is not null)
                .Cast<TValue>();
        }
    }
}