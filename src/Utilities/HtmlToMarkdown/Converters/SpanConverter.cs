using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class SpanConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("span", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        var classes = node.GetClasses();
        var hasClass = classes.Any();

        if (!string.IsNullOrEmpty(node.Id)
            || hasClass)
        {
            sb.Append("::");
        }

        ConvertChildren(node, sb, trim, modifier);

        if (!string.IsNullOrEmpty(node.Id)
            || hasClass)
        {
            sb.Append("::");

            AppendAttributes(node, sb);
        }
    }
}
