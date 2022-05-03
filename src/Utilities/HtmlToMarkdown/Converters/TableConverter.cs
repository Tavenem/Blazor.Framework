using HtmlAgilityPack;
using System.Text;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class TableConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
        => converter.Register("table", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        sb.AppendLine()
            .AppendLine();

        if (node.SelectNodes("//th")?.FirstOrDefault() is null)
        {
            var firstRow = node.SelectNodes("//tr")?.FirstOrDefault();
            if (firstRow is not null)
            {
                var colCount = firstRow.ChildNodes.Count(n => n.Name.Contains("td"));

                sb.Append("| ");
                for (var i = 0; i < colCount; i++)
                {
                    if (i > 0)
                    {
                        sb.Append(" | ");
                    }
                    sb.Append("<!---->");
                }
                sb.AppendLine(" |")
                    .Append("| ");
                for (var i = 0; i < colCount; i++)
                {
                    if (i > 0)
                    {
                        sb.Append(" | ");
                    }
                    sb.Append("---");
                }
                sb.AppendLine(" |");
            }
        }

        ConvertChildren(node, sb);

        sb.AppendLine();
    }
}
