namespace Tavenem.Blazor.Framework.Services.Editor;

internal struct EditorCommandUpdate
{
    public Dictionary<EditorCommandType, EditorCommandInfo>? Commands { get; set; }
    public string? CurrentNode { get; set; }
}
