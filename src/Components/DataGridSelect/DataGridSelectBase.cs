using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using Tavenem.Blazor.Framework.Components.DataGrid;
using Tavenem.Blazor.Framework.InternalComponents.DataGrid;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for <see cref="DataGrid{TDataItem}"/> select components.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
/// <typeparam name="TValue">The type of bound value.</typeparam>
/// <typeparam name="TValueItem">The type of individual bound value items.</typeparam>
public abstract class DataGridSelectBase<
    [DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicParameterlessConstructor
        | DynamicallyAccessedMemberTypes.PublicFields
        | DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem,
    TValue,
    TValueItem>
    : PickerComponentBase<TValue>, IDataGridSelect<TDataItem>
{
    private protected readonly List<IColumn<TDataItem>> _columns = [];
    private protected readonly List<Guid> _initialSortOrder = [];

    private protected bool _initialized, _valueUpdated;

    /// <summary>
    /// <para>
    /// The converter used to convert bound values to option values, and vice versa.
    /// </para>
    /// <para>
    /// Built-in components have reasonable default converters for most data types, but you
    /// can supply your own for custom data.
    /// </para>
    /// </summary>
    [Parameter] public InputValueConverter<TValueItem>? Converter { get; set; }

    /// <summary>
    /// <para>
    /// A function to obtain a label from a data item.
    /// </para>
    /// <para>
    /// If omitted, the <see cref="object.ToString"/> method will be invoked on the item.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, string?>? ItemLabel { get; set; }

    /// <summary>
    /// <para>
    /// The current set of items.
    /// </para>
    /// <para>
    /// Note that this may not represent the complete set of data, if the data is retrieved via <see
    /// cref="LoadItems"/>.
    /// </para>
    /// </summary>
    [Parameter] public List<TDataItem> Items { get; set; } = [];

    /// <summary>
    /// JSON serialization metadata about the bound value type.
    /// </summary>
    /// <remarks>
    /// This is used to (de)serialize the bound value to and from a string for the <c>value</c>
    /// attribute of the underlying HTML <c>input</c> element. If omitted, the reflection-based JSON
    /// serializer will be used, which is not trim safe or AOT-compilation compatible.
    /// </remarks>
    [Parameter] public JsonTypeInfo<TValueItem>? JsonTypeInfo { get; set; }

    /// <summary>
    /// A function to load data items asynchronously.
    /// </summary>
    [Parameter, NotNull] public Func<DataGridRequest, Task<DataPage<TDataItem>>>? LoadItems { get; set; }

    /// <summary>
    /// <para>
    /// The maximum number of items to show on each page.
    /// </para>
    /// <para>
    /// Default is 5.
    /// </para>
    /// </summary>
    [Parameter] public ushort RowsPerPage { get; set; } = 5;

    /// <summary>
    /// <para>
    /// A function which retrieves the value of a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, and <typeparamref name="TValue"/> is the same as
    /// <typeparamref name="TDataItem"/>, the data item itself will automatically be used.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, TValueItem?>? RowValue { get; set; }

    /// <summary>
    /// The maximum number of characters which the select should show. Its minimum size will be set
    /// to allow this number of characters.
    /// </summary>
    /// <remarks>
    /// When this property is not set, the select will be a minimum width.
    /// </remarks>
    [Parameter] public int? Size { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("select")
        .ToString();

    /// <inheritdoc />
    protected override string? InputCssStyle => new CssBuilder(base.InputCssStyle)
        .AddStyle(
            "min-width",
            $"{Size ?? 0}ch",
            Size.HasValue)
        .AddStyle(
            "min-width",
            () => $"{Items.Select(ItemLabel!).Max(x => x?.Length ?? 0)}ch",
            !Size.HasValue && ItemLabel is not null && Items.Count > 0)
        .ToString();

    /// <summary>
    /// The nested <see cref="DataGrid{TDataItem}"/>.
    /// </summary>
    private protected DataGrid<TDataItem>? DataGrid { get; set; }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (Converter is not null)
        {
            if (Format?.Equals(Converter.Format) != true)
            {
                Converter.Format = Format;
            }
            if (FormatProvider?.Equals(Converter.FormatProvider) != true)
            {
                Converter.FormatProvider = FormatProvider;
            }
        }
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);
        if (DataGrid is not null)
        {
            foreach (var column in DataGrid.Columns.Except(_columns).ToList())
            {
                DataGrid.RemoveColumn(column);
            }
            foreach (var column in _columns.Except(DataGrid.Columns).ToList())
            {
                DataGrid.AddColumn(column);
            }
        }
        if (firstRender)
        {
            _initialized = true;
            if (DataGrid is not null)
            {
                foreach (var id in _initialSortOrder)
                {
                    await DataGrid.OnColumnSortedAsync(id);
                }
            }
        }
        if (_valueUpdated && DataGrid?.AnyItems == true)
        {
            _valueUpdated = false;
            await UpdateSelectedFromValueAsync();
        }
    }

    /// <summary>
    /// Adds a new column to this grid.
    /// </summary>
    /// <param name="column">The column to add.</param>
    public void AddColumn(IColumn<TDataItem> column) => _columns.Add(column);

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public override async Task ClearAsync()
    {
        if (DataGrid is not null)
        {
            await DataGrid.SetSelectionAsync(null);
        }
        CurrentValueAsString = null;

        StateHasChanged();
    }

    /// <inheritdoc/>
    public string? GetRowValueAsString(Row<TDataItem>? row)
    {
        if (row is null)
        {
            return null;
        }

        string? value = null;
        if (RowValue is not null)
        {
            value = GetValueAsString(RowValue.Invoke(row.Item));
        }
        else if (typeof(TValue).IsAssignableFrom(typeof(TDataItem)))
        {
            value = GetValueAsString((TValueItem)(object)row.Item);
        }

        return value
            ?? (row.Item is IFormattable formattable
                ? formattable.ToString(Format, FormatProvider)
                : row.Item.ToString());
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
    public string? GetValueAsString(TValueItem? value)
    {
        if (Converter is not null
            && Converter.TrySetValue(value, out var input))
        {
            return input;
        }
        if (value is null)
        {
            return string.Empty;
        }
        else if (JsonTypeInfo is null)
        {
            return JsonSerializer.Serialize(value);
        }
        else
        {
            return JsonSerializer.Serialize(value, JsonTypeInfo);
        }
    }

    /// <summary>
    /// Notifies the grid that its state has been changed externally.
    /// </summary>
    public void InvokeStateChange() => DataGrid?.InvokeStateChange();

    /// <summary>
    /// Determine whether the given item is currently selected.
    /// </summary>
    /// <param name="item">The item to check for selection.</param>
    /// <returns>
    /// <see langword="true"/> if the given item is currently selected; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public bool IsSelected(TDataItem item)
        => DataGrid?.SelectedItems.Contains(item) == true;

    /// <summary>
    /// Loads the current set of asynchronous data.
    /// </summary>
    public Task LoadItemsAsync() => DataGrid?.LoadItemsAsync() ?? Task.CompletedTask;

    /// <summary>
    /// Called internally.
    /// </summary>
    public async Task OnColumnSortedAsync(IColumn<TDataItem> column)
    {
        if (!_initialized)
        {
            _initialSortOrder.Remove(column.Id);
            _initialSortOrder.Add(column.Id);
            return;
        }
        if (DataGrid is not null)
        {
            await DataGrid.OnColumnSortedAsync(column);
        }
    }

    /// <summary>
    /// Removes a column from this grid.
    /// </summary>
    /// <param name="column">The column to remove.</param>
    public void RemoveColumn(IColumn<TDataItem> column) => _columns.Remove(column);

    /// <summary>
    /// Called internally.
    /// </summary>
    public async Task SetFilterAsync(bool preventReload = false)
    {
        if (_initialized && DataGrid is not null)
        {
            await DataGrid.SetFilterAsync(preventReload);
        }
    }

    /// <summary>
    /// Toggle the given item's selected state.
    /// </summary>
    /// <param name="item">The item to toggle.</param>
    public async Task ToggleValueAsync(TDataItem item)
    {
        if (DataGrid is not null)
        {
            await DataGrid.ToggleSelectionAsync(item);
        }
    }

    private protected async Task OnPickerValueChangeAsync(ValueChangeEventArgs e)
    {
        CurrentValueAsString = e.Value;
        await UpdateSelectedFromValueAsync();
    }

    private protected abstract Task UpdateSelectedFromValueAsync();
}
