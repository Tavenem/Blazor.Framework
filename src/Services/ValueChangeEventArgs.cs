namespace Tavenem.Blazor.Framework.Services;

/// <summary>
/// Conveys information about a value change event.
/// </summary>
public class ValueChangeEventArgs : EventArgs
{
    /// <summary>
    /// The new value as a string, or <see langword="null"/> when there is no value.
    /// </summary>
    public string? Value { get; set; }
}
