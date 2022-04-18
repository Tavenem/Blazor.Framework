using Microsoft.AspNetCore.Components;
using System.Linq.Expressions;
using System.Reflection;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A column for a <see cref="DataGrid{TDataItem}"/>
/// </summary>
/// <typeparam name="TDataItem">
/// The type of data item.
/// </typeparam>
[CascadingTypeParameter(nameof(TDataItem))]
public class Column<TDataItem> : ComponentBase, IDisposable where TDataItem : new()
{
    private Expression<Func<TDataItem, string>>? _defaultFilter;
    private string? _defaultLabel;
    private Func<TDataItem, object>? _defaultValue;
    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// The horizontal alignment of this column (applies to both header and data).
    /// </para>
    /// <para>
    /// Default is <see cref="HorizontalAlignment.None"/>, which is treated as <see
    /// cref="HorizontalAlignment.Left"/> for most content, but as <see
    /// cref="HorizontalAlignment.Right"/> for numbers, and <see cref="HorizontalAlignment.Center"/>
    /// for boolean values.
    /// </para>
    /// </summary>
    [Parameter] public HorizontalAlignment Alignment { get; set; }

    /// <summary>
    /// <para>
    /// The breakpoint at which this column is shown.
    /// </para>
    /// <para>
    /// Default is <see cref="Breakpoint.None"/>, which means it is always shown.
    /// </para>
    /// </summary>
    [Parameter] public Breakpoint Breakpoint { get; set; }

