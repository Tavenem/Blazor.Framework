using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A resize event handler.
/// </summary>
/// <param name="changes">The resize events which have occurred.</param>
public delegate void SizeChanged(IDictionary<ElementReference, BoundingClientRect> changes);

/// <summary>
/// Enables observing elements for resize events.
/// </summary>
public interface IResizeObserver : IAsyncDisposable
{
    /// <summary>
    /// Raised when a resize event occurs for an observed element.
    /// </summary>
    event SizeChanged? OnResized;

    /// <summary>
    /// Gets current size information about an observed element.
    /// </summary>
    /// <param name="reference">The element to retrieve.</param>
    /// <param name="forceRefresh">
    /// Whether to get updated information, even if the observer has a cached value.
    /// </param>
    /// <returns>
    /// The bounding area for the given element.
    /// </returns>
    /// <remarks>
    /// If <paramref name="forceRefresh"/> is <see langword="false"/>, observes the element if it is
    /// not already being observed.
    /// </remarks>
    Task<BoundingClientRect?> GetSizeInfoAsync(ElementReference reference, bool forceRefresh = false);

    /// <summary>
    /// Determine whether a given element is already being observed for resize events.
    /// </summary>
    /// <param name="reference">The element to check.</param>
    /// <returns>
    /// <see langword="true"/> if the element referred to by <paramref name="reference"/> is being
    /// observed for resize events; otherwise <see langword="false"/>.
    /// </returns>
    bool IsElementObserved(ElementReference reference);

    /// <summary>
    /// Observe the given element for resize events.
    /// </summary>
    /// <param name="element">An element reference.</param>
    /// <returns>The current bounding area.</returns>
    Task<BoundingClientRect?> ObserveAsync(ElementReference element);

    /// <summary>
    /// Observe the given list of elements for resize events.
    /// </summary>
    /// <param name="elements">A list of element references.</param>
    /// <returns>An enumeration of current bounding areas.</returns>
    Task<IEnumerable<BoundingClientRect>> ObserveAsync(IList<ElementReference> elements);

    /// <summary>
    /// Stop observing an element for resize events.
    /// </summary>
    /// <param name="element">The element to stop observing.</param>
    Task UnobserveAsync(ElementReference element);
}