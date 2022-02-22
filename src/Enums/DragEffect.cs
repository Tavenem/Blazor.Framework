namespace Tavenem.Blazor.Framework;

/// <summary>
/// The types of drag effects allowed for a drag-drop operation.
/// </summary>
[Flags]
public enum DragEffect
{
    /// <summary>
    /// No effects allowed.
    /// </summary>
    None = 0,

    /// <summary>
    /// Copying is allowed.
    /// </summary>
    Copy = 1 << 0,

    /// <summary>
    /// Linking is allowed.
    /// </summary>
    Link = 1 << 1,

    /// <summary>
    /// Both copying and moving are allowed.
    /// </summary>
    CopyLink = Copy | Link,

    /// <summary>
    /// Moving is allowed.
    /// </summary>
    Move = 1 << 2,

    /// <summary>
    /// Both copying and moving are allowed.
    /// </summary>
    CopyMove = Copy | Move,

    /// <summary>
    /// Both linking and moving are allowed.
    /// </summary>
    LinkMove = Link | Move,

    /// <summary>
    /// Copying, linking, and moving are all allowed.
    /// </summary>
    All = CopyLink | Move,
}
