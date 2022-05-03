using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class HConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
    {
        converter.Register("h1", this);
        converter.Register("h2", this);
        converter.Register("h3", this);
        converter.Register("h4", this);
        converter.Register("h5", this);
        converter.Register("h6", this);
    }

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        // Headings inside tables are not supported as markdown; pass through as HTML
        if (node.Ancestors("table").Any())
        {
            sb.Append(node.OuterHtml);
            return;
        }

        var endsWithNewLine = false;
        if (sb.Length >= Environment.NewLine.Length)
        {
            for (var i = 0; i < Environment.NewLine.Length; i++)
            {
                if (sb[^i] != Environment.NewLine[^i])
                {
                    break;
                }
            }
            endsWithNewLine = true;
        }
        if (!endsWithNewLine)
        {
            sb.AppendLine();
        }

        sb.Append('#', System.Convert.ToInt32(node.Name[1..]));
        ConvertChildren(node, sb, trim, modifier);
    }
}
