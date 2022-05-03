using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class PassThroughConverter : TagConverter
{
    public override void Convert(HtmlNode node, StringBuilder sb) => sb.Append(node.OuterHtml);
}
