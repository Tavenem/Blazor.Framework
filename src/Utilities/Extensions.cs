using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework;

internal static class Extensions
{
    private const string NextBoundaryRegex = ".*\\b";
    private const string PreviousBoundaryRegex = "\\b[\\w]*";
    private const string WholeWordRegex = "\\b";

    public static IEnumerable<HighlightingChunk> GetHighlightingChunks(
        this string? text,
        string? highlightedText,
        bool caseSensitive = false,
        bool isRegex = false,
        bool wholeWord = false,
        bool highlightWholeWord = false)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new List<HighlightingChunk>();
        }
        if (string.IsNullOrWhiteSpace(highlightedText))
        {
            return new List<HighlightingChunk> { new() { Text = text } };
        }

        var regex = new StringBuilder("(");
        if (wholeWord)
        {
            regex.Append(WholeWordRegex);
        }
        else if (highlightWholeWord)
        {
            regex.Append(PreviousBoundaryRegex);
        }
        regex.Append(isRegex
            ? highlightedText
            : Regex.Escape(highlightedText));
        if (wholeWord)
        {
            regex.Append(WholeWordRegex);
        }
        else if (highlightWholeWord)
        {
            regex.Append(NextBoundaryRegex);
        }
        regex.Append(')');
        var pattern = regex.ToString();

        return Regex
            .Split(text,
            pattern,
            caseSensitive
                ? RegexOptions.None
                : RegexOptions.IgnoreCase)
            .Where(x => !string.IsNullOrEmpty(x))
            .Select(x => new HighlightingChunk
            {
                IsMatch = Regex.IsMatch(
                    x,
                    pattern,
                    caseSensitive
                        ? RegexOptions.None
                        : RegexOptions.IgnoreCase),
                Text = x,
            });
    }

    public static string? ToCSS(this Enum value)
    {
        if (value is null || Convert.ToInt32(value) == 0)
        {
            return null;
        }

        return value
            .ToString()
            .ToLowerInvariant()
            .Replace('_', '-');
    }

    [return: NotNullIfNotNull("value")]
    public static string? ToHumanReadable(this string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        var sb = new StringBuilder();
        var whitespace = false;
        for (var i = 0; i < value.Length; i++)
        {
            if (value[i] == '_')
            {
                sb.Append(' ');
                whitespace = false;
            }
            else if (whitespace && char.IsUpper(value[i]))
            {
                sb.Append(' ')
                    .Append(value[i]);
                whitespace = false;
            }
            else
            {
                sb.Append(value[i]);
                whitespace = char.IsWhiteSpace(value[i]);
            }
        }

        return sb.ToString();
    }

    public static string ToHumanReadable(this Enum value)
        => ToHumanReadable(value.ToString());

    [return: NotNullIfNotNull("value")]
    public static string? ToJsString(this string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }
        return char.ToLowerInvariant(value[0]) + value[1..];
    }

    public static string ToJsString(this DragEffect value) => value switch
    {
        DragEffect.None => "none",
        DragEffect.Copy => "copy",
        DragEffect.Link => "link",
        DragEffect.CopyLink => "copyLink",
        DragEffect.Move => "move",
        DragEffect.CopyMove => "copyMove",
        DragEffect.LinkMove => "linkMove",
        _ => "all",
    };

    public static string ToPixels(this double value) => value is < 0.00001 and > -0.00001
        ? "0px"
        : $"{value.ToString("F5").TrimEnd('0').TrimEnd('.')}px";

    public static Dictionary<TKey, TValue> With<TKey, TValue>(
        this Dictionary<TKey, TValue> dictionary,
        params KeyValuePair<TKey, TValue>[] values) where TKey : notnull
    {
        if (values.Length == 0)
        {
            return dictionary;
        }

        var copy = new Dictionary<TKey, TValue>(dictionary);
        foreach (var (key, value) in values)
        {
            copy.Add(key, value);
        }
        return copy;
    }

    public static Dictionary<TKey, TValue> Without<TKey, TValue>(
        this Dictionary<TKey, TValue> dictionary,
        params TKey[] keys) where TKey : notnull
    {
        if (keys.Length == 0)
        {
            return dictionary;
        }

        var copy = new Dictionary<TKey, TValue>(dictionary);
        foreach (var key in keys)
        {
            copy.Remove(key);
        }
        return copy;
    }
}
