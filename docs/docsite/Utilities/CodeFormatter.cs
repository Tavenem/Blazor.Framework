using Microsoft.AspNetCore.Components;
using System.Text;

namespace Tavenem.Blazor.Framework.Docs.Utilities;

public static class CodeFormatter
{
    public static MarkupString CodeToMarkup(ReadOnlySpan<char> code, bool selectAll = false)
    {
        var sb = new StringBuilder("<pre class=\"");
        if (selectAll)
        {
            sb.Append("user-select-all ");
        }
        sb.AppendLine("pre-razor-code\">");

        var index = 0;
        char? escape = null;
        var comment = false;
        var withinTag = false;
        var hasElement = false;
        var declaring = false;
        while (index < code.Length)
        {
            var (type, length) = ParseChunk(code[index..], escape, comment, withinTag);

            if (type == CodeType.NewLine)
            {
                declaring = false;
                sb.AppendLine();
                index += length;
                continue;
            }

            if (escape.HasValue)
            {
                if (code[index + length] != escape.Value)
                {
                    throw new InvalidOperationException("mismatched escape characters");
                }
                var value = code.Slice(index, length + 1);
                var dotIndex = value.IndexOf('.');
                if (dotIndex == -1)
                {
                    sb.Append(Sanitized(code.Slice(index, length + 1)))
                        .Append("</span>");
                }
                else
                {
                    var e = value[..dotIndex];
                    var v = value[(dotIndex + 1)..^1];
                    sb.Append("</span><span class=\"pre-enum\">")
                        .Append(Sanitized(e))
                        .Append("</span><span class=\"pre-operator\">")
                        .Append('.')
                        .Append("</span>")
                        .Append(Sanitized(v))
                        .Append("<span class=\"pre-value\">")
                        .Append(escape)
                        .Append("</span>");
                }

                escape = null;
                index++;
            }

            switch (type)
            {
                case CodeType.Comment:
                    if (comment)
                    {
                        sb.Append(Sanitized(code.Slice(index, length)))
                            .Append("</span>");
                    }
                    else
                    {
                        declaring = false;
                        sb.Append("<span class=\"pre-comment\">")
                            .Append(Sanitized(code.Slice(index, length)));
                    }
                    comment = !comment;
                    break;
                case CodeType.EscapeCharacter:
                    escape = code[index];
                    sb.Append("<span class=\"pre-value\">")
                        .Append(code[index]);
                    break;
                case CodeType.Operator:
                    sb.Append("<span class=\"pre-operator\">")
                        .Append(code[index])
                        .Append("</span>");
                    break;
                case CodeType.Tag:
                    if (withinTag)
                    {
                        if (length == 1)
                        {
                            if (code[index] == '>')
                            {
                                withinTag = false;
                                hasElement = false;
                                sb.Append("<span class=\"pre-tag\">")
                                    .Append(code[index])
                                    .Append("</span>");
                            }
                            else
                            {
                                throw new InvalidOperationException("mismatched tag characters");
                            }
                        }
                        else if (code[index] == '/'
                            && code[index + 1] == '>')
                        {
                            withinTag = false;
                            hasElement = false;
                            sb.Append("<span class=\"pre-tag\">")
                                .Append(code.Slice(index, length))
                                .Append("</span>");
                        }
                        else
                        {
                            throw new InvalidOperationException("mismatched tag characters");
                        }
                    }
                    else
                    {
                        withinTag = true;
                        sb.Append("<span class=\"pre-tag\">")
                            .Append(Sanitized(code.Slice(index, length)))
                            .Append("</span>");
                    }
                    break;
                default:
                    if (char.IsWhiteSpace(code[index]))
                    {
                        sb.Append(code.Slice(index, length));
                        break;
                    }
                    if (withinTag)
                    {
                        if (hasElement)
                        {
                            if (code[index] == '@')
                            {
                                declaring = true;
                                sb.Append("<span class=\"pre-directive\">");
                            }
                            else if (char.IsUpper(code[index]))
                            {
                                if (declaring)
                                {
                                    sb.Append("<span class=\"pre-enum\">");
                                }
                                else
                                {
                                    sb.Append("<span class=\"pre-component\">");
                                }
                            }
                            else
                            {
                                sb.Append("<span class=\"pre-attribute\">");
                            }
                        }
                        else
                        {
                            if (char.IsUpper(code[index]))
                            {
                                sb.Append("<span class=\"pre-component\">");
                            }
                            else
                            {
                                sb.Append("<span class=\"pre-element\">");
                            }
                            hasElement = true;
                        }
                        sb.Append(code.Slice(index, length))
                            .Append("</span>");
                    }
                    else if (code[index] == '@')
                    {
                        sb.Append("<span class=\"pre-directive\">");
                        if (length > 1 && char.IsUpper(code[index]))
                        {
                            sb.Append(code[index])
                                .Append("</span><span class=\"pre-attribute\">")
                                .Append(code.Slice(index + 1, length - 1))
                                .Append("</span>");
                        }
                        else
                        {
                            sb.Append(code.Slice(index, length))
                                .Append("</span>");
                            declaring = true;
                        }
                    }
                    else if (declaring)
                    {
                        sb.Append("<span class=\"pre-class\">")
                            .Append(Sanitized(code.Slice(index, length)))
                            .Append("</span>");
                    }
                    else
                    {
                        sb.Append(Sanitized(code.Slice(index, length)));
                    }
                    break;
            }

            index += length;
        }

        return (MarkupString)sb
            .AppendLine()
            .Append("</pre>")
            .ToString();
    }

