using Microsoft.AspNetCore.Components;
using System.Linq.Expressions;
using System.Reflection;
using Tavenem.Blazor.Framework.Components.DataGrid;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A column for a <see cref="DataGrid{TDataItem}"/>
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
/// <typeparam name="TValue">
/// <para>
/// The type of value.
/// </para>
/// <para>
/// Assign <see cref="object"/> if you provide custom <see cref="ChildContent"/>.
/// </para>
/// </typeparam>
[CascadingTypeParameter(nameof(TValue))]
public class Column<TDataItem, TValue> : ComponentBase, IColumn<TDataItem> where TDataItem : notnull
{
    private Action<TDataItem, TValue?>? _defaultSetValue;
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
    /// The current boolean value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have <see cref="bool"/> value types.
    /// </para>
    /// </summary>
    public bool? BoolFilter { get; set; }

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
    /// <para>
    /// Only columns of type <see cref="string"/>, <see cref="bool"/>, a date/time type or a numeric
    /// type can be filtered.
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
    [Parameter] public Func<TValue?, TDataItem, IAsyncEnumerable<string>>? CellValidation { get; set; }

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
    /// The current <see cref="DateTimeOffset"/> value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have date/time value types.
    /// </para>
    /// </summary>
    public DateTimeOffset? DateTimeFilter { get; set; }

    /// <summary>
    /// <para>
    /// Whether the current <see cref="DateTimeFilter"/> refers to a date/time that all values
    /// should be equal to or before (rather than equal to or after).
    /// </para>
    /// <para>
    /// Ignored for columns that do not have date/time value types, or a non-<see langword="null"/>
    /// <see cref="DateTimeFilter"/>.
    /// </para>
    /// </summary>
    public bool DateTimeFilterIsBefore { get; set; }

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
    /// Gets a unique id for this column.
    /// </summary>
    public Guid Id { get; } = Guid.NewGuid();

    /// <summary>
    /// Gets whether this column represents boolean data.
    /// </summary>
    public bool IsBool { get; private set; }

    /// <summary>
    /// Gets whether this column represents date/time data.
    /// </summary>
    public bool IsDateTime { get; private set; }

    /// <summary>
    /// Gets whether this column was generated by reflection (vs. manually).
    /// </summary>
    public bool IsDefault { get; internal set; }

    /// <summary>
    /// Gets whether this column represents an enum data type.
    /// </summary>
    public bool IsEnum { get; private set; }

    /// <summary>
    /// Gets whether this column represents a floating-point numeric data type.
    /// </summary>
    public bool IsFloat { get; private set; }

    /// <summary>
    /// Gets whether this column represents a nullable data type.
    /// </summary>
    public bool IsNullable { get; private set; }

    /// <summary>
    /// Gets whether this column represents a numeric data type.
    /// </summary>
    public bool IsNumeric { get; private set; }

    /// <summary>
    /// When set to <see langword="true"/> for a column whose <see cref="Value"/> is of type <see
    /// cref="string"/>, a universal search box will appear in the data table header which includes
    /// this column in its filter.
    /// </summary>
    [Parameter] public bool IsQuickFilter { get; set; }

    private bool _isShown = true;
    /// <summary>
    /// Whether this column is currently displayed.
    /// </summary>
    [Parameter] public bool IsShown { get; set; } = true;

    /// <summary>
    /// Gets whether this column represents string data.
    /// </summary>
    public bool IsString { get; private set; }

    /// <summary>
    /// <para>
    /// The header for this column.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> (and <see cref="LabelContent"/> is not provided), and <see
    /// cref="Value"/> is a simple property or field accessor, the name of the property is used
    /// (converted to a human-readable format).
    /// </para>
    /// <para>
    /// Note: this is still used even if <see cref="LabelContent"/> is set, to set the label for the
    /// column filter dialog, and for input components in automatic edit dialogs.
    /// </para>
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// Header content for this column.
    /// </summary>
    [Parameter] public RenderFragment? LabelContent { get; set; }

    /// <summary>
    /// <para>
    /// The name of the member (property or field) to which this column is bound (if any).
    /// </para>
    /// <para>
    /// This property is not set directly. It is inferred via <see cref="Value"/>.
    /// </para>
    /// </summary>
    public string? MemberName { get; private set; }

