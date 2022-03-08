namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about a swipe event.
/// </summary>
public class SwipeEventArgs
{
    /// <summary>
    /// The direction of the swipe.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Note that <see cref="SwipeDirection"/> is a <see cref="FlagsAttribute"/> <c>enum</c> and
    /// multiple directions may be indicated. However, opposite directions will never be included.
    /// for example: <see cref="SwipeDirection.Down"/> and <see cref="SwipeDirection.Right"/> may
    /// both be present, to indicate a downward-right diagonal swipe.
    /// </para>
    /// <para>
    /// If a swipe includes significant motion in two opposite directions, neither direction will be
    /// reported, interpreting the user's intention regarding that axis of motion as uncertain, or
    /// as a deliberate attempt to cancel a motion by reversing course.
    /// </para>
    /// </remarks>
    public SwipeDirection Direction { get; set; }

    /// <summary>
    /// The maximum number of contact points during the event.
    /// </summary>
    public int Touches { get; set; }
}
