using System.Diagnostics.CodeAnalysis;
using System.Text;

namespace Tavenem.Blazor.Framework.Docs;

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
}
