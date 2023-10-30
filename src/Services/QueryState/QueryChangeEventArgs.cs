namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides data for a query string parameter change.
/// </summary>
public class QueryChangeEventArgs : EventArgs
{
    /// <summary>
    /// <para>
    /// The new value of the property, if only a single value was present.
    /// </para>
    /// <para>
    /// May be <see langword="null"/> if the property has been removed from the query.
    /// </para>
    /// </summary>
    /// <remarks>
    /// When multiple <see cref="Values"/> are present, this will be set to the first value.
    /// </remarks>
    public string? Value { get; set; }

    /// <summary>
    /// The new values of the property, if multiple values were present.
    /// </summary>
    public List<string>? Values { get; set; }
}
