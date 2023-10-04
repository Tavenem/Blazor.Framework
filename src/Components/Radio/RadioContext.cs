using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A context for radio input groups.
/// </summary>
internal sealed class RadioContext<TValue>
{
    public EventCallback<ChangeEventArgs> ChangeEventCallback { get; }

    public TValue? CurrentValue { get; set; }

    public string? GroupName { get; set; }

    public RadioContext<TValue>? ParentContext { get; }

    /// <summary>
    /// Instantiates a new <see cref="RadioContext{TValue}" />.
    /// </summary>
    /// <param name="parentContext">The parent context, if any.</param>
    /// <param name="changeEventCallback">
    /// The event callback to be invoked when the selected value is changed.
    /// </param>
    public RadioContext(RadioContext<TValue>? parentContext, EventCallback<ChangeEventArgs> changeEventCallback)
    {
        ParentContext = parentContext;
        ChangeEventCallback = changeEventCallback;
    }

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