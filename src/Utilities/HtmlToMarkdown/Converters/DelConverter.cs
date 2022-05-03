using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class DelConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("del", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        var alreadyEmphasized = node.Ancestors("del").Any();

        if (!alreadyEmphasized)
        {
            sb.Append("~~");
        }

        var length = sb.Length;

        ConvertChildren(node, sb, trim, modifier);

        if (alreadyEmphasized
            || sb.Length == length)
        {
            return;
        }

        sb.Append("~~");

        if (node.NextSibling?.Name.ToLowerInvariant() == "del")
        {
            sb.Append(' ');
        }
    }
}
