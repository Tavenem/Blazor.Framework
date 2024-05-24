using Microsoft.JSInterop;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides encapsulated JavaScript interop for <c>Tavenem.Blazor.Framework</c>
/// </summary>
/// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
public class UtilityService(IJSRuntime jsRuntime) : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-utility.js")
        .AsTask());

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    public async ValueTask DisposeAsync()
    {
        if (_moduleTask.IsValueCreated)
        {
            var module = await _moduleTask.Value;
            await module.DisposeAsync();
        }

        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Downloads the given stream to the client.
    /// </summary>
    /// <param name="fileName">The name for the file.</param>
    /// <param name="fileType">The mime type of the file.</param>
    /// <param name="streamReference">
    /// A <see cref="DotNetStreamReference"/> wrapping a stream.
    /// </param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask DownloadAsync(
        string fileName,
        string fileType,
        DotNetStreamReference streamReference,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var module = await _moduleTask.Value;
            await module.InvokeVoidAsync(
                "downloadStream",
                cancellationToken,
                fileName,
                fileType,
                streamReference);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    /// <summary>
    /// Downloads the given URL to the client.
    /// </summary>
    /// <param name="fileName">The name for the file.</param>
    /// <param name="url">
    /// A URL which points to a downloadable file.
    /// </param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask DownloadAsync(string fileName, string url, CancellationToken cancellationToken = default)
    {
        try
        {
            var module = await _moduleTask.Value;
            await module.InvokeVoidAsync("downloadUrl", cancellationToken, fileName, url);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Gets a value from the browser's <c>localStorage</c>.
    /// </summary>
    /// <param name="key">The key of the value to retrieve.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    /// <returns>
    /// The string value stored under the given <paramref name="key"/> in the browser's
    /// <c>localStorage</c>; or <see langword="null"/> if there is no such value.
    /// </returns>
    public async ValueTask<string?> GetFromLocalStorageAsync(string key, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentNullException(nameof(key));
        }
        try
        {
            return await jsRuntime.InvokeAsync<string?>("localStorage.getItem", cancellationToken, key);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        return null;
    }

    /// <summary>
    /// Gets a value from the browser's <c>localStorage</c>.
    /// </summary>
    /// <typeparam name="T">The type of data to retrieve.</typeparam>
    /// <param name="key">The key of the value to retrieve.</param>
    /// <param name="typeInfo"><see cref="JsonTypeInfo{T}"/> for <typeparamref name="T"/>.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    /// <returns>
    /// The string value stored under the given <paramref name="key"/> in the browser's
    /// <c>localStorage</c>; or <see langword="null"/> if there is no such value.
    /// </returns>
    public async ValueTask<T?> GetFromLocalStorageAsync<T>(string key, JsonTypeInfo<T> typeInfo, CancellationToken cancellationToken = default)
    {
        var value = await GetFromLocalStorageAsync(key, cancellationToken);
        if (string.IsNullOrEmpty(value))
        {
            return default;
        }
        // When retrieving a string, if the value doesn't appear to be serialized JSON, return it as-is.
        if (typeof(T) == typeof(string)
            && value[0] != '{'
            && value[0] != '['
            && value[0] != '"')
        {
            return (T)(object)value;
        }
        try
        {
            return JsonSerializer.Deserialize(value, typeInfo);
        }
        // If deserialization failed for the entire value (i.e. not a sub-property or element),
        // and the type is string, return the value as-is.
        catch (JsonException e) when (e.Path == "$" && typeof(T) == typeof(string))
        {
            return (T)(object)value;
        }
    }

    /// <summary>
    /// Opens the given stream in a new window, if the browser supports viewing the file type.
    /// Otherwise the file is normally downloaded.
    /// </summary>
    /// <param name="fileName">The name for the file.</param>
    /// <param name="fileType">The mime type of the file.</param>
    /// <param name="streamReference">
    /// A <see cref="DotNetStreamReference"/> wrapping a stream.
    /// </param>
    /// <param name="revoke">Whether to immediately revoke the allocated object URL.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask<string?> OpenAsync(
        string fileName,
        string fileType,
        DotNetStreamReference streamReference,
        bool revoke = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var module = await _moduleTask.Value;
            return await module.InvokeAsync<string>(
                "openStream",
                cancellationToken,
                fileName,
                fileType,
                streamReference,
                revoke);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
        return null;
    }

    /// <summary>
    /// Open a link.
    /// </summary>
    /// <param name="url">
    /// <para>
    /// The URL of the resource to be loaded. This can be a path or URL to an HTML page, image file,
    /// or any other resource that is supported by the browser.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> or empty, a blank page is opened into the targeted browsing
    /// context.
    /// </para>
    /// </param>
    /// <param name="target">
    /// <para>
    /// The name of the browsing context (window, &lt;iframe> or tab) into which to load the
    /// specified resource; if the name doesn't indicate an existing context, a new window is
    /// created and is given the name specified.
    /// </para>
    /// <para>
    /// This can be used as the target for the target attribute of &lt;a> or &lt;form> elements. The
    /// name should not contain whitespace.
    /// </para>
    /// <para>
    /// The most common use of this parameter is to specify <c>_blank</c> to open a new tab.
    /// </para>
    /// </param>
    /// <param name="noopener">
    /// <para>
    /// When <see langword="true"/>, the newly-opened window will open as normal, except that it
    /// will not have access back to the originating window. This is useful for preventing untrusted
    /// sites from tampering with the originating window, and vice versa.
    /// </para>
    /// <para>
    /// Note that when <paramref name="noopener"/> is <see langword="true"/>, nonempty <paramref
    /// name="target"/> names other than <c>_top</c>, <c>_self</c>, and <c>_parent</c> are all
    /// treated like <c>_blank</c> in terms of deciding whether to open a new window/tab.
    /// </para>
    /// </param>
    /// <param name="noreferrer">
    /// <para>
    /// If this feature is set, the request to load the content located at the specified URL will be
    /// loaded with the request's <c>referrer</c> set to <c>noreferrer</c>; this prevents the
    /// request from sending the URL of the page that initiated the request to the server where the
    /// request is sent. In addition, setting this feature also automatically sets noopener.
    /// </para>
    /// <para>
    /// When this value is <see langword="true"/>, <c>noopener</c> is also automatically <see
    /// langword="true"/>; the value of the <paramref name="noopener"/> parameter is ignored.
    /// </para>
    /// </param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask OpenUrlAsync(
        string? url,
        string? target = null,
        bool noopener = false,
        bool noreferrer = false,
        CancellationToken cancellationToken = default)
    {
        string? features = null;
        if (noreferrer)
        {
            features = "noreferrer";
        }
        else if (noopener)
        {
            features = "noopener";
        }

        try
        {
            await jsRuntime.InvokeVoidAsync("window.open", cancellationToken, url, target, features);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Removes a value from the browser's <c>localStorage</c>.
    /// </summary>
    /// <param name="key">The key of the value to remove.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask RemoveFromLocalStorageAsync(string key, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentNullException(nameof(key));
        }
        try
        {
            await jsRuntime.InvokeVoidAsync("localStorage.removeItem", cancellationToken, key);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Revokes a previously allocated object URL.
    /// </summary>
    /// <param name="url">The URL to revoke.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask RevokeURLAsync(string url, CancellationToken cancellationToken = default)
    {
        try
        {
            await jsRuntime.InvokeVoidAsync("URL.revokeObjectURL", cancellationToken, url);
        }
        catch { }
    }

    /// <summary>
    /// Sets a value in the browser's <c>localStorage</c>.
    /// </summary>
    /// <param name="key">The key under which to set the value.</param>
    /// <param name="value">The value to store.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask SetInLocalStorageAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentNullException(nameof(key));
        }
        try
        {
            await jsRuntime.InvokeVoidAsync("localStorage.setItem", cancellationToken, key, value);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Sets a value in the browser's <c>localStorage</c>.
    /// </summary>
    /// <typeparam name="T">The type of data to store.</typeparam>
    /// <param name="key">The key under which to set the value.</param>
    /// <param name="value">The value to store.</param>
    /// <param name="typeInfo"><see cref="JsonTypeInfo{T}"/> for <typeparamref name="T"/>.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask SetInLocalStorageAsync<T>(string key, T value, JsonTypeInfo<T> typeInfo, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentNullException(nameof(key));
        }
        await SetInLocalStorageAsync(key, JsonSerializer.Serialize(value, typeInfo), cancellationToken);
    }

    /// <summary>
    /// Horizontally shake the HTML element with the given id.
    /// </summary>
    /// <param name="elementId">The id of an HTML element.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/>.</param>
    public async ValueTask Shake(string? elementId, CancellationToken cancellationToken = default)
    {
        try
        {
            var module = await _moduleTask.Value;
            await module.InvokeVoidAsync("shake", cancellationToken, elementId);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }
}
