using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Implement this interface to provide guidance for the JSON and/or plaintext representations of a
/// dragged item.
/// </summary>
public interface IDraggable
{
    /// <summary>
    /// Provides JSON serialization metadata about the type.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Used by the default interface implementation of <see cref="ToDraggedJson"/> if provided.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> reflection-based JSON serialization is used, which is not
    /// trim safe or AOT compatible.
    /// </para>
    /// </remarks>
    public JsonTypeInfo? JsonTypeInfo { get; }

    /// <summary>
    /// <para>
    /// Gets a string representation of this item in JSON format, for dragging operations.
    /// </para>
    /// <para>
    /// This method has a default interface implementation which uses standard JSON serialization.
    /// </para>
    /// </summary>
    /// <returns>
    /// A string in JSON format; or <see langword="null"/> if this item should not set any
    /// 'application/json' data.
    /// </returns>
    /// <remarks>
    /// <para>
    /// An item of this type should be deserializable from the returned JSON, or it will not be
    /// possible to successfully drop the item on a target which will automatically attempt to
    /// reconstitute an instance of the item, such as a <see cref="DropTarget{TDropItem}"/> or an
    /// <see cref="ElementList{TListItem}"/>.
    /// </para>
    /// <para>
    /// For example, if you have a complex business object which can be uniquely identified by a
    /// single Id parameter, you could override this method to return just that Id (in JSON format)
    /// and none of the other properties of the object. You would, however, need to ensure that a
    /// deserialized instance with only the Id parameter set could successfully reproduce the
    /// complete object.
    /// </para>
    /// </remarks>
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Warning and workaround provided in JsonTypeInfo property.")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Warning and workaround provided in JsonTypeInfo property.")]
    public string? ToDraggedJson() => JsonTypeInfo is null
        ? JsonSerializer.Serialize(this, GetType())
        : JsonSerializer.Serialize(this, JsonTypeInfo);

    /// <summary>
    /// <para>
    /// Gets a string representation of this item in plain text format, for dragging operations.
    /// </para>
    /// <para>
    /// This method has a default interface implementation which returns <see
    /// cref="object.ToString"/>, or the string "null" if that method returns null, since it is
    /// generally good practice for all drag operations to specify a 'text/plain' fallback.
    /// </para>
    /// </summary>
    /// <returns>
    /// A string; or <see langword="null"/> if this item should not set any 'text/plain' data.
    /// </returns>
    public string? ToDraggedString() => ToString();
}
