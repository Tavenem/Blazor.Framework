namespace Tavenem.Blazor.Framework;

/// <summary>
/// The view displayed by a <see cref="DateTimeInput{TValue}"/> picker.
/// </summary>
public enum DatePickerView
{
    /// <summary>
    /// No defined view.
    /// </summary>
    None = 0,

    /// <summary>
    /// A clock.
    /// </summary>
    Time = 1,

    /// <summary>
    /// A month-long calendar of individual dates.
    /// </summary>
    Date = 2,

    /// <summary>
    /// A year-long calendar of months.
    /// </summary>
    Month = 3,

    /// <summary>
    /// A decade-long selection of years.
    /// </summary>
    Year = 4,

    /// <summary>
    /// A century-long selection of decades.
    /// </summary>
    Decade = 5,

    /// <summary>
    /// A selection of centuries.
    /// </summary>
    Century = 6,
}