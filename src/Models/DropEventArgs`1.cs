namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about a completed drag-drop event.
/// </summary>
public class DropEventArgs<TData>
{
    /// <summary>
    /// <para>
    /// The transferred data.
    /// </para>
    /// <para>
    /// To efficiently retrieve the desired information, the <see
    /// cref="DragDropService.TryGetData{TData}(IEnumerable{KeyValuePair{string, string}},
    /// string?)"/> method can be used.
    /// </para>
    /// </summary>
    public IEnumerable<KeyValuePair<string, string>>? Data { get; set; }

    /// <summary>
    /// A data item dropped via internal transfer.
    /// </summary>
    public TData? Item { get; set; }
}
