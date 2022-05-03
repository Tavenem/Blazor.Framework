using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class BrConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("br", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        if (!trim)
        {
            sb.AppendLine("  ");
        }
    }
}
