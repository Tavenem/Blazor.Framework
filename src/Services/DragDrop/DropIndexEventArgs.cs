namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about a completed drag-drop event.
/// </summary>
public class DropIndexEventArgs : DropEventArgs
{
    /// <summary>
    /// <para>
    /// The index in a list onto which the data was dropped.
    /// </para>
    /// <para>
    /// This will be <see langword="null"/> when the item is dropped on the list itself rather than
    /// any particular item.
    /// </para>
    /// </summary>
    public int? Index { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="DropEventArgs"/>.
    /// </summary>
    public DropIndexEventArgs() { }

    /// <summary>
    /// Constructs a new instance of <see cref="DropEventArgs"/>.
    /// </summary>
    /// <param name="data">The transferred data.</param>
    /// <param name="index">The index onto which the data was dropped.</param>
    public DropIndexEventArgs(IEnumerable<KeyValuePair<string, string>> data, int? index)
    {
        Data = data;
        Index = index;
    }
}
