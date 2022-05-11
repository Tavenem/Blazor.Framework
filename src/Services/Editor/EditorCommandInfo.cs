namespace Tavenem.Blazor.Framework.Services.Editor;

internal struct EditorCommandInfo
{
    public bool? Active { get; set; }
    public bool? Enabled { get; set; }
    public EditorCommandType Type { get; set; }
}