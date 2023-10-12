using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

/// <summary>
/// Enables observing elements for resize events.
/// </summary>
internal class ResizeObserver : IResizeObserver
{
    private readonly Dictionary<Guid, ElementReference> _cachedValueIds = [];
    private readonly Dictionary<ElementReference, BoundingClientRect> _cachedValues = [];
    private readonly DotNetObjectReference<ResizeObserver> _dotNetRef;
    private readonly Guid _id = Guid.NewGuid();
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    private bool _disposedValue;

    /// <summary>
    /// Raised when a resize event occurs for an observed element.
    /// </summary>
    public event SizeChanged? OnResized;

    /// <summary>
    /// Initialize a new instance of <see cref="ResizeObserver"/>.
    /// </summary>
    /// <param name="jsRuntime">An injected instance of <see cref="IJSRuntime"/>.</param>
    public ResizeObserver(IJSRuntime jsRuntime)
    {
        _dotNetRef = DotNetObjectReference.Create(this);
        _moduleTask = new(
            () => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-resize.js")
            .AsTask());
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous dispose operation.</returns>
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Gets current size information about an observed element.
    /// </summary>
    /// <param name="reference">The element to retrieve.</param>
    /// <returns>
    /// The last observed bounding area for the given element; or <see langword="null"/> if the
    /// given element is not currently being observed.
    /// </returns>
    public BoundingClientRect? GetSizeInfo(ElementReference reference)
    {
        if (!_cachedValues.ContainsKey(reference))
        {
            return null;
        }

        return _cachedValues[reference];
    }

    /// <summary>
    /// Determine whether a given element is already being observed for resize events.
    /// </summary>
    /// <param name="reference">The element to check.</param>
    /// <returns>
    /// <see langword="true"/> if the element referred to by <paramref name="reference"/> is being
    /// observed for resize events; otherwise <see langword="false"/>.
    /// </returns>
    public bool IsElementObserved(ElementReference reference) => _cachedValues.ContainsKey(reference);

    /// <summary>
    /// Observe the given list of elements for resize events.
    /// </summary>
    /// <param name="elements">A list of element references.</param>
    /// <returns>An enumeration of current bounding areas.</returns>
    public async Task<IEnumerable<BoundingClientRect>> Observe(IEnumerable<ElementReference> elements)
    {
        var filteredElements = elements
            .Where(x => x.Context is not null
                && !_cachedValues.ContainsKey(x))
            .ToList();
        if (filteredElements.Count == 0)
        {
            return Enumerable.Empty<BoundingClientRect>();
        }

        List<string> elementIds = [];
        foreach (var item in filteredElements)
        {
            var id = Guid.NewGuid();
            elementIds.Add(id.ToString());
            _cachedValueIds.Add(id, item);
        }

        var results = Enumerable.Empty<BoundingClientRect>();
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            results = await module.InvokeAsync<IEnumerable<BoundingClientRect>>(
                "connect",
                _id.ToString(),
                _dotNetRef,
                filteredElements,
                elementIds);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }

        var counter = 0;
        foreach (var item in results)
        {
            _cachedValues.Add(filteredElements.ElementAt(counter), item);
            counter++;
        }

        return results;
    }

    /// <summary>
    /// Observe the given element for resize events.
    /// </summary>
    /// <param name="element">An element reference.</param>
    /// <returns>The current bounding area.</returns>
    public async Task<BoundingClientRect?> Observe(ElementReference element)
        => (await Observe(new[] { element })).FirstOrDefault();

    /// <summary>
    /// Invoked by JS interop.
    /// </summary>
    [JSInvokable]
    public void OnSizeChanged(IEnumerable<SizeChangeUpdateInfo> changes)
    {
        Dictionary<ElementReference, BoundingClientRect> parsedChanges = [];
        foreach (var item in changes)
        {
            if (!Guid.TryParse(item.Id, out var id)
                || !_cachedValueIds.ContainsKey(id))
            {
                continue;
            }

            var elementRef = _cachedValueIds[id];
            _cachedValues[elementRef] = item.Size;
            parsedChanges.Add(elementRef, item.Size);
        }

        OnResized?.Invoke(parsedChanges);
    }

    /// <summary>
    /// Stop observing an element for resize events.
    /// </summary>
    /// <param name="element">The element to stop observing.</param>
    public async Task Unobserve(ElementReference element)
    {
        var elementId = _cachedValueIds.FirstOrDefault(x => x.Value.Id == element.Id).Key;
        if (elementId == default)
        {
            return;
        }

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync("disconnect", _id.ToString(), elementId.ToString());
        }
        catch { }

        _cachedValueIds.Remove(elementId);
        _cachedValues.Remove(element);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous dispose operation.</returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _dotNetRef.Dispose();
                _cachedValueIds.Clear();
                _cachedValues.Clear();
                if (_moduleTask.IsValueCreated)
                {
                    try
                    {
                        var module = await _moduleTask.Value.ConfigureAwait(false);
                        await module.InvokeVoidAsync("dispose", _id).ConfigureAwait(false);
                        await module.DisposeAsync().ConfigureAwait(false);
                    }
                    catch { }
                }
            }

            _disposedValue = true;
        }
    }
}
