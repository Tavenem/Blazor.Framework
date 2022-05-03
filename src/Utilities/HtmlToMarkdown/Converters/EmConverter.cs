using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class EmConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
    {
        converter.Register("em", this);
        converter.Register("i", this);
    }

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        var alreadyEmphasized = node.Ancestors("i").Any()
            || node.Ancestors("em").Any();

        if (!alreadyEmphasized)
        {
            sb.Append('*');
        }

        var length = sb.Length;

        ConvertChildren(node, sb, trim, modifier);

        if (alreadyEmphasized
            || sb.Length == length)
        {
            return;
        }

        sb.Append('*');

        if (node.NextSibling?.Name.ToLowerInvariant() is "i" or "em")
        {
            sb.Append(' ');
        }
    }
}
