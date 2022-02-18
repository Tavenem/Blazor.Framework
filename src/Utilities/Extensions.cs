using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

internal static class Extensions
{
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
    public static string? ToJsString(this string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }
        return char.ToLowerInvariant(value[0]) + value[1..];
    }

    public static Dictionary<TKey, TValue> Without<TKey, TValue>(this Dictionary<TKey, TValue> dictionary, params TKey[] keys) where TKey : notnull
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
