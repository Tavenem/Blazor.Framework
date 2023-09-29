using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework;

internal static class InternalExtensions
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

    public static IEnumerable<string> ReadLines(this string value)
    {
        string? line;
        using var sr = new StringReader(value);
        while ((line = sr.ReadLine()) is not null)
        {
            yield return line;
        }
    }

    [return: NotNullIfNotNull(nameof(value))]
    public static StringBuilder? Replace(this StringBuilder? value, string pattern, string replacement, RegexOptions options)
    {
        if (value is null || value.Length == 0)
        {
            return value;
        }

        return new StringBuilder(Regex.Replace(value.ToString(), pattern, replacement, options));
    }

    [return: NotNullIfNotNull(nameof(value))]
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

    [return: NotNullIfNotNull(nameof(value))]
    public static string? ToTrimmedString(this StringBuilder? value)
    {
        if (value is null || value.Length == 0)
        {
            return value?.ToString();
        }

        value = value.TrimEnd();

        if (value.Length > 0
            && char.IsWhiteSpace(value[0]))
        {
            for (var i = 0; i < value.Length; i++)
            {
                if (!char.IsWhiteSpace(value[i]))
                {
                    return value.ToString(i, value.Length - i);
                }
            }
        }
        return value.ToString();
    }

    [return: NotNullIfNotNull(nameof(value))]
    public static StringBuilder? TrimEnd(this StringBuilder? value)
    {
        if (value is null || value.Length == 0)
        {
            return value;
        }

        var index = value.Length - 1;
        for (; index >= 0; index--)
        {
            if (!char.IsWhiteSpace(value[index]))
            {
                break;
            }
        }

        if (index < value.Length - 1)
        {
            value.Length = index + 1;
        }

        return value;
    }

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
