namespace Tavenem.Blazor.Framework;

/// <summary>
/// Options for listening to keyboard events.
/// </summary>
public class KeyListenerOptions
{
    /// <summary>
    /// Keys to be listened to.
    /// </summary>
    public List<KeyOptions> Keys { get; set; } = [];
}
