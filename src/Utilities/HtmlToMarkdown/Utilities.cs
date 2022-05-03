using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown;

internal static class Utilities
{
    [return: NotNullIfNotNull("value")]
    public static string? EscapeLink(this string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }
        return Regex.Replace(value, @"\r?\n\s*\r?\n", Environment.NewLine, RegexOptions.Singleline)
            .Replace("[", @"\[")
            .Replace("]", @"\]");
    }

    [return: NotNullIfNotNull("value")]
    public static string? NormalizeSpaces(this string? value) => value?
        .Replace('\u0020', ' ')
        .Replace('\u00A0', ' ');

    [return: NotNullIfNotNull("value")]
    public static string? ReplaceTabs(this string? value) => value?.Replace("\t", "    ");

    [return: NotNullIfNotNull("value")]
    public static string? WithoutNewlines(this string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return null;
        }
        return value.Trim().TrimEnd('\r', '\n');
    }
}
