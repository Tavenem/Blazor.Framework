using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class PConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("p", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        if (node.ParentNode.Name.ToLowerInvariant() is "li" or "ol" or "ul"
            && node.ParentNode.FirstChild != node)
        {
            sb.AppendLine();

            var depth = node.Ancestors("ol").Count()
                + node.Ancestors("ul").Count();
            sb.Append(' ', depth * 4);
        }
        else if (!FirstNodeWithinCell(node))
        {
            sb.AppendLine();
        }

        ConvertChildren(node, sb, true, modifier);

        if (!trim && !LastNodeWithinCell(node))
        {
            sb.AppendLine();
        }
    }
}