    /// <summary>
    /// <para>
    /// The current numeric value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have numeric value types.
    /// </para>
    /// </summary>
    public double? NumberFilter { get; set; }

    /// <summary>
    /// <para>
    /// A function which sets a new value for this column when editing.
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, and <see cref="Value"/> is a simple property or field
    /// accessor which has a public setter, that property's value will be set. Otherwise, editing
    /// will not be enabled for this column.
    /// </para>
    /// </summary>
    [Parameter] public Action<TDataItem, TValue?>? SetValue { get; set; }

    /// <summary>
    /// Gets whether this column is currently sorted in descending order.
    /// </summary>
    public bool SortDescending { get; set; }

    /// <summary>
    /// <para>
    /// The current string value by which this column is filtered.
    /// </para>
    /// <para>
    /// Ignored for columns that do not have <see cref="string"/> value types.
    /// </para>
    /// </summary>
    public string? TextFilter { get; set; }

    /// <summary>
    /// <para>
    /// A function which retrieves the value of this column for a given data item (row).
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, and <see cref="Value"/> is a simple property or field
    /// accessor which has a public setter, that property's value will be retrieved. Otherwise this
    /// column will not be bound to a value (although it may still display content, if <see
    /// cref="ChildContent"/> has been set).
    /// </para>
    /// </summary>
    [Parameter] public Expression<Func<TDataItem, TValue?>>? Value { get; set; }

    private Action<TDataItem, TValue?>? ActualSetValue => SetValue ?? _defaultSetValue;

    private Func<TDataItem, TValue?>? ActualValue { get; set; }

