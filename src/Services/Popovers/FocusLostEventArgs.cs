namespace Tavenem.Blazor.Framework.Services.Popovers;

/// <summary>
/// Conveys information about a focus out event.
/// </summary>
public class FocusLostEventArgs : EventArgs
{
    /// <summary>
    /// The ID of the closest popover parent.
    /// </summary>
    public string? ParentId { get; set; }
}