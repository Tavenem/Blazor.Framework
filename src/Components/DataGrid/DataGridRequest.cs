using System.Globalization;
using System.Text;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about a request to load items for a <see cref="DataGrid{TDataItem}"/>.
/// </summary>
/// <param name="Count">
/// <para>
/// The number of items requested.
/// </para>
/// <para>
/// A value of zero is used when exporting, to indicate that all data that matches the current
/// filters is expected. If that might result in an excessive number of rows, you can set <see
/// cref="DataPage{TDataItem}.HasMore"/> to <see langword="true"/> in the result (the actual results
/// in this case are irrelevant). The export process will fail, with a warning explaining that the
/// user must apply a stricter set of filters since there were too many results.
/// </para>
/// </param>
/// <param name="Offset">The number of items to skip.</param>
/// <param name="Filters">
/// A list of properties by which the results should be filtered.
/// </param>
/// <param name="Order">
/// <para>
/// A set of zero or more properties by which the data should be sorted.
/// </para>
/// <para>
/// Results should be sorted by the properties in the listed order of priority.
/// </para>
/// <para>
/// If this property is left <see langword="null"/>, the results may be unsorted, or sorted
/// arbitrarily.
/// </para>
/// </param>
public readonly record struct DataGridRequest(
    ushort Count,
    ulong Offset,
    FilterInfo[]? Filters,
    SortInfo[]? Order)
{
    /// <summary>
    /// Builds a T-SQL SELECT COUNT statement based on the given request.
    /// </summary>
    /// <param name="request">Information about the request.</param>
    /// <returns>
    /// <para>
    /// A T-SQL statement and a set of parameters: each a tuple with a name (excluding the leading
    /// '@') and a value (always a string).
    /// </para>
    /// <para>
    /// The statement will be in the form of a format string, with one replacement parameter: the
    /// name of a table.
    /// </para>
    /// </returns>
    /// <exception cref="ArgumentException">
    /// Any property name contains a character which is not an ASCII letter, or the number of
    /// parameters (including the number of quick filter terms) is greater than 2100.
    /// </exception>
    /// <remarks>
    /// <para>
    /// <strong>CAUTION:</strong> <em>do not</em> trust SQL commands which are passed from
    /// client-side code. This method parameterizes all user-supplied, text-based terms in the query
    /// it generates, and should produce safe SQL. However, that is only the case when it is
    /// executed on a trusted machine (i.e. server-side).
    /// </para>
    /// <para>
    /// You should <em>not</em> run this method on untrusted machines (i.e. client-side) and execute
    /// the results directly, or pass the resulting strings to your server for execution.
    /// </para>
    /// </remarks>
    public static (string command, (string name, string value)[] parameters) ToSqlCount(DataGridRequest request)
    {
        if (request.Filters?
            .Select(x => x.Property)
            .Any(x => x.Any(y => !char.IsAscii(y) || (!char.IsLetter(y) && !char.IsNumber(y)))) == true)
        {
            throw new ArgumentException("A property contains a character which is not an ASCII letter or number", nameof(request));
        }

        var sb = new StringBuilder("SELECT COUNT(1) FROM {0}");

        var parameters = GetWhereClause(sb, request);

        return (sb.ToString(), parameters);
    }

    /// <summary>
    /// Builds a T-SQL SELECT COUNT statement based on the given request.
    /// </summary>
    /// <param name="request">Information about the request.</param>
    /// <param name="columnMapping">
    /// <para>
    /// A dictionary which maps <see cref="DataGrid{TDataItem}"/> property names to SQL colummn
    /// names.
    /// </para>
    /// <para>
    /// The keys should be the names of properties used on the data items in your grid. THe values
    /// should be the names of SQL columns in your table.
    /// </para>
    /// </param>
    /// <returns>
    /// <para>
    /// A T-SQL statement and a set of parameters: each a tuple with a name (excluding the leading
    /// '@') and a value (always a string).
    /// </para>
    /// <para>
    /// The statement will be in the form of a format string, with one replacement parameter: the
    /// name of a table.
    /// </para>
    /// </returns>
    /// <exception cref="ArgumentException">
    /// Any property name contains a character which is not an ASCII letter, or the number of
    /// parameters (including the number of quick filter terms) is greater than 2100.
    /// </exception>
    /// <remarks>
    /// <para>
    /// <strong>CAUTION:</strong> <em>do not</em> trust SQL commands which are passed from
    /// client-side code. This method parameterizes all user-supplied, text-based terms in the query
    /// it generates, and should produce safe SQL. However, that is only the case when it is
    /// executed on a trusted machine (i.e. server-side).
    /// </para>
    /// <para>
    /// You should <em>not</em> run this method on untrusted machines (i.e. client-side) and execute
    /// the results directly, or pass the resulting strings to your server for execution.
    /// </para>
    /// </remarks>
    public static (string command, (string name, string value)[] parameters) ToSqlCount(
        DataGridRequest request,
        Dictionary<string, string> columnMapping)
    {
        var properties = request.Filters?.Select(x => x.Property).ToList() ?? new();
        var columns = new List<string>();
        foreach (var property in properties)
        {
            if (columnMapping.TryGetValue(property, out var column))
            {
                columns.Add(column);
            }
            else
            {
                columns.Add(property);
            }
        }
        if (columns
            .Any(x => x.Any(y => !char.IsAscii(y) || (!char.IsLetter(y) && !char.IsNumber(y)))))
        {
            throw new ArgumentException("A column contains a character which is not an ASCII letter or number", nameof(request));
        }

        var sb = new StringBuilder("SELECT COUNT(1) FROM {0}");

        var parameters = GetWhereClause(sb, request, columnMapping);

        return (sb.ToString(), parameters);
    }

    /// <summary>
    /// Builds a T-SQL SELECT statement based on the given request.
    /// </summary>
    /// <param name="request">Information about the request.</param>
    /// <param name="primaryKey">
    /// <para>
    /// The name of the primary key column for the table, or a comma-delimited list of columns which
    /// form a unique constraint when combined.
    /// </para>
    /// <para>
    /// This value is used to perform a final sort on results, and to sort when <see
    /// cref="DataGridRequest.Order"/> is <see langword="null"/>, to enforce a deterministic sort
    /// order (required for paging to operate properly).
    /// </para>
    /// <para>
    /// Any column names provided which are also used in <see cref="DataGridRequest.Order"/> will be
    /// stripped out, to avoid duplicate ORDER BY terms.
    /// </para>
    /// </param>
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
    /// A T-SQL statement and a set of parameters: each a tuple with a name (excluding the leading
    /// '@') and a value (always a string).
    /// </para>
    /// <para>
    /// The statement will be in the form of a format string, with two replacement parameters. The
    /// first expects the list of columns (e.g. '*' or a comma-delimited list of specific columns),
    /// and the second the name of a table.
    /// </para>
    /// </returns>
    /// <exception cref="ArgumentException">
    /// Any property name contains a character which is not an ASCII letter, or the number of
    /// parameters (including the number of quick filter terms) is greater than 2100.
    /// </exception>
    /// <remarks>
    /// <para>
    /// <strong>CAUTION:</strong> <em>do not</em> trust SQL commands which are passed from
    /// client-side code. This method parameterizes all user-supplied, text-based terms in the query
    /// it generates, and should produce safe SQL. However, that is only the case when it is
    /// executed on a trusted machine (i.e. server-side).
    /// </para>
    /// <para>
    /// You should <em>not</em> run this method on untrusted machines (i.e. client-side) and execute
    /// the results directly, or pass the resulting strings to your server for execution.
    /// </para>
    /// </remarks>
    public static (string command, (string name, string value)[] parameters) ToSqlQuery(
        DataGridRequest request,
        string primaryKey,
        ulong? limit = null)
    {
        if (request.Filters?
            .Select(x => x.Property)
            .Union(request.Order?
                .Select(x => x.Property)
                ?? Enumerable.Empty<string>())
            .Any(x => x.Any(y => !char.IsAscii(y) || (!char.IsLetter(y) && !char.IsNumber(y)))) == true)
        {
            throw new ArgumentException("A property contains a character which is not an ASCII letter or number", nameof(request));
        }

        IEnumerable<string> primarySortTerms = primaryKey.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (primarySortTerms.Any(x => x.Any(y => !char.IsAscii(y) || (!char.IsLetter(y) && !char.IsNumber(y)))))
        {
            throw new ArgumentException("The primary key contains a character which is not an ASCII letter or number", nameof(primaryKey));
        }
        var primarySortTermList = request.Order is not null
            ? primarySortTerms.Except(request.Order.Select(x => x.Property)).ToList()
            : primarySortTerms.ToList();

        var sb = new StringBuilder("SELECT {0} FROM {1}");

        var parameters = GetWhereClause(sb, request);

        sb.Append(" ORDER BY");
        if (request.Order?.Length > 0)
        {
            for (var i = 0; i < request.Order.Length; i++)
            {
                if (i > 0)
                {
                    sb.Append(',');
                }
                sb.Append(" [")
                    .Append(request.Order[i].Property)
                    .Append(']');
                if (request.Order[i].Descending)
                {
                    sb.Append(" DESC");
                }
            }
        }
        for (var i = 0; i < primarySortTermList.Count; i++)
        {
            if (request.Order?.Length > 0 || i > 0)
            {
                sb.Append(',');
            }
            sb.Append(" [")
                .Append(primarySortTermList[i])
                .Append(']');
        }

        if (request.Count > 0 || limit > 0)
        {
            sb.Append(" OFFSET ")
                .Append(request.Offset)
                .Append(" ROWS FETCH NEXT ");
            if (limit > 0
                && (request.Count == 0 || limit.Value < request.Count))
            {
                sb.Append(limit.Value);
            }
            else
            {
                sb.Append(request.Count);
            }
            sb.Append(" ROWS ONLY");
        }
        else if (request.Offset > 0)
        {
            sb.Append(" OFFSET ")
                .Append(request.Offset)
                .Append(" ROWS");
        }

        return (sb.ToString(), parameters);
    }

    /// <summary>
    /// Builds a T-SQL SELECT statement based on the given request.
    /// </summary>
    /// <param name="request">Information about the request.</param>
    /// <param name="primaryKey">
    /// <para>
    /// The name of the primary key column for the table, or a comma-delimited list of columns which
    /// form a unique constraint when combined.
    /// </para>
    /// <para>
    /// This value is used to perform a final sort on results, and to sort when <see
    /// cref="DataGridRequest.Order"/> is <see langword="null"/>, to enforce a deterministic sort
    /// order (required for paging to operate properly).
    /// </para>
    /// <para>
    /// Any column names provided which are also used in <see cref="DataGridRequest.Order"/> will be
    /// stripped out, to avoid duplicate ORDER BY terms.
    /// </para>
    /// </param>
    /// <param name="columnMapping">
    /// <para>
    /// A dictionary which maps <see cref="DataGrid{TDataItem}"/> property names to SQL colummn
    /// names.
    /// </para>
    /// <para>
    /// The keys should be the names of properties used on the data items in your grid. THe values
    /// should be the names of SQL columns in your table.
    /// </para>
    /// </param>
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
    /// A T-SQL statement and a set of parameters: each a tuple with a name (excluding the leading
    /// '@') and a value (always a string).
    /// </para>
    /// <para>
    /// The statement will be in the form of a format string, with two replacement parameters. The
    /// first expects the list of columns (e.g. '*' or a comma-delimited list of specific columns),
    /// and the second the name of a table.
    /// </para>
    /// </returns>
    /// <exception cref="ArgumentException">
    /// Any property name contains a character which is not an ASCII letter, or the number of
    /// parameters (including the number of quick filter terms) is greater than 2100.
    /// </exception>
    /// <remarks>
    /// <para>
    /// <strong>CAUTION:</strong> <em>do not</em> trust SQL commands which are passed from
    /// client-side code. This method parameterizes all user-supplied, text-based terms in the query
    /// it generates, and should produce safe SQL. However, that is only the case when it is
    /// executed on a trusted machine (i.e. server-side).
    /// </para>
    /// <para>
    /// You should <em>not</em> run this method on untrusted machines (i.e. client-side) and execute
    /// the results directly, or pass the resulting strings to your server for execution.
    /// </para>
    /// </remarks>
    public static (string command, (string name, string value)[] parameters) ToSqlQuery(
        DataGridRequest request,
        string primaryKey,
        Dictionary<string, string> columnMapping,
        ulong? limit = null)
    {
        var filterProperties = request.Filters?.Select(x => x.Property).ToList() ?? new();
        var orderProperties = request.Order?.Select(x => x.Property).ToList() ?? new();
        var filterColumns = new List<string>();
        foreach (var property in filterProperties)
        {
            if (columnMapping.TryGetValue(property, out var column))
            {
                filterColumns.Add(column);
            }
            else
            {
                filterColumns.Add(property);
            }
        }
        var orderColumns = new List<string>();
        foreach (var property in orderProperties)
        {
            if (columnMapping.TryGetValue(property, out var column))
            {
                orderColumns.Add(column);
            }
            else
            {
                orderColumns.Add(property);
            }
        }
        if (filterColumns.Union(orderColumns)
            .Any(x => x.Any(y => !char.IsAscii(y) || (!char.IsLetter(y) && !char.IsNumber(y)))))
        {
            throw new ArgumentException("A column contains a character which is not an ASCII letter or number", nameof(request));
        }

        IEnumerable<string> primarySortTerms = primaryKey.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (primarySortTerms.Any(x => x.Any(y => !char.IsAscii(y) || (!char.IsLetter(y) && !char.IsNumber(y)))))
        {
            throw new ArgumentException("The primary key contains a character which is not an ASCII letter or number", nameof(primaryKey));
        }
        var primarySortTermList = request.Order is not null
            ? primarySortTerms.Except(orderColumns).ToList()
            : primarySortTerms.ToList();

        var sb = new StringBuilder("SELECT {0} FROM {1}");

        var parameters = GetWhereClause(sb, request, columnMapping);

        sb.Append(" ORDER BY");
        if (request.Order?.Length > 0)
        {
            for (var i = 0; i < request.Order.Length; i++)
            {
                if (i > 0)
                {
                    sb.Append(',');
                }
                sb.Append(" [");
                if (columnMapping.TryGetValue(request.Order[i].Property, out var column))
                {
                    sb.Append(column);
                }
                else
                {
                    sb.Append(request.Order[i].Property);
                }
                sb.Append(']');
                if (request.Order[i].Descending)
                {
                    sb.Append(" DESC");
                }
            }
        }
        for (var i = 0; i < primarySortTermList.Count; i++)
        {
            if (request.Order?.Length > 0 || i > 0)
            {
                sb.Append(',');
            }
            sb.Append(" [")
                .Append(primarySortTermList[i])
                .Append(']');
        }

        if (request.Count > 0 || limit > 0)
        {
            sb.Append(" OFFSET ")
                .Append(request.Offset)
                .Append(" ROWS FETCH NEXT ");
            if (limit > 0
                && (request.Count == 0 || limit.Value < request.Count))
            {
                sb.Append(limit.Value);
            }
            else
            {
                sb.Append(request.Count);
            }
            sb.Append(" ROWS ONLY");
        }
        else if (request.Offset > 0)
        {
            sb.Append(" OFFSET ")
                .Append(request.Offset)
                .Append(" ROWS");
        }

        return (sb.ToString(), parameters);
    }

    private static List<(string name, string value)> GetQuickFilterParameters(string[] terms)
    {
        var filterChar1 = 'A';
        var filterChar2 = (char)('A' - 1);
        var filterChar3 = (char)('A' - 1);

        var parameters = new List<(string, string)>();

        for (var i = 0; i < terms.Length; i++)
        {
            if (filterChar3 >= 'A')
            {
                parameters.Add((
                    $"Quick_{filterChar1}{filterChar2}{filterChar3}",
                    terms[i]));

                filterChar3++;
                if (filterChar3 > 'Z')
                {
                    filterChar3 = 'A';
                    filterChar2++;
                    if (filterChar2 > 'Z')
                    {
                        filterChar2 = 'A';
                        filterChar1++;
                    }
                }
            }
            else if (filterChar2 >= 'A')
            {
                parameters.Add((
                    $"Quick_{filterChar1}{filterChar2}",
                    terms[i]));

                filterChar2++;
                if (filterChar2 > 'Z')
                {
                    filterChar2 = 'A';
                    filterChar1++;
                    if (filterChar1 > 'Z')
                    {
                        filterChar1 = 'A';
                        filterChar3 = 'A';
                    }
                }
            }
            else
            {
                parameters.Add((
                    $"Quick_{filterChar1}",
                    terms[i]));

                filterChar1++;
                if (filterChar1 > 'Z')
                {
                    filterChar1 = 'A';
                    filterChar2 = 'A';
                }
            }
        }

        return parameters;
    }

    private static (string name, string value)[] GetWhereClause(
        StringBuilder sb,
        DataGridRequest request,
        Dictionary<string, string>? columnMapping = null)
    {
        if (request.Filters is null
            || request.Filters.Length == 0)
        {
            return Array.Empty<(string, string)>();
        }

        var parameters = new List<(string, string)>();

        sb.Append(" WHERE");
        var any = false;
        for (var i = 0; i < request.Filters.Length; i++)
        {
            if (!request.Filters[i].NumberFilter.HasValue
                && !request.Filters[i].BoolFilter.HasValue
                && !request.Filters[i].DateTimeFilter.HasValue
                && string.IsNullOrEmpty(request.Filters[i].TextFilter))
            {
                continue;
            }

            if (any)
            {
                sb.Append(" AND");
            }
            sb.Append(' ');

            any |= GetWhereClause(sb, request.Filters[i], parameters, columnMapping);
        }

        var quickFilter = request
            .Filters
            .FirstOrDefault(x => !string.IsNullOrEmpty(x.QuickFilter))?
            .QuickFilter;
        if (string.IsNullOrEmpty(quickFilter))
        {
            return parameters.ToArray();
        }

        var quickFilterTerms = quickFilter
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (quickFilterTerms.Length == 0)
        {
            return parameters.ToArray();
        }
        if (quickFilterTerms.Length > 2100 - parameters.Count)
        {
            throw new ArgumentException("Too many quick filter terms");
        }

        var quickFilterParameters = GetQuickFilterParameters(quickFilterTerms);
        parameters.AddRange(quickFilterParameters);

        if (any)
        {
            sb.Append(" AND (");
        }
        for (var i = 0; i < quickFilterTerms.Length; i++)
        {
            if (i > 0)
            {
                sb.Append(" AND ");
            }
            else if (!any)
            {
                sb.Append(' ');
            }

            if (request.Filters.Length > 1)
            {
                sb.Append('(');
            }

            var anyQuick = false;
            for (var j = 0; j < request.Filters.Length; j++)
            {
                if (string.IsNullOrEmpty(request.Filters[j].QuickFilter))
                {
                    continue;
                }

                if (anyQuick)
                {
                    sb.Append(" OR ");
                }

                sb.Append('[');
                if (columnMapping is not null
                    && columnMapping.TryGetValue(request.Filters[j].Property, out var column))
                {
                    sb.Append(column);
                }
                else
                {
                    sb.Append(request.Filters[j].Property);
                }
                sb.Append("] LIKE '%' + @")
                    .Append(quickFilterParameters[i].name)
                    .Append(" + '%' COLLATE Latin1_general_CI_AI");

                anyQuick = true;
            }

            if (request.Filters.Length > 1)
            {
                sb.Append(')');
            }
        }
        if (any)
        {
            sb.Append(')');
        }

        return parameters.ToArray();
    }

    private static bool GetWhereClause(
        StringBuilder sb,
        FilterInfo filter,
        List<(string, string)> parameters,
        Dictionary<string, string>? columnMapping)
    {
        var property = filter.Property;
        if (columnMapping is not null
            && columnMapping.TryGetValue(property, out var column))
        {
            property = column;
        }
        if (filter.NumberFilter.HasValue)
        {
            sb.Append("ABS([")
                .Append(property)
                .Append("] - ")
                .Append(filter.NumberFilter!.Value.ToString("g5"))
                .Append(") < 0.00001");
        }
        else if (filter.BoolFilter.HasValue)
        {
            sb.Append('[')
                .Append(property)
                .Append("] = ")
                .Append(filter.BoolFilter!.Value ? '1' : '0');
        }
        else if (filter.DateTimeFilter.HasValue)
        {
            sb.Append('[')
                .Append(property)
                .Append(filter.DateTimeFilterIsBefore ? "] <= '" : "] >= '")
                .Append(filter.DateTimeFilter!.Value.ToString(filter.DateFormat, CultureInfo.InvariantCulture))
                .Append('\'');
        }
        else if (!string.IsNullOrEmpty(filter.TextFilter))
        {
            sb.Append('[')
                .Append(property);
            if (filter.ExactMatch)
            {
                sb.Append("] = @")
                    .Append(property);
            }
            else
            {
                sb.Append("] LIKE '%' + @")
                    .Append(property)
                    .Append(" + '%' COLLATE Latin1_general_CI_AI");
            }
            parameters.Add((property, filter.TextFilter!));
        }
        else
        {
            return false;
        }
        return true;
    }
}