    private static (CodeType type, int length) ParseChunk(
        ReadOnlySpan<char> input,
        char? escape,
        bool comment,
        bool withinTag)
    {
        if (input[0] is '\n' or '\r')
        {
            if (input.Length > 1
                && (input[1] is '\n' or '\r'))
            {
                return (CodeType.NewLine, 2);
            }
            return (CodeType.NewLine, 1);
        }

        if (comment)
        {
            var i = 0;
            while (i < input.Length)
            {
                if (input.Length > i + 2
                    && input[i] == '-'
                    && input[i + 1] == '-'
                    && input[i + 2] == '>')
                {
                    return (CodeType.Comment, i + 3);
                }
                i++;
            }
            if (i > 0)
            {
                return (CodeType.Comment, i);
            }
        }

        if (withinTag)
        {
            if (escape.HasValue)
            {
                var i = 0;
                while (i < input.Length
                    && input[i] != escape.Value)
                {
                    i++;
                }
                if (i > 0)
                {
                    return (CodeType.None, i);
                }
            }

            if (input[0] is '\'' or '"')
            {
                return (CodeType.EscapeCharacter, 1);
            }

            if (input[0] == '>')
            {
                return (CodeType.Tag, 1);
            }

            if (input[0] is '=')
            {
                return (CodeType.Operator, 1);
            }

            if (input.Length > 1
                && input[0] == '/'
                && input[1] == '>')
            {
                return (CodeType.Tag, 2);
            }
        }

        if (input.Length > 1
            && input[0] == '<'
            && input[1] == '/')
        {
            return (CodeType.Tag, 2);
        }

        if (input.Length > 3
            && input[0] == '<'
            && input[1] == '!'
            && input[2] == '-'
            && input[3] == '-')
        {
            return (CodeType.Comment, 4);
        }

        if (input[0] == '<')
        {
            return (CodeType.Tag, 1);
        }

        var index = 0;
        while (index < input.Length
            && char.IsWhiteSpace(input[index]))
        {
            index++;
        }
        if (index > 0)
        {
            return (CodeType.None, index);
        }

        while (index < input.Length
            && !char.IsWhiteSpace(input[index])
            && input[index] != '<'
            && input[index] != '>'
            && input[index] != '='
            && input[index] != '/')
        {
            index++;
        }
        return (CodeType.None, index);
    }

    private static StringBuilder Sanitized(ReadOnlySpan<char> input)
    {
        var sb = new StringBuilder();
        for (var i = 0; i < input.Length; i++)
        {
            if (input[i] == '<')
            {
                sb.Append("&lt;");
            }
            else
            {
                sb.Append(input[i]);
            }
        }
        return sb;
    }
}
