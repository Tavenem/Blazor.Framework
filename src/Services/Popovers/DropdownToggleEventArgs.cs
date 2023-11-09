namespace Tavenem.Blazor.Framework.Services.Popovers;

/// <summary>
/// Conveys information about a dropdown toggle event.
/// </summary>
public class DropdownToggleEventArgs : EventArgs
{
    /// <summary>
    /// Whether the dropdown has become open.
    /// </summary>
    public bool Value { get; set; }
}
