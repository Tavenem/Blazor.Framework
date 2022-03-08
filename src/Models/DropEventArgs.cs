namespace Tavenem.Blazor.Framework;

/// <summary>
/// Information about a completed drag-drop event.
/// </summary>
public class DropEventArgs
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
    /// <para>
    /// The drag effect.
    /// </para>
    /// <para>
    /// Will always be either <see cref="DragEffect.Copy"/>, <see cref="DragEffect.Link"/>, or <see
    /// cref="DragEffect.Move"/>.
    /// </para>
    /// </summary>
    public DragEffect Effect { get; set; }
}
