using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.InternalComponents.DataGrid;

/// <summary>
/// Represents a row in a <see cref="DataGrid{TDataItem}"/>.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
public partial class Row<TDataItem>
{
    /// <summary>
    /// Gets whether the row is expanded.
    /// </summary>
    public bool IsExpanded => DataGrid?.GetRowIsExpanded(Item) ?? false;

    /// <summary>
    /// Whether the row's expanded content is loading.
    /// </summary>
    public bool IsLoading { get; internal set; }

    /// <summary>
    /// Whether the row is selected.
    /// </summary>
    public bool IsSelected => Item is not null
        && DataGrid?.SelectedItems.Contains(Item) == true;

    /// <summary>
    /// Gets the data item bound to this row.
    /// </summary>
    [Parameter] public TDataItem Item { get; set; } = default!;

    [CascadingParameter] private Form? TableEditForm { get; set; }

    private string? ThemeButtonClass => new CssBuilder("btn btn-icon small")
        .Add(ThemeColor.ToCSS())
        .ToString();

    [CascadingParameter] private DataGrid<TDataItem>? DataGrid { get; set; }

    private string? ExpandClass => new CssBuilder("expand-row")
        .Add("open", IsExpanded)
        .ToString();

    private bool HasRowExpansion => Item is not null
        && DataGrid?.ExpandedContent is not null;

    private bool IsEditing => DataGrid?.EditingRow?.Equals(this) == true;

    private string? LoadingClass => new CssBuilder("small")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string? RowCssClass => new CssBuilder()
        .Add(DataGrid?.RowClass?.Invoke(Item), DataGrid?.RowClass is not null)
        .Add("selected", IsSelected)
        .ToString();

    private ThemeColor ThemeColor => DataGrid?.ThemeColor ?? ThemeColor.None;

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (Item is null)
        {
            throw new InvalidOperationException($"{nameof(Item)} may not be null");
        }
    }

    internal async Task CancelEditAsync()
    {
        if (DataGrid is null)
        {
            return;
        }
        if (DataGrid.TableEditForm is not null)
        {
            await DataGrid.TableEditForm.ResetAsync();
        }
        DataGrid.EditingRow = null;
    }

    private async Task OnClickAsync()
    {
        if (IsEditing || DataGrid is null)
        {
            return;
        }

        await DataGrid.OnSelectAsync(this);
    }

    private Task OnDeleteAsync() => DataGrid?.OnDeleteAsync(this) ?? Task.CompletedTask;

    private Task OnEditAsync() => DataGrid?.OnEditAsync(this) ?? Task.CompletedTask;

    private async Task OnSaveAsync()
    {
        if (DataGrid is null)
        {
            return;
        }

        if (DataGrid.TableEditForm is not null)
        {
            var valid = await DataGrid.TableEditForm.ValidateAsync();
            if (!valid)
            {
                return;
            }
        }

        await DataGrid.OnSaveEditAsync();
    }

    private Task OnToggleExpansionAsync()
        => DataGrid?.OnToggleRowExpansionAsync(this) ?? Task.CompletedTask;
}
