using System.Text.Json.Serialization;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A source generated serializer context for <c>Tavenem.Blazor.Framework</c> types.
/// </summary>
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(DataGridRequest))]
[JsonSerializable(typeof(CropEventArgs))]
[JsonSerializable(typeof(PinchEventArgs))]
[JsonSerializable(typeof(SwipeEventArgs))]
[JsonSerializable(typeof(KeyListenerOptions))]
[JsonSerializable(typeof(KeyOptions))]
[JsonSerializable(typeof(ValueChangeEventArgs))]
public partial class TavenemFrameworkJsonSerializerContext : JsonSerializerContext;
