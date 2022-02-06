using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collection of <see cref="Chip{T}"/> components with bindable item selection.
/// </summary>
public partial class ChipSet<TChip>
{
    /// <summary>
    /// The items bound to this set.
    /// </summary>
    [Parameter] public IEnumerable<TChip>? Items { get; set; }

    /// <summary>
    /// If <see langword="true"/> multiple chips can be selected.
    /// </summary>
    [Parameter] public bool Multiselect { get; set; }

    /// <summary>
    /// <para>
    /// If <see langword="true"/> at least one chip must remain selected.
    /// </para>
    /// <para>
    /// Note: does not force any initial selection, or restrict the programmatic removal of chips.
    /// Only restricts de-selection by user interaction.
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
    /// If <see cref="Multiselect"/> is <see langword="true"/> this will contain an arbitrary item
    /// among the selection.
    /// </para>
    /// </summary>
    [Parameter]
    public TChip? SelectedItem
    {
        get => SelectedItems.FirstOrDefault();
        set => _ = SetSelectionAsync(value);
    }

    /// <summary>
    /// Invoked when <see cref="SelectedItem"/> changes.
    /// </summary>
    [Parameter] public EventCallback<TChip?> SelectedItemChanged { get; set; }

    private readonly List<TChip> _selectedItems = new();
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
    public IEnumerable<TChip> SelectedItems
    {
        get => _selectedItems;
        set => _ = SetSelectionAsync(value);
    }

    /// <summary>
    /// Invoked when <see cref="SelectedItems"/> changes.
    /// </summary>
    [Parameter] public EventCallback<IEnumerable<TChip>> SelectedItemsChanged { get; set; }

    /// <summary>
    /// If <see langword="true"/> the icon of selected chips will display a
    /// checkmark (replacing any existing icon).
    /// </summary>
    [Parameter] public bool ShowSelectionIcon { get; set; } = true;

    /// <summary>
    /// <para>
    /// A template used to generate chips from items.
    /// </para>
    /// <para>
    /// The <see cref="Chip{T}.Item"/> property should always be set to the item it represents in
    /// your template. Failing to do so can cause the <see cref="ChipSet{T}"/> to fail to operate
    /// properly.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> each item's <see cref="object.ToString"/> method will be used
    /// to generate its <see cref="Chip{T}.Text"/>.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<TChip>? Template { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("d-flex my-2")
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in the render
    /// tree, and the incoming values have been assigned to properties.
    /// </summary>
    /// <returns>A <see cref="Task" /> representing any asynchronous operation.</returns>
    protected override async Task OnParametersSetAsync()
    {
        base.OnParametersSet();

        if (Items is null)
        {
            if (_selectedItems.Count > 0)
            {
                _selectedItems.Clear();
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
            return;
        }

        var remaining = _selectedItems.Intersect(Items).ToList();
        if (remaining.Count == _selectedItems.Count)
        {
            return;
        }
        _selectedItems.Clear();
        _selectedItems.AddRange(remaining);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
    }

    internal async ValueTask OnClickChipAsync(TChip? item)
    {
        if (item is null)
        {
            return;
        }

        if (_selectedItems.Contains(item))
        {
            if (!Required || _selectedItems.Count > 1)
            {
                _selectedItems.Remove(item);
                await SelectedItemChanged.InvokeAsync(SelectedItem);
                await SelectedItemsChanged.InvokeAsync(SelectedItems);
            }
        }
        else
        {
            if (!Multiselect && _selectedItems.Count > 0)
            {
                _selectedItems.Clear();
            }
            _selectedItems.Add(item);
            await SelectedItemChanged.InvokeAsync(SelectedItem);
            await SelectedItemsChanged.InvokeAsync(SelectedItems);
        }
        StateHasChanged();
    }

    private async Task SetSelectionAsync(TChip? selectedItem)
    {
        if (_selectedItems.Count == 0
            && selectedItem is null)
        {
            return;
        }

        if (_selectedItems.Count == 1
            && _selectedItems[0]?.Equals(selectedItem) == true)
        {
            return;
        }

        _selectedItems.Clear();
        if (selectedItem is not null)
        {
            _selectedItems.Add(selectedItem);
        }
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }

    private async Task SetSelectionAsync(IEnumerable<TChip> selectedItems)
    {
        if (!_selectedItems.Except(selectedItems).Any()
            && !selectedItems.Except(_selectedItems).Any())
        {
            return;
        }
        _selectedItems.Clear();
        _selectedItems.AddRange(selectedItems);
        await SelectedItemChanged.InvokeAsync(SelectedItem);
        await SelectedItemsChanged.InvokeAsync(SelectedItems);
        StateHasChanged();
    }
}