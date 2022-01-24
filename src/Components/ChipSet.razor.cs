using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collection of <see cref="Chip"/> components with bindable item selection.
/// </summary>
public partial class ChipSet
{
    private readonly List<Chip> _chips = new();

    private bool _childrenNeedUpdates = false;

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// If <see langword="true"/> multiple chips can be selected.
    /// </summary>
    [Parameter] public bool Multiselect { get; set; }

    /// <summary>
    /// <para>
    /// If <see langword="true"/> at least one chip must remain selected.
    /// </para>
    /// <para>
    /// Note: does not force any initial selection, or restrict the programmatic
    /// removal of chips or control of their <see cref="Chip.IsSelected"/>
    /// property. Only restricts de-selection by user interaction.
    /// </para>
    /// </summary>
    [Parameter] public bool Required { get; set; }

    /// <summary>
    /// If not <see cref="ThemeColor.None"/>, replaces the theme of selected
    /// chips with this value.
    /// </summary>
    [Parameter] public ThemeColor SelectedColor { get; set; }

    /// <summary>
    /// <para>
    /// The currently-selected chip.
    /// </para>
    /// <para>
    /// If <see cref="Multiselect"/> is <see langword="false"/> this will always
    /// contain only one item.
    /// </para>
    /// </summary>
    [Parameter]
    public Chip? SelectedItem
    {
        get => SelectedItems.FirstOrDefault();
        set => _ = SetChipSelectionAsync(value);
    }

    /// <summary>
    /// Invoked when <see cref="SelectedItem"/> changes.
    /// </summary>
    [Parameter] public EventCallback<Chip?> SelectedItemChanged { get; set; }

    private readonly List<Chip> _selectedItems = new();
    /// <summary>
    /// <para>
    /// The currently-selected chips.
    /// </para>
    /// <para>
    /// If <see cref="Multiselect"/> is <see langword="false"/> this will always
    /// contain only one item.
    /// </para>
    /// </summary>
    [Parameter]
    public IEnumerable<Chip> SelectedItems
    {
        get => _chips.Where(x => x.IsSelected);
        set => _ = SetChipSelectionAsync(value);
    }

    /// <summary>
    /// Invoked when <see cref="SelectedItems"/> changes.
    /// </summary>
    [Parameter] public EventCallback<IEnumerable<Chip>> SelectedItemsChanged { get; set; }

    /// <summary>
    /// If <see langword="true"/> the icon of selected chips will display a
    /// checkmark (replacing any existing icon).
    /// </summary>
    [Parameter] public bool ShowSelectionIcon { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected string CssClass => new CssBuilder("d-flex my-2")
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in
    /// the render tree, and the incoming values have been assigned to properties.
    /// </summary>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (_childrenNeedUpdates)
        {
            foreach (var chip in _chips)
            {
                chip.ForceRedraw();
            }

            _childrenNeedUpdates = false;
        }
    }

    internal void Add(Chip chip)
    {
        _chips.Add(chip);
        chip.OnClicked += OnClickChipAsync;
        StateHasChanged();
    }

    internal async ValueTask RemoveAsync(Chip chip)
    {
        chip.OnClicked -= OnClickChipAsync;
        if (_selectedItems.Contains(chip))
        {
            _selectedItems.Remove(chip);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
        _chips.Remove(chip);
    }

    private async void OnClickChipAsync(object? sender, EventArgs e)
    {
        if (sender is not Chip chip)
        {
            return;
        }

        if (_selectedItems.Contains(chip))
        {
            if (!Required || _selectedItems.Count > 1)
            {
                _selectedItems.Remove(chip);
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
        }
        else if (Multiselect || _selectedItems.Count < 1)
        {
            _selectedItems.Add(chip);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
    }

    private async Task SetChipSelectionAsync(Chip? selectedItem)
    {
        if (SelectedItem == selectedItem)
        {
            return;
        }

        foreach (var chip in _chips)
        {
            await chip.SelectAsync(chip == selectedItem);
        }
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
    }

    private async Task SetChipSelectionAsync(IEnumerable<Chip> selectedItems)
    {
        var changed = false;
        foreach (var chip in _chips)
        {
            changed |= await chip.SelectAsync(selectedItems.Contains(chip));
        }
        if (changed)
        {
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
    }
}