using Microsoft.JSInterop;

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
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.DisposeAsync().ConfigureAwait(false);
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
    public async ValueTask DownloadAsync(string fileName, string fileType, DotNetStreamReference streamReference)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("downloadStream", fileName, fileType, streamReference)
                .ConfigureAwait(false);
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
    public async ValueTask DownloadAsync(string fileName, string url)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("downloadUrl", fileName, url)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
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
    public async ValueTask<string?> OpenAsync(
        string fileName,
        string fileType,
        DotNetStreamReference streamReference,
        bool revoke = true)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            return await module
                .InvokeAsync<string>("openStream", fileName, fileType, streamReference, revoke)
                .ConfigureAwait(false);
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
    public async ValueTask OpenUrlAsync(
        string? url,
        string? target = null,
        bool noopener = false,
        bool noreferrer = false)
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
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("open", url, target, features)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Revokes a previously allocated object URL.
    /// </summary>
    /// <param name="url">The URL to revoke.</param>
    public async ValueTask RevokeURLAsync(string url)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("revokeURL", url)
                .ConfigureAwait(false);
        }
        catch { }
    }

    /// <summary>
    /// Horizontally shake the HTML element with the given id.
    /// </summary>
    /// <param name="elementId">The id of an HTML element.</param>
    public async ValueTask Shake(string? elementId)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("shake", elementId)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    internal async ValueTask CancelOutsideEventListener()
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync("cancelOutsideEvent");
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    internal async ValueTask<string[]> GetFontsAsync()
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            return await module.InvokeAsync<string[]>("getFonts");
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        return [];
    }
}
