using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class AConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("a", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        var originalHref = node
            .GetAttributeValue("href", string.Empty)
            .Trim();
        var href = originalHref
            .Replace("(", "%28")
            .Replace(")", "%29")
            .Replace(" ", "%20");

        if (href.StartsWith("#")
            || string.IsNullOrEmpty(href))
        {
            ConvertChildren(node, sb, true);
            return;
        }

        sb.Append('[');

        var length = sb.Length;

        if (node.ChildNodes.Count != 1
            || node.FirstChild.Name == "img")
        {
            ConvertChildren(node, sb, true, x => x.EscapeLink());
        }
        else
        {
            ConvertChildren(node, sb, true);
        }

        if (sb.Length == length)
        {
            sb.Append(originalHref);
        }

        sb.Append("](")
            .Append(href);

        var title = node.GetAttributeValue("title", string.Empty);
        if (title.Length > 0)
        {
            sb.Append(" \"")
                .Append(title)
                .Append('"');
        }

        sb.Append(')');

        AppendAttributes(node, sb);
    }
}
