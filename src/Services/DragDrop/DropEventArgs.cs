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
    /// cref="DragDropService.TryGetData{TData}(IEnumerable{KeyValuePair{string, string}}?, string?,
    /// System.Text.Json.Serialization.Metadata.JsonTypeInfo{TData}?)"/> method can be used.
    /// </para>
    /// </summary>
    public IEnumerable<KeyValuePair<string, string>>? Data { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="DropEventArgs"/>.
    /// </summary>
    public DropEventArgs() { }

    /// <summary>
    /// Constructs a new instance of <see cref="DropEventArgs"/>.
    /// </summary>
    /// <param name="data">The transferred data.</param>
    public DropEventArgs(IEnumerable<KeyValuePair<string, string>> data)
        => Data = data;
}
