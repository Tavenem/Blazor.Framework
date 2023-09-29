namespace Tavenem.Blazor.Framework.DocPages.Pages.Components;

public partial class DataGridDoc
{
    private class DataItem
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

    private readonly List<DataItem> _editableItems1 = new()
    {
        new DataItem{Id = 0, FirstName = "James", LastName = "Smith", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1263)},
        new DataItem{Id = 1, FirstName = "Mary", LastName = "Johnson", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1121)},
        new DataItem{Id = 2, FirstName = "Robert", LastName = "Williams", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(210)},
        new DataItem{Id = 3, FirstName = "Patricia", LastName = "Brown", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(720)},
        new DataItem{Id = 4, FirstName = "John", LastName = "Jones", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(550)},
        new DataItem{Id = 5, FirstName = "Jennifer", LastName = "Garcia", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(160)},
        new DataItem{Id = 6, FirstName = "Michael", LastName = "Miller", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1495)},
    };
    private readonly List<DataItem> _editableItems2 = new()
    {
        new DataItem{Id = 0, FirstName = "James", LastName = "Smith", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1263)},
        new DataItem{Id = 1, FirstName = "Mary", LastName = "Johnson", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1121)},
        new DataItem{Id = 2, FirstName = "Robert", LastName = "Williams", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(210)},
        new DataItem{Id = 3, FirstName = "Patricia", LastName = "Brown", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(720)},
        new DataItem{Id = 4, FirstName = "John", LastName = "Jones", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(550)},
        new DataItem{Id = 5, FirstName = "Jennifer", LastName = "Garcia", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(160)},
        new DataItem{Id = 6, FirstName = "Michael", LastName = "Miller", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1495)},
    };
    private readonly List<DataItem> _editableItems3 = new()
    {
        new DataItem{Id = 0, FirstName = "James", LastName = "Smith", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1263)},
        new DataItem{Id = 1, FirstName = "Mary", LastName = "Johnson", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1121)},
        new DataItem{Id = 2, FirstName = "Robert", LastName = "Williams", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(210)},
        new DataItem{Id = 3, FirstName = "Patricia", LastName = "Brown", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(720)},
        new DataItem{Id = 4, FirstName = "John", LastName = "Jones", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(550)},
        new DataItem{Id = 5, FirstName = "Jennifer", LastName = "Garcia", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(160)},
        new DataItem{Id = 6, FirstName = "Michael", LastName = "Miller", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1495)},
    };
    private readonly List<DataItem> _items = new()
    {
        new DataItem{Id = 0, FirstName = "James", LastName = "Smith", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1263)},
        new DataItem{Id = 1, FirstName = "Mary", LastName = "Johnson", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1121)},
        new DataItem{Id = 2, FirstName = "Robert", LastName = "Williams", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(210)},
        new DataItem{Id = 3, FirstName = "Patricia", LastName = "Brown", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(720)},
        new DataItem{Id = 4, FirstName = "John", LastName = "Jones", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(550)},
        new DataItem{Id = 5, FirstName = "Jennifer", LastName = "Garcia", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(160)},
        new DataItem{Id = 6, FirstName = "Michael", LastName = "Miller", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1495)},
    };
    private readonly List<DataItem> _items2 = new()
    {
        new DataItem{Id = 0, FirstName = "James", LastName = "Smith", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1263)},
        new DataItem{Id = 1, FirstName = "Mary", LastName = "Johnson", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1121)},
        new DataItem{Id = 2, FirstName = "Robert", LastName = "Williams", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(210)},
        new DataItem{Id = 3, FirstName = "Patricia", LastName = "Brown", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(720)},
        new DataItem{Id = 4, FirstName = "John", LastName = "Jones", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(550)},
        new DataItem{Id = 5, FirstName = "Jennifer", LastName = "Garcia", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(160)},
        new DataItem{Id = 6, FirstName = "Michael", LastName = "Miller", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1495)},
        new DataItem{Id = 7, FirstName = "Linda", LastName = "Davis", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(1372)},
        new DataItem{Id = 8, FirstName = "William", LastName = "Rodriguez", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(150)},
        new DataItem{Id = 9, FirstName = "Elizabeth", LastName = "Martinez", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(650)},
        new DataItem{Id = 10, FirstName = "David", LastName = "Hernandez", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1000)},
        new DataItem{Id = 11, FirstName = "Barbara", LastName = "Lopez", IsExecutive = false, HireDate = DateTime.Now - TimeSpan.FromDays(1759)},
        new DataItem{Id = 12, FirstName = "Richard", LastName = "Gonzales", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(2007)},
        new DataItem{Id = 13, FirstName = "Susan", LastName = "Wilson", IsExecutive = true, HireDate = DateTime.Now - TimeSpan.FromDays(1847)},
    };
    private Func<DataGridRequest, Task<DataPage<DataItem>>> _loadItems => async request =>
    {
        await Task.Delay(1000);
        return new DataPage<DataItem>(
            _items.Query(request).ToList(),
            (ulong)_items.Count,
            (ulong)_items.Count > request.Offset + request.Count);
    };
    private DataItem? _selectedItem;
    private List<DataItem> _selectedItems = new();
}