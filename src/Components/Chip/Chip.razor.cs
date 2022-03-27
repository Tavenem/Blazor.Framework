using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays a chip, with support for simple theming and closing.
/// </summary>
public partial class Chip<TChip>
{
    /// <summary>
    /// The list to which this item belongs, if any.
    /// </summary>
    [CascadingParameter]
    protected ChipSet<TChip>? ChipSet
    {
        get => ElementList as ChipSet<TChip>;
        set => ElementList = value;
    }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("chip")
        .Add(ThemeColor.ToCSS())
        .Add(
            "clickable",
            ElementList?.OnItemClick.HasDelegate == true
                || ElementList?.SelectionType != SelectionType.None)
        .Add("selected", IsSelected)
        .Add("no-drag", !GetIsDraggable())
        .Add("d-none", IsClosed)
        .Add(ClassName)
        .ToString();

    private bool IsClosed { get; set; }

    private async Task OnClosedAsync()
    {
        if (ChipSet?.OnChipClosed.HasDelegate == true)
        {
            await ChipSet.OnChipClosed.InvokeAsync(Item);
        }
        else
        {
            IsClosed = true;
        }
    }
}