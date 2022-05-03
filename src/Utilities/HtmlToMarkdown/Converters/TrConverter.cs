using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class TrConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("tr", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        var indentation = GetIndentation(node);
        sb.Append(' ', indentation)
            .Append('|');

        var length = sb.Length;

        ConvertChildren(node, sb, true);

        if (sb.Length == length)
        {
            sb.Length -= indentation + 1;
            return;
        }

        sb.AppendLine();

        if (node.ChildNodes.FindFirst("th") is not null)
        {
            sb.Append(' ', indentation)
                .Append("| ");

            var started = false;
            foreach (var child in node
                .ChildNodes
                .Where(x => x.Name.ToLowerInvariant() is "th" or "td"))
            {
                if (started)
                {
                    sb.Append(" | ");
                }

                var align = child.GetAttributeValue("align", string.Empty);
                if (align is "left" or "center")
                {
                    sb.Append(':');
                }

                sb.Append("---");

                if (align is "right" or "center")
                {
                    sb.Append(':');
                }

                started = true;
            }

            sb.AppendLine(" |");
        }
    }
}
