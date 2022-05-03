using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class BypassConverter : TagConverter
{
    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null) => ConvertChildren(node, sb);

    public override void Register(MarkdownConverter converter)
    {
        converter.Register("#document", this);
        converter.Register("html", this);
        converter.Register("body", this);
        converter.Register("thead", this);
        converter.Register("tbody", this);
    }
}
