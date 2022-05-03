using HtmlAgilityPack;
using System.Text;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal abstract class TagConverter
{
    protected TagConverter() { }

    public virtual void Convert(HtmlNode node, StringBuilder sb)
    {
        if (node.GetAttributeValue("style", string.Empty).Length > 0)
        {
            sb.Append(node.OuterHtml);
        }

        ConvertInner(node, sb);
    }

    public virtual void Register(MarkdownConverter converter) { }

    protected static void AppendAttributes(HtmlNode node, StringBuilder sb, bool space = false)
    {
        var classes = node.GetClasses();
        var hasClass = classes.Any();
        if (!string.IsNullOrEmpty(node.Id)
            || hasClass)
        {
            if (space)
            {
                sb.Append(' ');
            }

            sb.Append('{');

            var started = false;

            if (!string.IsNullOrEmpty(node.Id))
            {
                sb.Append('#')
                    .Append(node.Id);
                started = true;
            }

            foreach (var c in classes)
            {
                if (started)
                {
                    sb.Append(' ');
                }

                sb.Append('.')
                    .Append(c);

                started = true;
            }

            sb.Append('}');
        }
    }

    protected static void ConvertChildren(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    {
        if (!node.HasChildNodes)
        {
            return;
        }

        foreach (var child in node.ChildNodes)
        {
            MarkdownConverter
                .Instance
                .GetConverterFor(node.Name)
                .ConvertInner(child, sb, trim, modifier);
        }
    }

    protected static StringBuilder? ConvertChildren(HtmlNode node)
    {
        if (!node.HasChildNodes)
        {
            return null;
        }

        var sb = new StringBuilder();
        foreach (var child in node.ChildNodes)
        {
            MarkdownConverter
                .Instance
                .GetConverterFor(node.Name)
                .ConvertInner(child, sb);
        }
        return sb;
    }

    protected static bool FirstNodeWithinCell(HtmlNode node)
    {
        if (node.ParentNode.Name.ToLowerInvariant() is not "td" and not "th")
        {
            return false;
        }

        var pNodeIndex = node.ParentNode.ChildNodes.GetNodeIndex(node);
        if (pNodeIndex == 0)
        {
            return true;
        }

        if (pNodeIndex > 1)
        {
            return false;
        }

        return node.ParentNode.FirstChild.Name == "#text"
            && Regex.IsMatch(node.ParentNode.FirstChild.InnerText, @"^\s*$");
    }

    protected static int GetIndentation(HtmlNode node, bool isLi = false)
    {
        var depth = node.Ancestors("ol").Count()
            + node.Ancestors("ul").Count();

        if (depth == 0)
        {
            return 0;
        }

        if (isLi)
        {
            depth--;
        }

        return depth * 4;
    }

    protected static bool LastNodeWithinCell(HtmlNode node)
    {
        if (node.ParentNode.Name.ToLowerInvariant() is not "td" and not "th")
        {
            return false;
        }

        var pNodeIndex = node.ParentNode.ChildNodes.GetNodeIndex(node);

        var cellNodeCount = node.ParentNode.ChildNodes.Count;
        if (pNodeIndex == cellNodeCount - 1)
        {
            return true;
        }

        if (pNodeIndex <= cellNodeCount - 2)
        {
            return false;
        }

        return node.ParentNode.LastChild.Name == "#text"
            && Regex.IsMatch(node.ParentNode.LastChild.InnerText, @"^\s*$");
    }

    protected virtual void ConvertInner(
        HtmlNode node,
        StringBuilder sb,
        bool trim = false,
        Func<string?, string?>? modifier = null)
    { }
}
