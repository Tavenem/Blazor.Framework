using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class LiConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("li", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        foreach (var innerList in node.SelectNodes("//ul|//ol") ?? Enumerable.Empty<HtmlNode>())
        {
            if (innerList.PreviousSibling?.NodeType == HtmlNodeType.Text)
            {
                innerList.PreviousSibling.InnerHtml = innerList.PreviousSibling.InnerHtml.WithoutNewlines();
            }
        }

        sb.Append(' ', GetIndentation(node, true));

        if (node.ParentNode?.Name == "ol")
        {
            sb.Append(node
                .ParentNode
                .SelectNodes("./li")
                .IndexOf(node) + 1)
                .Append(". ");
        }
        else
        {
            sb.Append("- ");
        }

        ConvertChildren(node, sb, true);

        sb.AppendLine();
    }
}
