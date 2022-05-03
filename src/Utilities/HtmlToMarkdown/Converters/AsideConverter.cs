using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class AsideConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("aside", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        if (!trim)
        {
            sb.AppendLine();
        }
        ConvertChildren(node, sb, true, modifier);
        if (!trim)
        {
            sb.AppendLine();
        }
    }
}
