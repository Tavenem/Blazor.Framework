using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collection of <see cref="Chip{T}"/> components with bindable selection,
/// and drag-drop support.
/// </summary>
public partial class ChipSet<TChip>
{
    /// <summary>
    /// Whether chips should display a close button that sets its <c>display</c> property to
    /// <c>none</c>.
    /// </summary>
    [Parameter] public bool AutoClose { get; set; }

    /// <summary>
    /// Ignored for <see cref="ChipSet{TChip}"/>.
    /// </summary>
    [Parameter] public override Func<TChip, bool>? ItemIsCollapsible { get; set; }

    /// <summary>
    /// Invoked when a chip is closed.
    /// </summary>
    [Parameter] public EventCallback<TChip> OnChipClosed { get; set; }

    /// <summary>
    /// <para>
    /// A template used to generate list items.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> each item's <see cref="object.ToString"/>
    /// method will be used to generate its content.
    /// </para>
    /// </summary>
    [Parameter] public override RenderFragment<TChip>? Template { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("chipset")
        .Add("can-drag", IsDragStartValue)
        .Add("can-drop", _canDrop)
        .Add("no-drop", !IsDropTarget && FrameworkLayout?.CurrentDragType == typeof(TChip))
        .Add(DraggingClass, _dragInProgress)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();
}