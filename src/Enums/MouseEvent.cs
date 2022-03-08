namespace Tavenem.Blazor.Framework;

/// <summary>
/// A type of event which might trigger an element activation.
/// </summary>
[Flags]
public enum MouseEvent
{
    /// <summary>
    /// No events.
    /// </summary>
    None = 0,

    /// <summary>
    /// A click with the left mouse button, or a tap.
    /// </summary>
    LeftClick = 1 << 0,

    /// <summary>
    /// <para>
    /// A click with the right mouse button.
    /// </para>
    /// <para>
    /// On some platforms, a long tap.
    /// </para>
    /// </summary>
    RightClick = 1 << 1,

    /// <summary>
    /// A click with either mouse button, or a tap.
    /// </summary>
    Click = LeftClick | RightClick,

    /// <summary>
    /// A mouseover action.
    /// </summary>
    MouseOver = 1 << 2,

    /// <summary>
    /// A click with either mouse button, or a tap, or a mouseover action.
    /// </summary>
    Any = Click | MouseOver,
}
