using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class DivConverter : TagConverter
{
    private static readonly string[] _blockTags = new string[]
    {
        "pre",
        "p",
        "ol",
        "oi",
        "table"
    };

    public override void Register(MarkdownConverter converter)
        => converter.Register("div", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        var containsBlock = !trim
            && node.ChildNodes.Count == 1
            && _blockTags.Contains(node.FirstChild.Name);

        var classValue = string.Join(' ', node.GetClasses());
        var hasClass = !string.IsNullOrEmpty(classValue);

        if (hasClass
            || (!trim
            && !containsBlock
            && !FirstNodeWithinCell(node)))
        {
            sb.AppendLine();
        }

        if (hasClass)
        {
            sb.Append(":::")
                .AppendLine(classValue);
        }

        ConvertChildren(node, sb, trim, modifier);

        if (hasClass)
        {
            sb.AppendLine()
                .Append(":::");
        }

        if (hasClass
            || (!trim
            && !containsBlock
            && !LastNodeWithinCell(node)))
        {
            sb.AppendLine();
        }
    }
}
