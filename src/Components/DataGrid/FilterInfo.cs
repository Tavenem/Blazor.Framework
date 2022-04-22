namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about data filtering.
/// </summary>
/// <param name="Property">The name of the property by which to filter.</param>
/// <param name="TextFilter">
/// <para>
/// A filter to apply to text.
/// </para>
/// <para>
/// When <see langword="null"/> the filter should be ignored.
/// </para>
/// <para>
/// An item should be considered a match if it contains the filter text anywhere within it.
/// </para>
/// <para>
/// A case-insensitive search is expected.
/// </para>
/// <para>
/// Ignoring minor textual differences (such as e.g. accented characters) is preferred.
/// </para>
/// </param>
/// <param name="ExactMatch">
/// <para>
/// If <see langword="true"/> the <paramref name="TextFilter"/> should be considered a match only
/// when the entire text of the data matches the filter exactly.
/// </para>
/// <para>
/// The search should become case-sensitive, and should not disregard minor textual differences.
/// </para>
/// </param>
/// <param name="QuickFilter">
/// <para>
/// A filter to apply to text.
/// </para>
/// <para>
/// This should be considered a space-delimited set of terms.
/// </para>
/// <para>
/// When <see langword="null"/> the filter should be ignored.
/// </para>
/// <para>
/// An item should be considered a match if it contains the filter text anywhere within it.
/// </para>
/// <para>
/// A case-insensitive search is expected.
/// </para>
/// <para>
/// Ignoring minor textual differences (such as e.g. accented characters) is preferred.
/// </para>
/// <para>
/// Unlike <paramref name="TextFilter"/>, a data item (row) should be considered a match if
/// <em>any</em> property with a quick filter is matched, but only if <em>all</em> quick filter
/// terms (space delimited) are matched by at least one property.
/// </para>
/// </param>
/// <param name="BoolFilter">
/// <para>
/// A filter to apply to boolean data.
/// </para>
/// <para>
/// When <see langword="null"/> the filter should be ignored.
/// </para>
/// </param>
/// <param name="NumberFilter">
/// <para>
/// A filter to apply to numeric data.
/// </para>
/// <para>
/// When <see langword="null"/> the filter should be ignored.
/// </para>
/// </param>
/// <param name="DateTimeFilter">
/// <para>
/// A filter to apply to date/time data.
/// </para>
/// <para>
/// When <see langword="null"/> the filter should be ignored.
/// </para>
/// </param>
/// <param name="DateFormat">
/// <para>
/// The format to use for date/time comparisons.
/// </para>
/// <para>
/// Both the source data and the <paramref name="DateTimeFilter"/> should be transformed (when
/// possible) using this format. The data should be considered a match when the representation of
/// each in the given format is a match.
/// </para>
/// </param>
public record FilterInfo(
string Property,
string? TextFilter,
bool ExactMatch,
string? QuickFilter,
bool? BoolFilter,
double? NumberFilter,
DateTimeOffset? DateTimeFilter,
string? DateFormat);
