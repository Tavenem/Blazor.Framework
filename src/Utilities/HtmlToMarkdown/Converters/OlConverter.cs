using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class OlConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
    {
        converter.Register("ol", this);
        converter.Register("ul", this);
    }

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        // Lists inside tables are not supported as markdown; pass through as HTML
        if (node.Ancestors("table").Any())
        {
            sb.Append(node.OuterHtml);
            return;
        }

        var nested = !trim
            && node.ParentNode.Name.ToLowerInvariant() is "ol" or "ul";
        if (!nested)
        {
            sb.AppendLine();
        }

        ConvertChildren(node, sb, trim, modifier);

        if (!nested)
        {
            sb.AppendLine();
        }
    }
}