    /// <summary>
    /// <para>
    /// Whether the data in this column can be edited.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// <para>
    /// Ignored if the parent grid does not support editing.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If the data in a column cannot be edited, its cell will remain in read-only mode during
    /// inline edit operations. When performing an automatic dialog edit, the column's data will
    /// still be displayed in case its content is important for user context during the edit
    /// process, but it will be read-only.
    /// </remarks>
    [Parameter] public bool CanEdit { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether the data can be filtered by this column (i.e. searched).
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool CanFilter { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether this column's visibility may be toggled by the user when filtering columns.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool CanHide { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether the data can be sorted by this column.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool CanSort { get; set; } = true;

    /// <summary>
    /// An optional function which gets a CSS class for this column for a given data item (row).
    /// </summary>
    [Parameter] public Func<TDataItem, string?>? CellClass { get; set; }

    /// <summary>
    /// <para>
    /// Invoked after editing a call from this column to determine if the new value is valid.
    /// </para>
    /// <para>
    /// Receives the new value, and the complete data item (row) as parameters, and should return an
    /// enumeration of validation messages.
    /// </para>
    /// </summary>
    [Parameter] public Func<object?, TDataItem, IAsyncEnumerable<string>>? CellValidation { get; set; }

    /// <summary>
    /// <para>
    /// An optional template which displays the content of this column in a cell.
    /// </para>
    /// <para>
    /// It receives the full data item (row value) as its context parameter (i.e. <em>not</em> the
    /// result of the <see cref="Value"/> function).
    /// </para>
    /// <para>
    /// If omitted, the cell displays the result of <see cref="Value"/>.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<TDataItem>? ChildContent { get; set; }

    /// <summary>
    /// An optional CSS class for this column.
    /// </summary>
    [Parameter] public string? ColumnClass { get; set; }

    /// <summary>
    /// <para>
    /// Optional content to display when editing a cell for this column.
    /// </para>
    /// <para>
    /// This will be displayed in the cell during inline edit mode, and will also be inserted into
    /// the automatic edit dialog. It should usually be a single input component with its value
    /// bound to the displayed property.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<TDataItem>? EditContent { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> this column is included in exported data even if it is hidden.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool ExportHidden { get; set; }

    /// <summary>
    /// <para>
    /// Optional content for the footer of this column.
    /// </para>
    /// <para>
    /// Receives the entire set of current items as its context parameter. Note that this may not be
    /// all data items, if data is loaded from an external source, or is in a group.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<IEnumerable<TDataItem>>? FooterContent { get; set; }

    /// <summary>
    /// If the result of <see cref="Value"/> is <see cref="IFormattable"/>, this is supplied as the
    /// format parameter of <see cref="IFormattable.ToString(string?, IFormatProvider?)"/>.
    /// </summary>
    [Parameter] public string? Format { get; set; }

    /// <summary>
    /// If the result of <see cref="Value"/> is <see cref="IFormattable"/>, this is supplied as the
    /// formatProvider parameter of <see cref="IFormattable.ToString(string?, IFormatProvider?)"/>.
    /// </summary>
    [Parameter] public IFormatProvider? FormatProvider { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the filter value of this column for a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, and <see cref="Property"/> is the name of a gettable
    /// property of the data item, that property's value will be retrieved and <see
    /// cref="object.ToString"/> will be invoked on it. If <see cref="Property"/> is also <see
    /// langword="null"/> or cannot be resolved to a value, no filtering will be possible for the
    /// column.
    /// </para>
    /// </summary>
    /// <remarks>
    /// The filter value should be a string (possibly concatenated from various properties) which
    /// will be checked against a search term. If the string contains the search term, the data item
    /// will be considered a match for this column.
    /// </remarks>
    [Parameter] public Expression<Func<TDataItem, string>>? FilterBy { get; set; }

    /// <summary>
    /// <para>
    /// Whether this column is currently displayed.
    /// </para>
    /// <para>
    /// Note: does not reflect column hiding via <see cref="Breakpoint"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool IsShown { get; set; } = true;

    /// <summary>
    /// <para>
    /// The header for this column.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> (and <see cref="LabelContent"/> is not provided), the name of
    /// <see cref="Property"/> is used (converted to a human-readable format).
    /// </para>
    /// <para>
    /// Note: this is still used even if <see cref="LabelContent"/> is set, to set the label for
    /// the column filter dialog, and for input components in automatic edit dialogs.
    /// </para>
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// Header content for this column.
    /// </summary>
    [Parameter] public RenderFragment? LabelContent { get; set; }

    /// <summary>
    /// <para>
    /// The name of the property on the object which this column represents.
    /// </para>
    /// <para>
    /// May be <see langword="null"/> for columns which are not data-bound.
    /// </para>
    /// </summary>
    [Parameter] public string? Property { get; set; }

    /// <summary>
    /// <para>
    /// A function which sets a new value for this column when editing.
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, and <see cref="Property"/> is the name of a settable
    /// property of the data item, that property's value will be set. If <see cref="Property"/> is
    /// also <see langword="null"/> or cannot be assigned the provided value, nothing will happen
    /// after an edit.
    /// </para>
    /// </summary>
    [Parameter] public Action<TDataItem, object?>? SetValue { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the sort value of this column for a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, <see cref="Value"/> is used.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, object>? SortBy { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the value of this column for a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, and <see cref="Property"/> is the name of a gettable
    /// property of the data item, that property's value will be retrieved. If <see
    /// cref="Property"/> is also <see langword="null"/> or cannot be resolved to a value, no value
    /// will be set for the column.
    /// </para>
    /// </summary>
    [Parameter] public Func<TDataItem, object>? Value { get; set; }

    internal string? ActualLabel => Label ?? _defaultLabel;

    private bool _actualIsShown = true;
    internal bool ActualIsShown
    {
        get => _actualIsShown && IsShown;
        set => _actualIsShown = value;
    }

    internal PropertyInfo? ActualProperty { get; set; }

    internal Func<TDataItem, object>? ActualSortBy => SortBy ?? Value ?? _defaultValue;

    internal Func<TDataItem, object>? ActualValue => Value ?? _defaultValue;

    internal string AlignClass
    {
        get
        {
            if (Alignment == HorizontalAlignment.None)
            {
                if (IsNumeric)
                {
                    return "text-right";
                }
                return BaseDataType == typeof(bool)
                    ? "text-center"
                    : "text-start";
            }
            return Alignment switch
            {
                HorizontalAlignment.Left => "text-left",
                HorizontalAlignment.Center => "text-center",
                HorizontalAlignment.End => "text-end",
                HorizontalAlignment.Right => "text-right",
                _ => "text-start",
            };
        }
    }

    internal Type BaseDataType { get; private set; } = typeof(object);

    internal string? ColumnCssClass => new CssBuilder(ColumnClass)
        .Add($"column-{Breakpoint.ToCSS()}", Breakpoint != Breakpoint.None)
        .ToString();

    internal string? CurrentFilter { get; set; }

    internal Type DataType { get; private set; } = typeof(object);

    internal Func<TDataItem, string, bool>? FilterExpression { get; private set; }

    internal bool IsDefault { get; set; }

    internal bool IsNullable { get; private set; }

    internal bool IsNumeric { get; private set; }

    internal bool SortDescending { get; set; }

    [CascadingParameter] private DataGrid<TDataItem>? DataGrid { get; set; }

    /// <inheritdoc/>
    protected override void OnInitialized() => DataGrid?.AddColumn(this);

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<string>(nameof(Property), out var property))
        {
            SetProperty(property);
        }

        await base.SetParametersAsync(parameters);

        if (parameters.TryGetValue<string>(nameof(FilterBy), out _))
        {
            SetFilter();
        }

        if (parameters.TryGetValue<bool>(nameof(IsShown), out _))
        {
            DataGrid?.InvokeStateChange();
        }
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    internal void OnSetValue(TDataItem item, object? value)
    {
        if (SetValue is not null)
        {
            SetValue(item, value);
            return;
        }
        if (ActualProperty is null)
        {
            return;
        }
        try
        {
            ActualProperty.SetValue(item, value);
        }
        catch { }
    }

    internal string? ToString(TDataItem item)
    {
        var value = ActualValue?.Invoke(item);

        if (value is IFormattable formattable)
        {
            if (string.IsNullOrEmpty(Format) && IsNumeric)
            {
                if (BaseDataType == typeof(decimal)
                    || BaseDataType == typeof(double)
                    || BaseDataType == typeof(float))
                {
                    return formattable.ToString("G3", FormatProvider);
                }
                else
                {
                    return formattable.ToString("N0", FormatProvider);
                }
            }
            return formattable.ToString(Format, FormatProvider);
        }

        return value?.ToString();
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                DataGrid?.RemoveColumn(this);
            }

            _disposedValue = true;
        }
    }

    private void SetDefaults()
    {
        if (ActualProperty is null)
        {
            _defaultFilter = null;
            _defaultValue = null;
            BaseDataType = typeof(object);
            DataType = typeof(object);
            IsNullable = false;
            IsNumeric = false;
            return;
        }

        DataType = ActualProperty.PropertyType;
        var nullableType = Nullable.GetUnderlyingType(DataType);
        IsNullable = nullableType is not null;
        var targetType = nullableType ?? DataType;
        BaseDataType = targetType;

        IsNumeric = targetType == typeof(byte)
            || targetType == typeof(decimal)
            || targetType == typeof(double)
            || targetType == typeof(float)
            || targetType == typeof(int)
            || targetType == typeof(long)
            || targetType == typeof(nint)
            || targetType == typeof(nuint)
            || targetType == typeof(sbyte)
            || targetType == typeof(short)
            || targetType == typeof(uint)
            || targetType == typeof(ulong)
            || targetType == typeof(ushort);

        _defaultLabel = ActualProperty.Name.ToHumanReadable();

        var parameter = Expression.Parameter(typeof(TDataItem), "x");
        var field = Expression.Convert(
            Expression.Property(parameter, ActualProperty),
            typeof(object));
        _defaultValue = Expression
            .Lambda<Func<TDataItem, object>>(field, parameter)
            .Compile();

        var methodInfo = typeof(TDataItem).GetMethod(nameof(object.ToString), Type.EmptyTypes);
        if (methodInfo is null)
        {
            _defaultFilter = null;
            return;
        }
        var toString = Expression.Call(
            Expression.Property(parameter, ActualProperty),
            methodInfo);
        _defaultFilter = Expression.Lambda<Func<TDataItem, string>>(toString, parameter);
    }

    private void SetFilter()
    {
        var filterBy = FilterBy ?? _defaultFilter;
        if (filterBy is null)
        {
            FilterExpression = null;
            return;
        }

        var method = typeof(string).GetMethod(nameof(string.Equals));
        if (method is null)
        {
            FilterExpression = null;
            return;
        }

        var parameterX = Expression.Parameter(typeof(TDataItem), "x");

        var condition = Expression.Call(
            method,
            Expression.Invoke(filterBy, parameterX),
            Expression.Parameter(typeof(string), "y"));

        FilterExpression = Expression
            .Lambda<Func<TDataItem, string, bool>>(condition, parameterX)
            .Compile();
    }

    private void SetProperty(string? property)
    {
        if (string.IsNullOrEmpty(property))
        {
            _defaultFilter = null;
            _defaultValue = null;
            ActualProperty = null;
            BaseDataType = typeof(object);
            DataType = typeof(object);
            IsNullable = false;
            IsNumeric = false;
            return;
        }

        var propertyInfo = typeof(TDataItem).GetProperty(property);
        if (propertyInfo is null)
        {
            _defaultFilter = null;
            _defaultValue = null;
            ActualProperty = null;
            BaseDataType = typeof(object);
            DataType = typeof(object);
            IsNullable = false;
            IsNumeric = false;
            return;
        }

        ActualProperty = propertyInfo;
        SetDefaults();
    }
}