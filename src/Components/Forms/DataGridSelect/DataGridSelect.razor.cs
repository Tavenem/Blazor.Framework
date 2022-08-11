using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;
using Tavenem.Blazor.Framework.Components.DataGrid;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A select component with a <see cref="DataGrid{TDataItem}"/> inside.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
/// <typeparam name="TValue">The type of bound value.</typeparam>
public partial class DataGridSelect<TDataItem, TValue> : IDataGrid<TDataItem>
{
    private readonly List<IColumn<TDataItem>> _columns = new();
    private readonly List<Guid> _initialSortOrder = new();

    private bool _initialized;
    private bool _valueUpdated;

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// <para>
    /// The converter used to convert bound values to option values, and vice versa.
    /// </para>
    /// <para>
    /// Built-in components have reasonable default converters for most data types, but you
    /// can supply your own for custom data.
    /// </para>
    /// </summary>
    [Parameter] public InputValueConverter<TValue>? Converter { get; set; }

    /// <summary>
    /// <para>
    /// A function to obtain a label from a data item.
    /// </para>
    /// <para>
    /// If omitted, the <see cref="object.ToString"/> method will be invoked on the item.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, string>? ItemLabel { get; set; }

    /// <summary>
    /// <para>
    /// The current set of items.
    /// </para>
    /// <para>
    /// Note that this may not represent the complete set of data, if the data is retrieved via <see
    /// cref="LoadItems"/>.
    /// </para>
    /// </summary>
    [Parameter] public List<TDataItem> Items { get; set; } = new();

    /// <summary>
    /// A function to load data items asynchronously.
    /// </summary>
    [Parameter, NotNull] public Func<DataGridRequest, Task<DataPage<TDataItem>>>? LoadItems { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the value of a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, and <typeparamref name="TValue"/> is the same as
    /// <typeparamref name="TDataItem"/>, the data item itself will automatically be used.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, TValue?>? RowValue { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("select")
        .ToString();

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected override string? DisplayString
    {
        get
        {
            if (DataGrid is null
                || DataGrid.SelectedItems.Count == 0)
            {
                return null;
            }

            var first = DataGrid.SelectedItems[0];
            var firstLabel = ItemLabel?.Invoke(first)
                ?? (first is IFormattable formattable
                ? formattable.ToString(Format, FormatProvider)
                : first?.ToString());
            if (DataGrid.SelectedItems.Count == 1)
            {
                return firstLabel;
            }

            var sb = new StringBuilder(firstLabel);
            if (sb.Length > 0)
            {
                sb.Append(" +")
                    .Append((DataGrid.SelectedItems.Count - 1).ToString("N0"));
            }
            else
            {
                sb.Append(DataGrid.SelectedItems.Count.ToString("N0"));
            }

            return sb.ToString();
        }
    }

    private protected override bool CanClear => AllowClear
        && Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && DataGrid?.SelectedItems.Count > 0;

    private protected DataGrid<TDataItem>? DataGrid { get; set; }

    private protected override List<KeyOptions> KeyOptions { get; set; } = new()
    {
        new()
        {
            Key = "Escape",
            SubscribeDown = true,
            PreventDown = "key+none",
        },
        new()
        {
            Key = "/ArowDown|ArrowUp|Delete| |Enter/",
            SubscribeDown = true,
            PreventDown = "key+none",
            TargetOnly = true,
        }
    };

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
            || (oldValue is not null
            && Value is not null
            && !oldValue.Equals(Value)))
        {
            _valueUpdated = true;
        }
    }

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
    /// Toggle the given item's selected state.
    /// </summary>
    /// <param name="item">The item to toggle.</param>
    public async Task ToggleValueAsync(TDataItem item)
    {
        if (PopoverOpen)
        {
            await TogglePopoverAsync();
        }
        if (DataGrid is not null)
        {
            await DataGrid.ToggleSelectionAsync(item);
        }
    }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(TValue? value)
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
        else
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

    private protected override async void OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        switch (e.Key)
        {
            case "Escape":
                if (PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "Delete":
                if (CanClear)
                {
                    await ClearAsync();
                }
                break;
            case "ArrowDown":
                await OnArrowDownAsync();
                break;
            case "ArrowUp":
                await OnArrowUpAsync();
                break;
            case " ":
            case "Enter":
                await TogglePopoverAsync();
                break;
        }
    }

    private Task OnArrowDownAsync() => DataGrid?.SelectNext() ?? Task.CompletedTask;

    private Task OnArrowUpAsync() => DataGrid?.SelectPrevious() ?? Task.CompletedTask;

    private async Task UpdateSelectedFromValueAsync()
    {
        if (DataGrid is not null)
        {
            await DataGrid.SetSelectionAsync(RowValue, Value);
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
        if (RowValue is null)
        {
            if (DataGrid.SelectedItem is null
                || !typeof(TValue).IsAssignableFrom(typeof(TDataItem)))
            {
                CurrentValue = default;
            }
            else
            {
                CurrentValue = (TValue?)(object?)DataGrid.SelectedItem;
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