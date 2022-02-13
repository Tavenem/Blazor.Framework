namespace Tavenem.Blazor.Framework.KeyListening;

/// <summary>
/// Options for listening to keyboard events.
/// </summary>
public class KeyListenerOptions
{
    /// <summary>
    /// The CSS class of the node(s) which should be observed for keyboard events.
    /// </summary>
    /// <remarks>
    /// If this is not set explicitly, it will default to "framework"
    /// </remarks>
    public string TargetClass { get; set; } = "framework";

    /// <summary>
    /// Keys to be listened to.
    /// </summary>
    public List<KeyOptions> Keys { get; set; } = new();
}
