using HtmlAgilityPack;
using System.Text;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class PreConverter : TagConverter
{
    private static readonly Regex _ClassRegex = new("(language-|highlight-source-)([a-zA-Z0-9]+)");

    public override void Register(MarkdownConverter converter)
        => converter.Register("pre", this);

    protected override void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        sb.AppendLine()
            .AppendLine();

        var indentation = GetIndentation(node);

        var language = GetLanguage(node);
        if (string.IsNullOrEmpty(language))
        {
            indentation += 4;
        }
        else
        {
            sb.Append(' ', indentation)
                .Append("```")
                .AppendLine(language);
        }

        var length = sb.Length;
        foreach (var line in System.Net.WebUtility
            .HtmlDecode(node.InnerText)
            .ReadLines())
        {
            sb.Append(' ', indentation)
                .AppendLine(line);
        }
        if (sb.Length == length
            && string.IsNullOrEmpty(language))
        {
            sb.Append(' ', indentation)
                .AppendLine();
        }

        if (!string.IsNullOrEmpty(language))
        {
            sb.Append(' ', indentation)
                .AppendLine("```");
        }
    }

    private static string GetLanguage(HtmlNode node)
    {
        var res = LanguageMatch(node);

        if (!res.Success && node.ParentNode is not null)
        {
            res = LanguageMatch(node.ParentNode);
        }

        if (!res.Success)
        {
            var cnode = node.ChildNodes["code"];
            if (cnode is not null)
            {
                res = LanguageMatch(cnode);
            }
        }

        return res.Success
            && res.Groups.Count == 2
            ? res.Groups[1].Value
            : string.Empty;
    }

    private static Match LanguageMatch(HtmlNode node)
    {
        var value = node.GetAttributeValue("class", string.Empty);
        return string.IsNullOrEmpty(value)
            ? Match.Empty
            : _ClassRegex.Match(value);
    }
}
