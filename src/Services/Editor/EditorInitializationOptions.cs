namespace Tavenem.Blazor.Framework.Services.Editor;

internal struct EditorInitializationOptions
{
    public bool AutoFocus { get; set; }
    public string? InitialValue { get; set; }
    public EditorMode Mode { get; set; }
    public string? Placeholder { get; set; }
    public bool ReadOnly { get; set; }
    public string Syntax { get; set; }
    public bool UpdateOnInput { get; set; }
}
