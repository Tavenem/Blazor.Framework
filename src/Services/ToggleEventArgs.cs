namespace Tavenem.Blazor.Framework.Services;

/// <summary>
/// Conveys information about a boolean value change event.
/// </summary>
public class ToggleEventArgs : EventArgs
{
    /// <summary>
    /// The new value, or <see langword="null"/> when the value is indeterminate.
    /// </summary>
    public bool? Value { get; set; }
}
