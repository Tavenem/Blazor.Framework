using System.Text.Json.Serialization.Metadata;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// <para>
/// The data to provide to a drag-drop operation.
/// </para>
/// <para>
/// <see cref="DragDropService.GetDragStartData{TData}(TData, JsonTypeInfo{TData}, string?,
/// DragEffect)"/> or <see cref="DragDropService.GetDragStartData{TData}(TData, string?,
/// DragEffect)"/> can be used to get an instance from a single data item.
/// </para>
/// </summary>
public class DragStartData
{
    /// <summary>
    /// A <see cref="DragStartData"/> instance which contains no data and indicates no drag effect
    /// is allowed.
    /// </summary>
    public static readonly DragStartData None = new() { EffectAllowed = DragEffect.None };

    /// <summary>
    /// <para>
    /// The data provided for the drag-drop operation.
    /// </para>
    /// <para>
    /// The keys should be data types, such as 'application/json' or 'text/plain'. The values should
    /// usually be strings. Non-string data will be serialized to JSON. Links should be of type
    /// 'text/uri-list', and if more than one is provided, they should be included in the same
    /// entry, separated by CRLF line breaks.
    /// </para>
    /// <para>
    /// The order of the items in the list matters. Each type-data pair should represent the same
    /// information, with the most complete/accurate representation first, and a descending set of
    /// representations following. A 'text/plain' representation should usually be last.
    /// </para>
    /// <para>
    /// The special type 'tavenem/drop-data' signals that an internal transfer of a .NET object is
    /// occurring. The data will not be serialized to JSON or sent through the JavaScript interop
    /// layer, and will be transferred by reference if it is a reference type. This can improve
    /// performance for large or complex objects which cannot be serialized.
    /// </para>
    /// <para>
    /// Note that a 'tavenem/drop-data' transfer can't be successfully dropped outside its original
    /// app view (e.g. a browser tab), even if it is to another instance of the same app, since the
    /// data is kept within the service. To transfer anything outside the app, use the
    /// 'application/json' type and provide an object which can be properly serialized to JSON.
    /// </para>
    /// <para>
    /// When using the 'tavenem/drop-data' type, it is recommended that you provide a 'text/plain'
    /// fallback in case the user does try to drop the item outside your app, even if the text
    /// provided is just an error message.
    /// </para>
    /// </summary>
    public IEnumerable<KeyValuePair<string, object>>? Data { get; set; }

    /// <summary>
    /// The drag-drop effects allowed for this operation.
    /// </summary>
    public DragEffect EffectAllowed { get; set; } = DragEffect.All;
}
