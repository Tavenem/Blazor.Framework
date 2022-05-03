using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class HrConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("hr", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null) => sb.AppendLine()
        .AppendLine("* * *");
}
