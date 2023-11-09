using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A context for radio input groups.
/// </summary>
/// <param name="parentContext">The parent context, if any.</param>
/// <param name="changeEventCallback">
/// The event callback to be invoked when the selected value is changed.
/// </param>
internal sealed class RadioContext<TValue>(
    RadioContext<TValue>? parentContext,
    EventCallback<ChangeEventArgs> changeEventCallback)
{
    public EventCallback<ChangeEventArgs> ChangeEventCallback { get; } = changeEventCallback;

    public TValue? CurrentValue { get; set; }

    public string? GroupName { get; set; }

    public RadioContext<TValue>? ParentContext { get; } = parentContext;

    /// <summary>
    /// Finds a <see cref="RadioContext{TValue}"/> in the context's ancestors with the matching
    /// <paramref name="groupName"/>.
    /// </summary>
    /// <param name="groupName">
    /// The group name of the ancestor <see cref="RadioContext{TValue}"/>.
    /// </param>
    /// <returns>
    /// The <see cref="RadioContext{TValue}"/>, or <see langword="null"/> if none was found.
    /// </returns>
    public RadioContext<TValue>? FindContextInAncestors(string groupName)
        => string.Equals(GroupName, groupName) ? this : ParentContext?.FindContextInAncestors(groupName);
}