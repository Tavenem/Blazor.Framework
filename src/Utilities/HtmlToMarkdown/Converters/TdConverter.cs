using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class TdConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
    {
        converter.Register("td", this);
        converter.Register("th", this);
    }

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        sb.Append(' ');

        ConvertChildren(node, sb, true, x => x?.Replace(Environment.NewLine, "<br>"));

        sb.Append(" |");
    }
}
