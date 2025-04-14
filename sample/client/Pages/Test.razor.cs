using System.Text;

namespace Tavenem.Blazor.Framework.Sample.Client.Pages;

public partial class Test
{
    private readonly List<EditorButton> buttons = [];

    private string? PostContent { get; set; }

    private string? PriorContent { get; set; }

    public Test()
    {
        buttons.Add(new EditorButton
        {
            Action = InsertText,
            Icon = "read_more",
            Tooltip = "Insert sample text",
        });
    }

    private string? value = """
        Here is some *sample* text.

        Here is **another** line.

        And another.
        """;

    private string? InsertText(SelectedEditorText selectedEditorText)
    {
        PriorContent = value?.Length > selectedEditorText.Position
            ? value[..selectedEditorText.Position]
            : null;
        PostContent = value?.Length > selectedEditorText.Position
            ? value[selectedEditorText.Position..]
            : null;

        var replacement = new StringBuilder();
        if (value?.Length > selectedEditorText.RawTextFrom
            && selectedEditorText.RawTextFrom > 0
            && (!char.IsWhiteSpace(value[selectedEditorText.RawTextFrom - 1])
            || value.Length == selectedEditorText.RawTextFrom))
        {
            replacement.Append(' ');
        }

        replacement.Append("Inserted *text*");

        if (value?.Length > selectedEditorText.RawTextTo + 1
            && selectedEditorText.RawTextTo > 0
            && !char.IsWhiteSpace(value[selectedEditorText.RawTextTo]))
        {
            replacement.Append(' ');
        }
        return replacement.ToString();
    }
}
