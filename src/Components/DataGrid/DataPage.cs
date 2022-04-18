namespace Tavenem.Blazor.Framework;

/// <summary>
/// Data items retireved by a paging operation.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
/// <param name="Items">The items returned.</param>
/// <param name="TotalCount">
/// <para>
/// The total number of items available.
/// </para>
/// <para>
/// May be omitted if this information is unavailable.
/// </para>
/// </param>
/// <param name="HasMore">Whether additional items are available.</param>
public record DataPage<TDataItem>(List<TDataItem> Items, ulong? TotalCount, bool HasMore);
