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
    /// <returns>
    /// The last observed bounding area for the given element; or <see langword="null"/> if the
    /// given element is not currently being observed.
    /// </returns>
    BoundingClientRect? GetSizeInfo(ElementReference reference);

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
    Task<BoundingClientRect?> Observe(ElementReference element);

    /// <summary>
    /// Observe the given list of elements for resize events.
    /// </summary>
    /// <param name="elements">A list of element references.</param>
    /// <returns>An enumeration of current bounding areas.</returns>
    Task<IEnumerable<BoundingClientRect>> Observe(IEnumerable<ElementReference> elements);

    /// <summary>
    /// Stop observing an element for resize events.
    /// </summary>
    /// <param name="element">The element to stop observing.</param>
    Task Unobserve(ElementReference element);
}