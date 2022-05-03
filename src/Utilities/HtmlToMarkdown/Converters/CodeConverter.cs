using HtmlAgilityPack;
using System.Net;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class CodeConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("code", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null) => sb.Append('`')
        .Append(WebUtility.HtmlDecode(node.InnerText))
        .Append('`');
}
