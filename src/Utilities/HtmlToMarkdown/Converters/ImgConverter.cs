using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class ImgConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("img", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        if (string.Equals(node.ParentNode.Name, "a", StringComparison.InvariantCultureIgnoreCase))
        {
            return;
        }

        sb.Append("![")
            .Append(node.GetAttributeValue("alt", string.Empty).EscapeLink())
            .Append(node.GetAttributeValue("src", string.Empty));

        var title = node.GetAttributeValue("title", string.Empty);
        if (title.Length > 0)
        {
            sb.Append(" \"")
                .Append(title)
                .Append('"');
        }

        sb.Append(')');
    }
}
