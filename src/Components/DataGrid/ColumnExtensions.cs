using System.Globalization;
using System.Text;
using Tavenem.Blazor.Framework.Components.DataGrid;

namespace Tavenem.Blazor.Framework;

internal static class ColumnExtensions
{
    public static bool FilterMatches<TDataItem>(this IColumn<TDataItem> column, TDataItem item)
    {
        if (column.IsString)
        {
            return column.FilterMatches(item, column.TextFilter);
        }
        if (column.IsNumeric)
        {
            return column.FilterMatches(item, column.NumberFilter);
        }
        if (column.IsBool)
        {
            return column.FilterMatches(item, column.BoolFilter);
        }
        if (column.IsDateTime)
        {
            return column.FilterMatches(item, column.DateTimeFilter);
        }
        return true;
    }

    public static bool FilterMatches<TDataItem>(this IColumn<TDataItem> column, TDataItem item, string? filter)
    {
        if (string.IsNullOrEmpty(filter))
        {
            return true;
        }
        if (!column.IsString
            || item is null
            || column is not Column<TDataItem, string> stringColumn)
        {
            return false;
        }

        var value = stringColumn.GetCellValue(item);
        if (string.IsNullOrEmpty(value))
        {
            return false;
        }

        return CultureInfo.InvariantCulture.CompareInfo.IndexOf(
            value,
            filter,
            CompareOptions.IgnoreCase
                | CompareOptions.IgnoreNonSpace
                | CompareOptions.IgnoreKanaType
                | CompareOptions.IgnoreWidth) != -1;
    }

    public static string GetBoolIcon<TDataItem>(this IColumn<TDataItem> column, TDataItem item)
    {
        if (!column.IsBool)
        {
            return DefaultIcons.Indeterminate;
        }
        if (column is Column<TDataItem, bool> boolColumn)
        {
            var value = boolColumn.GetCellValue(item);
            return value
                ? DefaultIcons.True
                : DefaultIcons.False;
        }
        if (column is Column<TDataItem, bool?> nullableBoolColumn)
        {
            var value = nullableBoolColumn.GetCellValue(item);
            if (value == true)
            {
                return DefaultIcons.True;
            }
            if (column.IsNullable && !value.HasValue)
            {
                return DefaultIcons.Indeterminate;
            }
            return DefaultIcons.False;
        }
        return DefaultIcons.Indeterminate;
    }

    public static string? GetCellClass<TDataItem>(this IColumn<TDataItem> column, TDataItem item)
        => new CssBuilder()
        .Add(column.CellClass?.Invoke(item))
        .Add(column.GetAlignClass())
        .Add("bool-cell", column.IsBool)
        .ToString();

    public static string GetDateTimeFormat<TDataItem>(this IColumn<TDataItem> column)
    {
        if (column is Column<TDataItem, DateTime>
            or Column<TDataItem, DateTime?>)
        {
            return "yyyy-MM-dd HH:mm:ss";
        }
        if (column is Column<TDataItem, DateOnly>
            or Column<TDataItem, DateOnly?>)
        {
            return "yyyy-MM-dd";
        }
        if (column is Column<TDataItem, TimeOnly>
            or Column<TDataItem, TimeOnly?>)
        {
            return "HH:mm:ss";
        }
        return "yyyy-MM-dd HH:mm:ss K";
    }

    public static IEnumerable<KeyValuePair<object, string>> GetEnumOptions<TDataItem>(this IColumn<TDataItem> column)
        => Enum.GetValues(column.GetBaseDataType())
        .Cast<object>()
        .Select((x, i) => new KeyValuePair<object, string>(
            x,
            x.ToString()?.ToHumanReadable() ?? i.ToString()));

    public static bool IsTrue<TDataItem>(this IColumn<TDataItem> column, TDataItem item)
    {
        if (!column.IsBool)
        {
            return false;
        }
        if (column is Column<TDataItem, bool> boolColumn)
        {
            return boolColumn.GetCellValue(item);
        }
        if (column is Column<TDataItem, bool?> nullableBoolColumn)
        {
            return nullableBoolColumn.GetCellValue(item) == true;
        }
        return false;
    }

    public static void OnSetValue<TDataItem, TValue>(this IColumn<TDataItem> column, TDataItem item, TValue? value)
    {
        if (column is Column<TDataItem, TValue> valueColumn)
        {
            valueColumn.SetCellValue(item, value);
        }
    }

    public static string? ToString<TDataItem>(this IColumn<TDataItem> column, TDataItem item)
        => column.GetString(column.GetCellObjectValue(item));

    private static bool FilterMatches<TDataItem>(this IColumn<TDataItem> column, TDataItem item, bool? filter)
    {
        if (!filter.HasValue)
        {
            return true;
        }

        if (!column.IsBool)
        {
            return false;
        }

        if (column is Column<TDataItem, bool> boolColumn)
        {
            return boolColumn.GetCellValue(item) == filter.Value;
        }
        else if (column is Column<TDataItem, bool?> nullableBoolColumn)
        {
            var value = nullableBoolColumn.GetCellValue(item) == true;
            return value == filter.Value;
        }
        return false;
    }

