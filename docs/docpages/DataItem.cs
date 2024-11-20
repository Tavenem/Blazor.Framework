namespace Tavenem.Blazor.Framework.DocPages;

public class DataItem
{
    [DataGridColumn(CanEdit = false, CanFilter = false, Label = "Employee #")]
    public int Id { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    [DataGridColumn(ColumnOrder = 1, Label = "Executive?")]
    public bool IsExecutive { get; set; }

    [DataGridColumn(Format = "d")]
    public DateTime HireDate { get; set; }
}
