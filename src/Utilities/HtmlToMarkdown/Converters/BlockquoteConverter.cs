using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class BlockquoteConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("blockquote", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        if (!trim)
        {
            sb.AppendLine()
                .AppendLine();
        }

        var child = new StringBuilder();
        ConvertChildren(node, child, true);
        foreach (var line in child
            .ToString()
            .ReadLines())
        {
            sb.Append("> ")
                .AppendLine(line);
        }

        if (!trim)
        {
            sb.AppendLine();
        }
    }
}