    [CascadingParameter] private IDataGrid<TDataItem>? DataGrid { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="Column{TDataItem, TValue}"/>.
    /// </summary>
    public Column() { }

    internal Column(PropertyInfo property)
    {
        IsDefault = true;

        if (property.PropertyType != typeof(TValue))
        {
            throw new ArgumentException($"{nameof(property)} was the wrong type", nameof(property));
        }
        var parameter = Expression.Parameter(typeof(TDataItem));
        Value = (Expression<Func<TDataItem, TValue?>>)Expression.Lambda(
            Expression.GetFuncType(typeof(TDataItem), property.PropertyType),
            Expression.Property(
                parameter,
                property),
            parameter);
        ParseValue(Value);
    }

    internal Column(FieldInfo field)
    {
        IsDefault = true;

        if (field.FieldType != typeof(TValue))
        {
            throw new ArgumentException($"{nameof(field)} was the wrong type", nameof(field));
        }
        var parameter = Expression.Parameter(typeof(TDataItem));
        Value = (Expression<Func<TDataItem, TValue?>>)Expression.Lambda(
            Expression.GetFuncType(typeof(TDataItem), field.FieldType),
            Expression.Field(
                parameter,
                field),
            parameter);
        ParseValue(Value);
    }

    /// <inheritdoc/>
    protected override void OnInitialized()
    {
        DataGrid?.AddColumn(this);
        _isShown = IsShown;
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<Action<TDataItem, TValue?>?>(nameof(SetValue), out var setValue))
        {
            _defaultSetValue = setValue;
        }

        if (parameters.TryGetValue<Expression<Func<TDataItem, TValue?>>?>(nameof(Value), out var value)
            && value != Value)
        {
            ParseValue(value);
        }

        var resort = false;
        var reload = false;
        var stateChange = false;
        if (DataGrid is not null)
        {
            if (parameters.TryGetValue<bool>(nameof(SortDescending), out var sortDescending)
                && sortDescending != SortDescending)
            {
                resort = true;
            }
            else if ((parameters.TryGetValue<bool?>(nameof(BoolFilter), out var boolFilter)
                && boolFilter != BoolFilter)
                || (parameters.TryGetValue<DateTimeOffset?>(nameof(DateTimeFilter), out var dateTimeFilter)
                && dateTimeFilter != DateTimeFilter)
                || (parameters.TryGetValue<double?>(nameof(NumberFilter), out var numberFilter)
                && numberFilter != NumberFilter)
                || (parameters.TryGetValue<string?>(nameof(TextFilter), out var textFilter)
                && textFilter != TextFilter))
            {
                reload = true;
            }
            else if (parameters.TryGetValue<bool>(nameof(IsShown), out var isShown)
                && isShown != IsShown)
            {
                _isShown = isShown;
                stateChange = true;
            }
        }

        await base.SetParametersAsync(parameters);

        if (DataGrid is null)
        {
            return;
        }
        if (resort)
        {
            await DataGrid.OnColumnSortedAsync(this);
        }
        else if (reload)
        {
            await DataGrid.LoadItemsAsync();
        }
        else if (stateChange)
        {
            DataGrid.InvokeStateChange();
        }
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// <para>
    /// Gets the data type of this column.
    /// </para>
    /// <para>
    /// If the type is nullable, returns the underlying type.
    /// </para>
    /// </summary>
    public Type GetBaseDataType() => Nullable.GetUnderlyingType(typeof(TValue)) ?? typeof(TValue);

    /// <summary>
    /// Gets whether this column can be edited.
    /// </summary>
    public bool GetCanEdit() => ActualSetValue is not null
        && CanEdit;

    /// <summary>
    /// Gets the value of a cell in this column for a given data item (row), as an <see
    /// cref="object"/>.
    /// </summary>
    public object? GetCellObjectValue(TDataItem item) => ActualValue is null || item is null
        ? default
        : ActualValue(item);

    /// <summary>
    /// Gets the value of a cell in this column for a given data item (row).
    /// </summary>
    public TValue? GetCellValue(TDataItem item) => ActualValue is null || item is null
        ? default
        : ActualValue(item);

    /// <summary>
    /// Gets whether this column should be displayed.
    /// </summary>
    /// <returns>
    /// <see langword="true"/> if this column should be displayed; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public bool GetIsShown() => _isShown;

    /// <summary>
    /// Gets the current sortability of this column.
    /// </summary>
    /// <returns>
    /// <see langword="true"/> if this column can be sorted; otherwise <see langword="false"/>.
    /// </returns>
    public bool GetIsSortable() => CanSort
        && ActualValue is not null
        && MemberName is not null;

    /// <summary>
    /// Gets a label for this column.
    /// </summary>
    public string? GetLabel() => Label ?? MemberName.ToHumanReadable();

    /// <summary>
    /// Sets the value of a cell in this column to a given value.
    /// </summary>
    /// <param name="item">The data item (row) whose value should be set.</param>
    /// <param name="value">The value to assign.</param>
    /// <remarks>
    /// <para>
    /// Has no effect if <see cref="SetValue"/> is <see langword="null"/> and an automatic setter
    /// could not be inferred from <see cref="Value"/>.
    /// </para>
    /// <para>
    /// Also has no effect if <paramref name="value"/> is not of type <typeparamref name="TValue"/>,
    /// and is not <see langword="null"/>.
    /// </para>
    /// </remarks>
    public void SetCellObjectValue(TDataItem item, object? value)
    {
        if (item is null
            || ActualSetValue is null)
        {
            return;
        }
        if (value is TValue tValue)
        {
            ActualSetValue(item, tValue);
        }
        else if (value is null)
        {
            ActualSetValue(item, default);
        }
    }

    /// <summary>
    /// Sets the value of a cell in this column to a given value.
    /// </summary>
    /// <param name="item">The data item (row) whose value should be set.</param>
    /// <param name="value">The value to assign.</param>
    /// <remarks>
    /// Has no effect if <see cref="SetValue"/> is <see langword="null"/> and an automatic setter
    /// could not be inferred from <see cref="Value"/>.
    /// </remarks>
    public void SetCellValue(TDataItem item, TValue? value)
    {
        if (item is null
            || ActualSetValue is null)
        {
            return;
        }
        ActualSetValue(item, value);
    }

    /// <summary>
    /// Sets this column's manual shown/hidden value.
    /// </summary>
    /// <param name="value">Whether the column should be displayed.</param>
    public void SetIsShown(bool value)
    {
        _isShown = value;
        DataGrid?.InvokeStateChange();
    }

    /// <summary>
    /// Validates the content of a cell.
    /// </summary>
    /// <param name="value">The value in the cell.</param>
    /// <param name="item">The data item (row).</param>
    /// <returns>An enumeration of validation messages.</returns>
    public IAsyncEnumerable<string> Validate(TValue? value, TDataItem item) => CellValidation is null
        ? EmptyAsyncEnumerable<string>.Empty
        : CellValidation.Invoke(value, item);

    /// <summary>
    /// Validates the content of a cell.
    /// </summary>
    /// <param name="value">The value in the cell.</param>
    /// <param name="item">The data item (row).</param>
    /// <returns>An enumeration of validation messages.</returns>
    public IAsyncEnumerable<string> ValidateObject(object? value, TDataItem item)
        => Validate(value is TValue tValue ? tValue : default, item);

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

    private void ParseValue(Expression<Func<TDataItem, TValue?>>? value)
    {
        _defaultSetValue = null;
        ActualValue = null;
        IsBool = false;
        IsDateTime = false;
        IsEnum = false;
        IsFloat = false;
        IsNullable = false;
        IsNumeric = false;
        IsString = false;
        MemberName = null;

        if (value is null)
        {
            return;
        }

        var actualValue = value.Compile();
        if (actualValue is not null)
        {
            ActualValue = actualValue;
        }

        var nullableType = Nullable.GetUnderlyingType(value.ReturnType);
        IsNullable = nullableType is not null;
        var targetType = nullableType ?? value.ReturnType;

        IsString = targetType == typeof(string);

        IsBool = !IsString
            && targetType == typeof(bool);

        IsNumeric = !IsString
            && !IsBool
            && (targetType == typeof(byte)
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
            || targetType == typeof(ushort));

        IsFloat = IsNumeric
            && (targetType == typeof(decimal)
            || targetType == typeof(double)
            || targetType == typeof(float));

        IsDateTime = !IsString
            && !IsBool
            && !IsNumeric
            && (targetType == typeof(DateTime)
            || targetType == typeof(DateTimeOffset)
            || targetType == typeof(DateOnly)
            || targetType == typeof(TimeOnly));

        IsEnum = targetType.IsEnum;

        var body = value.Body;

        // Unwrap cast and save the reverse operation
        Delegate? conversion = null;
        if (body is UnaryExpression unaryExpression
            && unaryExpression.NodeType == ExpressionType.Convert)
        {
            conversion = Expression.Lambda(
                Expression.GetFuncType(unaryExpression.Operand.Type, unaryExpression.Type),
                Expression.Convert(
                    Expression.Parameter(unaryExpression.Operand.Type),
                    unaryExpression.Type),
                Expression.Parameter(unaryExpression.Operand.Type))
                .Compile();

            body = unaryExpression.Operand;
        }

        // Only use fields or properties of the lambda parameter (the row data item)
        if (body is not MemberExpression memberExpression
            || memberExpression.Expression is not ParameterExpression
            || (memberExpression.Member.MemberType is not MemberTypes.Field
            and not MemberTypes.Property))
        {
            return;
        }

        MemberName = memberExpression.Member.Name;

        if (memberExpression.Member.MemberType is MemberTypes.Property)
        {
            var property = (PropertyInfo)memberExpression.Member;
            if (property.CanWrite && property.SetMethod?.IsPublic == true)
            {
                if (conversion is null)
                {
                    _defaultSetValue = (x, v) => property.SetValue(x, v);
                }
                else
                {
                    _defaultSetValue = (x, v) => property.SetValue(x, conversion.DynamicInvoke(v));
                }
            }
            else
            {
                _defaultSetValue = null;
            }
        }
        else
        {
            var field = (FieldInfo)memberExpression.Member;
            if (field.IsPublic && !field.IsInitOnly)
            {
                if (conversion is null)
                {
                    _defaultSetValue = (x, v) => field.SetValue(x, v);
                }
                else
                {
                    _defaultSetValue = (x, v) => field.SetValue(x, conversion.DynamicInvoke(v));
                }
            }
            else
            {
                _defaultSetValue = null;
            }
        }
    }
}