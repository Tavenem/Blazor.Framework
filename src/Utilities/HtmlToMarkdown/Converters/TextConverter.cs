using HtmlAgilityPack;
using System.Text;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class TextConverter : TagConverter
{
    private static readonly Dictionary<string, string> _EscapedKeyChars = new()
    {
        { "*", @"\*" },
        { "_", @"\_" },
    };
    private static readonly Regex _WithinBackticks = new("`.*?`");

    public override void Register(MarkdownConverter converter)
        => converter.Register("#text", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        if (string.IsNullOrEmpty(node.InnerText))
        {
            return;
        }

        // Do not decode &lt; and &gt; since these signal HTML content in markdown
        var content = System.Net.WebUtility.HtmlDecode(node.InnerText
            .Replace("&lt;", "%3C")
            .Replace("&gt;", "%3E"))
            .Replace("%3C", "&lt;")
            .Replace("%3E", "&gt;");

        //strip leading spaces and tabs for text within list item
        var parent = node.ParentNode;
        if (trim || parent.Name is "ol" or "ul" or "tr")
        {
            content = content.Trim();
        }

        if (parent.Name is "p" or "#document")
        {
            content = content
                .Replace("\r\n", " ")
                .Replace('\n', ' ');
        }

        foreach (var item in _EscapedKeyChars)
        {
            content = content.Replace(item.Key, item.Value);
        }
        content = _WithinBackticks.Replace(
            content,
            p => p.Value
                .Replace(@"\*", "*")
                .Replace(@"\_", "_"));

        if (modifier is not null)
        {
            content = modifier.Invoke(content);
        }

        sb.Append(content);
    }
}
