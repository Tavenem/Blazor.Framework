namespace Tavenem.Blazor.Framework;

/// <summary>
/// The type of date information expected from a <see cref="DateTimeInput{TValue}"/>.
/// </summary>
public enum DateType
{
    /// <summary>
    /// No date component.
    /// </summary>
    None = 0,

    /// <summary>
    /// The year only.
    /// </summary>
    Year = 1,

    /// <summary>
    /// The month and year.
    /// </summary>
    Month = 2,

    /// <summary>
    /// The week and year.
    /// </summary>
    Week = 3,

    /// <summary>
    /// The exact date.
    /// </summary>
    Date = 4,
}
