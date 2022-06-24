using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework.Components.List;

/// <summary>
/// Holds information about a list item.
/// </summary>
public class ListData<TListItem>
{
    /// <summary>
    /// The list item.
    /// </summary>
    [DisallowNull] public TListItem Item { get; set; } = default!;

    /// <summary>
    /// A unique identifier within the list.
    /// </summary>
    public Guid ListId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Constructs a new instance of <see cref="ListData{TListItem}"/>.
    /// </summary>
    public ListData() { }

    /// <summary>
    /// Constructs a new instance of <see cref="ListData{TListItem}"/>.
    /// </summary>
    public ListData([DisallowNull] TListItem item) => Item = item;
}
