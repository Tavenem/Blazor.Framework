using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collection of <see cref="Chip{T}"/> components with bindable selection,
/// and drag-drop support.
/// </summary>
public partial class ChipSet<TChip> : ElementList<TChip>
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
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("chipset")
        .Add("can-drag", IsDragStartValue)
        .Add(CanDropClass, HasValidDrop)
        .Add(NoDropClass, DragDropListener.DropValid == false)
        .ToString();
}