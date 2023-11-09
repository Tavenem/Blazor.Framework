using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.DataGrid.InternalDialogs;

/// <summary>
/// The auto-generated edit dialog for a <see cref="DataGrid{TDataItem}"/>.
/// </summary>
public partial class EditDialog<TDataItem>
{
    /// <summary>
    /// The list of columns.
    /// </summary>
    [Parameter] public List<IColumn<TDataItem>> Columns { get; set; } = [];

    /// <summary>
    /// The edited item.
    /// </summary>
    [Parameter] public TDataItem? EditedItem { get; set; }

    [CascadingParameter] DialogInstance? Dialog { get; set; }

    private Form? DialogEditForm { get; set; }

    private void OnCancel()
    {
        DialogEditForm?.Reset();
        Dialog?.Close();
    }

    private async Task OnSaveAsync()
    {
        var valid = true;
        if (DialogEditForm is not null)
        {
            valid = await DialogEditForm.ValidateAsync();
        }
        if (valid)
        {
            Dialog?.Close(EditedItem);
        }
        else
        {
            Dialog?.Close();
        }
    }
}