    private static bool FilterMatches<TDataItem>(this IColumn<TDataItem> column, TDataItem item, double? filter)
    {
        if (!filter.HasValue)
        {
            return true;
        }

        var value = column.GetCellObjectValue(item);
        if (value is null)
        {
            return false;
        }

        double d;
        try
        {
            d = Convert.ToDouble(value);
        }
        catch
        {
            return false;
        }

        var str = filter.Value.ToString("g5", CultureInfo.InvariantCulture);
        if (string.IsNullOrEmpty(str))
        {
            return true;
        }

        return d
            .ToString("g5", CultureInfo.InvariantCulture)
            .Equals(str);
    }

    private static bool FilterMatches<TDataItem>(this IColumn<TDataItem> column, TDataItem item, DateTimeOffset? filter)
    {
        if (!filter.HasValue)
        {
            return true;
        }

        if (!column.IsDateTime)
        {
            return false;
        }

        var value = column.GetCellObjectValue(item);
        if (value is null)
        {
            return false;
        }

        if (value is DateTime dateTime)
        {
            return column.DateTimeFilterIsBefore
                ? dateTime <= filter.Value.DateTime
                : dateTime >= filter.Value.DateTime;
        }
        if (value is DateTimeOffset dateTimeOffset)
        {
            return column.DateTimeFilterIsBefore
                ? dateTimeOffset <= filter.Value
                : dateTimeOffset >= filter.Value;
        }
        if (value is DateOnly dateOnly)
        {
            return column.DateTimeFilterIsBefore
                ? dateOnly <= DateOnly.FromDateTime(filter.Value.Date)
                : dateOnly >= DateOnly.FromDateTime(filter.Value.Date);
        }
        if (value is TimeOnly timeOnly)
        {
            return column.DateTimeFilterIsBefore
                ? timeOnly <= TimeOnly.FromTimeSpan(filter.Value.TimeOfDay)
                : timeOnly >= TimeOnly.FromTimeSpan(filter.Value.TimeOfDay);
        }

        return false;
    }

    private static string GetAlignClass<TDataItem>(this IColumn<TDataItem> column)
    {
        if (column.Alignment == HorizontalAlignment.None)
        {
            if (column.IsNumeric)
            {
                return "text-right";
            }
            return column.IsBool
                ? "text-center"
                : "text-start";
        }
        return column.Alignment switch
        {
            HorizontalAlignment.Left => "text-left",
            HorizontalAlignment.Center => "text-center",
            HorizontalAlignment.End => "text-end",
            HorizontalAlignment.Right => "text-right",
            _ => "text-start",
        };
    }

    private static string? GetString<TDataItem>(this IColumn<TDataItem> column, object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is string str)
        {
            return str;
        }

        if (value is bool b)
        {
            if (b || column.IsNullable)
            {
                return b.ToString(column.FormatProvider);
            }
            return null;
        }

        if (value is DateTime dateTime)
        {
            if (!string.IsNullOrEmpty(column.Format))
            {
                return dateTime.ToString(column.Format, column.FormatProvider);
            }
            if (dateTime.TimeOfDay.Ticks == 0)
            {
                return dateTime.ToString("d", column.FormatProvider);
            }
            return dateTime.Second == 0
                ? dateTime.ToString("g", column.FormatProvider)
                : dateTime.ToString("G", column.FormatProvider);
        }
        if (value is DateTimeOffset dateTimeOffset)
        {
            if (!string.IsNullOrEmpty(column.Format))
            {
                return dateTimeOffset.ToString(column.Format, column.FormatProvider);
            }
            if (dateTimeOffset.TimeOfDay.Ticks == 0)
            {
                return dateTimeOffset.ToString("d", column.FormatProvider);
            }
            return dateTimeOffset.Second == 0
                ? dateTimeOffset.ToString("g", column.FormatProvider)
                : dateTimeOffset.ToString("G", column.FormatProvider);
        }
        if (value is DateOnly dateOnly)
        {
            if (!string.IsNullOrEmpty(column.Format))
            {
                return dateOnly.ToString(column.Format, column.FormatProvider);
            }
            return dateOnly.ToString("d", column.FormatProvider);
        }
        if (value is TimeOnly timeOnly)
        {
            if (!string.IsNullOrEmpty(column.Format))
            {
                return timeOnly.ToString(column.Format, column.FormatProvider);
            }
            return timeOnly.Second == 0
                ? timeOnly.ToString("t", column.FormatProvider)
                : timeOnly.ToString("T", column.FormatProvider);
        }

        if (value is IFormattable formattable)
        {
            if (string.IsNullOrEmpty(column.Format) && column.IsNumeric)
            {
                if (column.IsFloat)
                {
                    return formattable.ToString("G3", column.FormatProvider);
                }
                else
                {
                    return formattable.ToString("N0", column.FormatProvider);
                }
            }
            return formattable.ToString(column.Format, column.FormatProvider);
        }

        if (value is System.Collections.IEnumerable enumerable)
        {
            var sb = new StringBuilder();
            var count = 0;
            foreach (var x in enumerable)
            {
                if (count >= 3)
                {
                    sb.Append(" ...");
                    break;
                }
                if (x is System.Collections.IEnumerable)
                {
                    if (count > 0)
                    {
                        sb.Append("; ");
                    }
                    sb.Append("[...]");
                    count++;
                }
                else
                {
                    var s = column.GetString(x);
                    if (!string.IsNullOrEmpty(s))
                    {
                        if (count > 0)
                        {
                            sb.Append("; ");
                        }
                        sb.Append(s);
                        count++;
                    }
                }
            }
            return sb.ToString();
        }

        return value.ToString()?.Trim();
    }
}
