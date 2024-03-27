using System.Net.Http.Json;
using Tavenem.Blazor.Framework.Components.EmojiInput;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A typed <see cref="HttpClient"/> which can be used by the framework.
/// </summary>
/// <param name="httpClient">A configured <see cref="HttpClient"/> instance.</param>
/// <remarks>
/// <a
/// href="https://learn.microsoft.com/en-us/aspnet/core/blazor/call-web-api#typed-httpclient">https://learn.microsoft.com/en-us/aspnet/core/blazor/call-web-api#typed-httpclient</a>
/// </remarks>
public class TavenemFrameworkHttpClient(HttpClient httpClient)
{
    internal async Task<Emoji[]> GetEmojiAsync()
        => await httpClient
        .GetFromJsonAsync(
            "_content/Tavenem.Blazor.Framework/emoji.json",
            TavenemFrameworkSerializerContext.Default.EmojiArray)
        ?? [];
}
