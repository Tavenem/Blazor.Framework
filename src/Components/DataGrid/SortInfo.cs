namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about data sorting.
/// </summary>
/// <param name="Property">The name of the property by which to sort.</param>
/// <param name="Descending">Whether to sort in descending order.</param>
public record SortInfo(string Property, bool Descending = false);
