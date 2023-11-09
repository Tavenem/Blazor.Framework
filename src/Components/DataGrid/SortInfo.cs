namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about data sorting.
/// </summary>
/// <param name="Property">The name of the property by which to sort.</param>
/// <param name="Descending">Whether to sort in descending order.</param>
/// <param name="Priority">The priority of this column in an overall sort.</param>
public record SortInfo(string Property, bool Descending = false, int Priority = 0);
