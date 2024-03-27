using System.Text.Json.Serialization;
using Tavenem.Blazor.Framework.Components.EmojiInput;

namespace Tavenem.Blazor.Framework;

[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingDefault,
    PropertyNameCaseInsensitive = true)]
[JsonSerializable(typeof(Emoji[]))]
internal partial class TavenemFrameworkSerializerContext : JsonSerializerContext;
