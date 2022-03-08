namespace Tavenem.Blazor.Framework.Services;

/// <summary>
/// Information about a resize event.
/// </summary>
public record SizeChangeUpdateInfo(string Id, BoundingClientRect Size);
