namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about a pinch event.
/// </summary>
public class PinchEventArgs
{
    /// <summary>
    /// <para>
    /// If <see langword="true"/>, the pinch is from points that were father apart to points that
    /// are closer to each other.
    /// </para>
    /// <para>
    /// Otherwise the pinch is from points that were closer together to points that are farther
    /// apart.
    /// </para>
    /// </summary>
    public bool Inward { get; set; }

    /// <summary>
    /// The number of contact points during the event.
    /// </summary>
    public int Touches { get; set; }
}
