namespace Tavenem.Blazor.Framework.Services;

internal class AppState
{
    private Dictionary<string, DataGridRequest>? _dataGridStates;

    public DataGridRequest GetGridState(string id) => _dataGridStates?.TryGetValue(id, out var value) == true
        ? value
        : default;

    public void SetGridState(string id, DataGridRequest request) => (_dataGridStates ??= new())[id] = request;
}
