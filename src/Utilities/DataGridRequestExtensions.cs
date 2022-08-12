using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Linq.Expressions;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Extension methods for <see cref="DataGridRequest"/>.
/// </summary>
public static class DataGridRequestExtensions
{
    /// <summary>
    /// Counts the items which satisfy the conditions of the given request information.
    /// </summary>
    /// <param name="items">The items to count.</param>
    /// <param name="request">Information about the request.</param>
    /// <returns>
    /// The number of items which satisfy the conditions of the given request information.
    /// </returns>
    /// <exception cref="ArgumentException">
    /// Any property was not found, or its value could not be accessed, on <typeparamref
    /// name="TDataItem"/>.
    /// </exception>
    public static long Count<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem>(
        this IEnumerable<TDataItem> items,
        DataGridRequest request) => items.Where(request).LongCount();

    /// <summary>
    /// Performs a LINQ query based on the given request information.
    /// </summary>
    /// <param name="items">The items to query.</param>
    /// <param name="request">Information about the request.</param>
    /// <param name="limit">
    /// <para>
    /// The maximum number of results to return.
    /// </para>
    /// <para>
    /// If this value is non-<see langword="null"/> and less than <see
    /// cref="DataGridRequest.Count"/>, only this amount will be returned.
    /// </para>
    /// </param>
    /// <returns>
    /// <para>
    /// An enumeration of items.
    /// </para>
    /// <para>
    /// When there are a non-zero number of <see cref="SortInfo"/> objects in <see
    /// cref="DataGridRequest.Order"/>, this will be an <see cref="IOrderedEnumerable{TElement}"/>.
    /// </para>
    /// </returns>
    /// <exception cref="ArgumentException">
    /// Any property was not found, or its value could not be accessed, on <typeparamref
    /// name="TDataItem"/>.
    /// </exception>
    public static IEnumerable<TDataItem> Query<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem>(
        this IEnumerable<TDataItem> items,
        DataGridRequest request,
        uint? limit = null)
    {
        items = items.Where(request);

        if (request.Order?.Length > 0)
        {
            var type = typeof(TDataItem);

            IOrderedEnumerable<TDataItem>? sorted = null;

            var parameter = Expression.Parameter(typeof(TDataItem), "x");

            foreach (var sort in request.Order)
            {
                var property = type.GetProperty(sort.Property);
                if (property is null)
                {
                    throw new ArgumentException($"Property {sort.Property} was not found on {type.FullName}");
                }
                if (!property.CanRead)
                {
                    throw new ArgumentException($"Property {sort.Property} could not be read on {type.FullName}");
                }

                var field = Expression.Convert(
                    Expression.Property(parameter, property),
                    typeof(object));
                var value = Expression
                    .Lambda<Func<TDataItem, object>>(field, parameter)
                    .Compile();

                if (sorted is null)
                {
                    sorted = sort.Descending
                        ? items.OrderByDescending(value)
                        : items.OrderBy(value);
                }
                else
                {
                    sorted = sort.Descending
                        ? sorted.ThenByDescending(value)
                        : sorted.ThenBy(value);
                }
            }
            if (sorted is not null)
            {
                items = sorted;
            }
        }

        if (request.Offset > 0)
        {
            items = items.Skip((int)request.Offset);
        }

        if (request.Count > 0 || limit > 0)
        {
            if (limit > 0
                && (request.Count == 0 || limit.Value < request.Count))
            {
                items = items.Take((int)limit.Value);
            }
            else
            {
                items = items.Take(request.Count);
            }
        }

        return items;
    }

