using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class StrongConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
    {
        converter.Register("strong", this);
        converter.Register("b", this);
    }

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        var alreadyStrong = node.Ancestors("b").Any()
            || node.Ancestors("strong").Any();

        if (!alreadyStrong)
        {
            sb.Append("**");
        }

        var length = sb.Length;

        ConvertChildren(node, sb, trim, modifier);

        if (alreadyStrong
            || sb.Length == length)
        {
            return;
        }

        sb.Append("**");

        if (node.NextSibling?.Name.ToLowerInvariant() is "b" or "strong")
        {
            sb.Append(' ');
        }
    }
}
