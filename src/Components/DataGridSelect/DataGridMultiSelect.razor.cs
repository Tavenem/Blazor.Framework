using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;
using Tavenem.Blazor.Framework.Components.DataGrid;

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
    : IDataGrid<TDataItem>
{
    private readonly List<IColumn<TDataItem>> _columns = new();
    private readonly List<Guid> _initialSortOrder = new();

    private bool _initialized, _valueUpdated;

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

    private protected override bool CanClear => AllowClear
        && Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && Interactive
        && DataGrid?.SelectedItems.Count > 0;

    private protected DataGrid<TDataItem>? DataGrid { get; set; }

    private protected override List<KeyOptions> InputKeyOptions { get; set; } = new()
    {
        new()
        {
            Key = "/ |a/",
            SubscribeDown = true,
            PreventDown = "key+none",
            TargetOnly = true,
        }
    };

    private protected override List<KeyOptions> KeyOptions { get; set; } = new()
    {
        new()
        {
            Key = "/ArrowDown|ArrowUp|Delete|Enter|Escape/",
            SubscribeDown = true,
            PreventDown = "key+none",
        }
    };

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
    /// Selects all options.
    /// </summary>
    public Task SelectAllAsync() => DataGrid?.SelectAllAsync() ?? Task.CompletedTask;

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
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "The potential breakage is accepted; it is up to implementers to enure that the selected value type is preserved.")]
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
        return JsonSerializer.Serialize(value);
    }

    /// <inheritdoc/>
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "The potential breakage is accepted; it is up to implementers to enure that the selected data type is preserved.")]
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
            result = Enumerable.Empty<TValue>();
            success = true;
        }
        else if (Converter is not null)
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
        else
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

        HasConversionError = !success;

        return success;
    }

    private protected override async void OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly || !Interactive)
        {
            return;
        }

        switch (e.Key)
        {
            case "ArrowDown":
                if (e.AltKey)
                {
                    if (!PopoverOpen)
                    {
                        await TogglePopoverAsync();
                    }
                }
                else
                {
                    await OnArrowDownAsync();
                }
                break;
            case "ArrowUp":
                if (e.AltKey)
                {
                    if (PopoverOpen)
                    {
                        await TogglePopoverAsync();
                    }
                }
                else
                {
                    await OnArrowUpAsync();
                }
                break;
            case "Delete":
                if (CanClear)
                {
                    await ClearAsync();
                }
                break;
            case " ":
            case "Enter":
                await TogglePopoverAsync();
                break;
            case "Escape":
                if (PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "a":
                if (e.CtrlKey)
                {
                    await SelectAllAsync();
                }
                break;
        }
    }

    private Task OnArrowDownAsync() => DataGrid?.SelectNext() ?? Task.CompletedTask;

    private Task OnArrowUpAsync() => DataGrid?.SelectPrevious() ?? Task.CompletedTask;

    private async Task UpdateSelectedFromValueAsync()
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
            CurrentValue = Enumerable.Empty<TValue>();
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
                CurrentValue = Enumerable.Empty<TValue>();
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