    private static bool FilterMatches<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem>(TDataItem item, FilterInfo filter)
    {
        var dataType = typeof(TDataItem);
        var propertyInfo = dataType.GetProperty(filter.Property);
        if (propertyInfo is null)
        {
            throw new ArgumentException($"Property {filter.Property} was not found on {dataType.FullName}");
        }
        if (!propertyInfo.CanRead)
        {
            throw new ArgumentException($"Property {filter.Property} could not be read on {dataType.FullName}");
        }

        var type = propertyInfo.PropertyType;
        var nullableType = Nullable.GetUnderlyingType(type);
        var targetType = nullableType ?? type;

        var value = propertyInfo.GetValue(item);

        if (targetType == typeof(string))
        {
            return FilterMatches(value as string, filter.TextFilter);
        }
        if (targetType == typeof(bool))
        {
            return nullableType is null
                ? value is bool boolValue
                    && FilterMatches(boolValue, filter.BoolFilter)
                : FilterMatches(value as bool?, filter.BoolFilter);
        }
        if (targetType == typeof(byte)
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
            || targetType == typeof(ushort))
        {
            return FilterMatches(value, filter.NumberFilter);
        }
        if (targetType == typeof(DateTime)
            || targetType == typeof(DateTimeOffset)
            || targetType == typeof(DateOnly)
            || targetType == typeof(TimeOnly))
        {
            return FilterMatches(value, filter.DateTimeFilter, filter.DateTimeFilterIsBefore);
        }
        return false;
    }

    private static bool FilterMatches(string? value, string? filter)
    {
        if (string.IsNullOrEmpty(filter))
        {
            return true;
        }

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

    private static bool FilterMatches(bool? value, bool? filter)
    {
        if (value is null)
        {
            return !filter.HasValue;
        }

        if (!filter.HasValue)
        {
            return false;
        }

        return value == filter;
    }

    private static bool FilterMatches(object? value, double? filter)
    {
        if (value is null)
        {
            return !filter.HasValue;
        }

        if (!filter.HasValue)
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

    private static bool FilterMatches(object? value, DateTimeOffset? filter, bool isBefore)
    {
        if (value is null)
        {
            return !filter.HasValue;
        }

        if (!filter.HasValue)
        {
            return false;
        }

        if (value is DateTime dateTime)
        {
            return isBefore
                ? dateTime <= filter.Value.DateTime
                : dateTime >= filter.Value.DateTime;
        }
        if (value is DateTimeOffset dateTimeOffset)
        {
            return isBefore
                ? dateTimeOffset <= filter.Value
                : dateTimeOffset >= filter.Value;
        }
        if (value is DateOnly dateOnly)
        {
            return isBefore
                ? dateOnly <= DateOnly.FromDateTime(filter.Value.Date)
                : dateOnly >= DateOnly.FromDateTime(filter.Value.Date);
        }
        if (value is TimeOnly timeOnly)
        {
            return isBefore
                ? timeOnly <= TimeOnly.FromTimeSpan(filter.Value.TimeOfDay)
                : timeOnly >= TimeOnly.FromTimeSpan(filter.Value.TimeOfDay);
        }

        return false;
    }

    private static bool QuickFilterMatches<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem>(TDataItem item, FilterInfo filter, string term)
    {
        if (string.IsNullOrEmpty(filter.QuickFilter))
        {
            return true;
        }

        var dataType = typeof(TDataItem);
        var propertyInfo = dataType.GetProperty(filter.Property);
        if (propertyInfo is null)
        {
            throw new ArgumentException($"Property {filter.Property} was not found on {dataType.FullName}");
        }
        if (!propertyInfo.CanRead)
        {
            throw new ArgumentException($"Property {filter.Property} could not be read on {dataType.FullName}");
        }

        return FilterMatches(propertyInfo.GetValue(item) as string, term);
    }

    private static IEnumerable<TDataItem> Where<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem>(this IEnumerable<TDataItem> items, DataGridRequest request)
    {
        if (request.Filters is null
            || request.Filters.Length == 0)
        {
            return items;
        }

        foreach (var filter in request.Filters)
        {
            items = items.Where(x => FilterMatches(x, filter));
        }

        var quickFilter = request.Filters
            .FirstOrDefault(x => !string.IsNullOrEmpty(x.QuickFilter))?
            .QuickFilter;
        if (!string.IsNullOrEmpty(quickFilter))
        {
            var quickFilterTerms = quickFilter
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (quickFilterTerms.Length > 0)
            {
                items = items
                    .Where(x => quickFilterTerms
                    .All(y => request.Filters
                    .Any(z => QuickFilterMatches(x, z, y))));
            }
        }

        return items;
    }
}
