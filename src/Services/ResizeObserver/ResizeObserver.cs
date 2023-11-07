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
    /// Gets current size information about an element.
    /// </summary>
    /// <param name="reference">The element to retrieve.</param>
    /// <param name="forceRefresh">
    /// Whether to get updated information, even if the observer has a cached value.
    /// </param>
    /// <returns>
    /// The bounding area for the given element.
    /// </returns>
    public async Task<BoundingClientRect?> GetSizeInfoAsync(ElementReference reference, bool forceRefresh = false)
    {
        if (!forceRefresh
            && _cachedValues.TryGetValue(reference, out var value))
        {
            return value;
        }

        var update = await reference.GetBoundingClientRectAsync();

        _cachedValues[reference] = update;

        return update;
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
    public async Task<IEnumerable<BoundingClientRect>> ObserveAsync(IList<ElementReference> elements)
    {
        var filteredElements = elements
            .Where(x => x.Context is not null
                && !_cachedValueIds.ContainsValue(x))
            .ToList();

        List<string> elementIds = [];
        foreach (var item in filteredElements)
        {
            var id = Guid.NewGuid();
            elementIds.Add(id.ToString());
            _cachedValueIds.Add(id, item);
        }

        var newResults = new List<BoundingClientRect>();
        try
        {
            var module = await _moduleTask.Value;
            newResults = (await module.InvokeAsync<IEnumerable<BoundingClientRect>>(
                "connect",
                _id.ToString(),
                _dotNetRef,
                filteredElements,
                elementIds))
                .ToList();
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }

        for (var i = 0; i < newResults.Count; i++)
        {
            _cachedValues[filteredElements[i]] = newResults[i];
        }

        var results = new List<BoundingClientRect>();
        for (var i = 0; i < elements.Count; i++)
        {
            if (elements[i].Context is not null
                && _cachedValues.TryGetValue(elements[i], out var value))
            {
                results.Add(value);
            }
        }

        return results;
    }

    /// <summary>
    /// Observe the given element for resize events.
    /// </summary>
    /// <param name="element">An element reference.</param>
    /// <returns>The current bounding area.</returns>
    public async Task<BoundingClientRect?> ObserveAsync(ElementReference element)
        => (await ObserveAsync([element])).FirstOrDefault();

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
    public async Task UnobserveAsync(ElementReference element)
    {
        var elementId = _cachedValueIds.FirstOrDefault(x => x.Value.Id == element.Id).Key;
        if (elementId == default)
        {
            return;
        }

        try
        {
            var module = await _moduleTask.Value;
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
