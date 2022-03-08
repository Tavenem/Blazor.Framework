using Microsoft.AspNetCore.Components;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Text;

namespace Tavenem.Blazor.Framework.Docs.Utilities;

public static class CodeFormatter
{
    [Flags]
    private enum CodeType
    {
        None = 0,
        NewLine = 1 << 0,
        Whitespace = 1 << 1,
        Comment = 1 << 2,
        Operator = 1 << 3,
        Number = 1 << 4,
        Text = 1 << 5,
        String = 1 << 6,
        OpeningTag = 1 << 7,
        ClosingTag = 1 << 8,
        Tag = OpeningTag | ClosingTag,
        Misc = 1 << 9,
    }

    public static MarkupString CodeToMarkup(ReadOnlySpan<char> code, bool selectAll = false)
    {
        var sb = new StringBuilder("<pre class=\"");
        if (selectAll)
        {
            sb.Append("user-select-all ");
        }
        sb.AppendLine("pre-razor-code\">");

        var index = 0;
        var withinTag = false;
        var hasElement = false;
        var isDirective = false;
        var isHref = false;

        while (index < code.Length)
        {
            var (type, length) = NextChunk(code[index..], withinTag, isDirective);

            if ((CodeType.Tag & type) == type)
            {
                isHref = false;
                if (withinTag)
                {
                    if (type == CodeType.ClosingTag)
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
                else if (type == CodeType.OpeningTag)
                {
                    withinTag = true;
                    sb.Append("<span class=\"pre-tag\">")
                        .Append(Sanitized(code.Slice(index, length)))
                        .Append("</span>");
                }
                else
                {
                    sb.Append(Sanitized(code.Slice(index, length)));
                }
            }
            else
            {
                switch (type)
                {
                    case CodeType.NewLine:
                        isDirective = false;
                        isHref = false;
                        sb.AppendLine();
                        break;
                    case CodeType.Whitespace:
                    case CodeType.Number:
                        isDirective = false;
                        isHref = false;
                        sb.Append(code.Slice(index, length));
                        break;
                    case CodeType.Comment:
                        isDirective = false;
                        isHref = false;
                        sb.Append("<span class=\"pre-comment\">")
                            .Append(Sanitized(code.Slice(index, length)))
                            .Append("</span>");
                        break;
                    case CodeType.Operator:
                        if (isDirective
                            && code[index] == ':')
                        {
                            sb.Append("<span class=\"pre-directive\">:");
                        }
                        else
                        {
                            sb.Append("<span class=\"pre-operator\">")
                                .Append(code[index])
                                .Append("</span>");
                        }
                        break;
                    case CodeType.String:
                        var value = code.Slice(index + 1, length - 2);
                        if (value[0] == '@')
                        {
                            sb.Append(code[index]);
                            index++;

                            var directive = 1;
                            if (value.Length > 1
                                && value[1] == '(')
                            {
                                directive++;
                            }
                            sb.Append("<span class=\"pre-directive\">")
                                .Append(value[..directive])
                                .Append("</span>");
                            if (value.Length > 1
                                && value[1] == '(')
                            {
                                index++;
                            }

                            if (value.Contains('('))
                            {
                                MarkupCodeBlock(sb, code, ref index);
                            }
                            else
                            {
                                var isMethod = value.Length > 1
                                    && char.IsUpper(value[1]);
                                if (isMethod)
                                {
                                    sb.Append("<span class=\"pre-method\">");
                                }
                                sb.Append(Sanitized(value[1..]));
                                if (isMethod)
                                {
                                    sb.Append("</span>");
                                }
                                index += value.Length;
                            }

                            sb.Append(code[index]);
                            length = 1;
                        }
                        else if (isHref)
                        {
                            sb.Append(code[index]);
                            if (value.StartsWith("http"))
                            {
                                sb.Append("<u class=\"pre-element\">")
                                    .Append(Sanitized(value))
                                    .Append("</u>");
                            }
                            else
                            {
                                sb.Append(Sanitized(value));
                            }
                            sb.Append(code[index + length - 1]);
                        }
                        else
                        {
                            var dotIndex = value.IndexOf('.');
                            if (dotIndex == -1)
                            {
                                sb.Append(code[index]);
                                var isMethod = char.IsUpper(value[0]);
                                var isBool = !isMethod
                                    && (value.Equals("true", StringComparison.Ordinal)
                                    || value.Equals("false", StringComparison.Ordinal));
                                var isNumber = !isMethod
                                    && !isBool
                                    && double.TryParse(value, out _);
                                if (isMethod)
                                {
                                    sb.Append("<span class=\"pre-method\">");
                                }
                                else if (isBool)
                                {
                                    sb.Append("<span class=\"pre-element\">");
                                }
                                else if (isNumber)
                                {
                                    sb.Append("<span class=\"pre-enum\">");
                                }
                                sb.Append(Sanitized(value));
                                if (isMethod || isBool || isNumber)
                                {
                                    sb.Append("</span>");
                                }
                                sb.Append(code[index + length - 1]);
                            }
                            else
                            {
                                sb.Append(code[index])
                                    .Append("<span class=\"pre-enum\">")
                                    .Append(Sanitized(value[..dotIndex]))
                                    .Append("</span><span class=\"pre-operator\">.</span><span class=\"pre-value\">")
                                    .Append(Sanitized(value[(dotIndex + 1)..]))
                                    .Append("</span>")
                                    .Append(code[index + length - 1]);
                            }
                        }
                        isDirective = false;
                        break;
                    case CodeType.Text:
                        if (withinTag)
                        {
                            if (!isDirective)
                            {
                                if (hasElement)
                                {
                                    if (char.IsUpper(code[index]))
                                    {
                                        sb.Append("<span class=\"pre-component\">");
                                    }
                                    else
                                    {
                                        if (code.Slice(index, length)
                                            .Equals("href", StringComparison.Ordinal))
                                        {
                                            isHref = true;
                                        }
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
                            }
                            sb.Append(code.Slice(index, length))
                                .Append("</span>");
                        }
                        else
                        {
                            sb.Append(Sanitized(code.Slice(index, length)));
                        }
                        break;
                    default:
                        isDirective = false;
                        if (withinTag)
                        {
                            if (hasElement
                                && code[index] == '@')
                            {
                                sb.Append("<span class=\"pre-directive\">@");
                                isDirective = true;
                            }
                            else
                            {
                                sb.Append(Sanitized(code.Slice(index, length)));
                            }
                        }
                        else if (code[index] == '@'
                            && code.Length > index + 1)
                        {
                            if (char.IsUpper(code[index + 1]))
                            {
                                sb.Append("<span class=\"pre-directive\">@</span>");
                                index++;
                                var i = index;
                                while (i < code.Length
                                    && !char.IsWhiteSpace(code[i])
                                    && char.IsLetter(code[i]))
                                {
                                    i++;
                                }
                                if (code[i] == '(')
                                {
                                    MarkupCodeBlock(sb, code, ref index, '(');
                                    length = 0;
                                }
                                else
                                {
                                    i++;
                                    sb.Append(Sanitized(code[index..i]));
                                    length = i - index;
                                }
                            }
                            else if (code.Length > index + 4
                                && code.Slice(index + 1, 4)
                                .Equals("code", StringComparison.Ordinal))
                            {
                                var i = index + 5;
                                while (i < code.Length
                                    && char.IsWhiteSpace(code[i]))
                                {
                                    i++;
                                }
                                if (code[i] == '{')
                                {
                                    sb.Append("<span class=\"pre-directive\">")
                                        .Append(code[index..(i + 1)])
                                        .Append("</span>");
                                    index = i;

                                    MarkupCodeBlock(sb, code, ref index);
                                    length = 0;
                                }
                                else
                                {
                                    sb.Append(Sanitized(code.Slice(index, length)));
                                }
                            }
                            else if (char.IsLetter(code[index + 1]))
                            {
                                var i = index + 2;
                                while (i < code.Length
                                    && !char.IsWhiteSpace(code[i])
                                    && char.IsLetter(code[i]))
                                {
                                    i++;
                                }
                                var word = code[(index + 1)..i];
                                if (SyntaxFacts.IsReservedKeyword(SyntaxFacts.GetKeywordKind(word.ToString())))
                                {
                                    sb.Append("<span class=\"pre-directive\">@</span>");
                                    index++;

                                    MarkupCodeBlock(sb, code, ref index);
                                    length = 0;
                                }
                                else
                                {
                                    sb.Append(Sanitized(code.Slice(index, length)));
                                }
                            }
                            else
                            {
                                sb.Append(Sanitized(code.Slice(index, length)));
                            }
                        }
                        else
                        {
                            sb.Append(Sanitized(code.Slice(index, length)));
                        }
                        break;
                }
            }

            index += length;
        }

        return (MarkupString)sb
            .AppendLine()
            .Append("</pre>")
            .ToString();
    }

    private static void MarkupCodeBlock(StringBuilder sb, ReadOnlySpan<char> code, ref int index, char setDelimiter = '{')
    {
        var delimiterCount = 0;
        var delimiter = code[index];
        var start = index + 1;
        var charDelimiter = char.IsLetter(delimiter);
        var razor = false;
        if (charDelimiter)
        {
            delimiter = setDelimiter;
            delimiterCount = -1;
            start--;
        }
        var closeDelimiter = delimiter switch
        {
            '@' => index > 0 && code[index - 1] == '"' ? '"' : '\n',
            '(' => ')',
            '{' => '}',
            _ => delimiter,
        };
        var i = index + 1;
        while (i < code.Length)
        {
            if (code[i] == closeDelimiter)
            {
                if (delimiterCount > 0)
                {
                    delimiterCount--;
                }
                else
                {
                    break;
                }
            }
            if (code[i] == delimiter)
            {
                delimiterCount++;
            }

            if (charDelimiter
                && code[i] == '<'
                && code.Length > i + 1
                && char.IsLetter(code[i + 1]))
            {
                razor = true;
                break;
            }
            i++;
        }
        if (charDelimiter && !razor)
        {
            i++;
        }
        if (i > index + 2)
        {
            MarkupCSharpCode(sb, code[start..i].ToString());
        }
        index = i;
        if (!charDelimiter && index < code.Length)
        {
            switch (code[index])
            {
                case '"':
                    sb.Append("<span class=\"pre-string\">")
                        .Append(code[index])
                        .Append("</span>");
                    break;
                default:
                    sb.Append("<span class=\"pre-directive\">")
                        .Append(code[index])
                        .Append("</span>");
                    break;
            }
            index++;
        }
    }

    private static void MarkupCSharpCode(StringBuilder sb, string code)
    {
        var syntaxTree = CSharpSyntaxTree.ParseText(code);
        if (syntaxTree is null)
        {
            sb.Append(code);
            return;
        }

        var root = syntaxTree.GetRoot();
        if (root is null)
        {
            sb.Append(code);
            return;
        }

        foreach (var token in root.DescendantTokens(descendIntoTrivia: true))
        {
            foreach (var trivia in token.LeadingTrivia)
            {
                switch (trivia.Kind())
                {
                    case SyntaxKind.DocumentationCommentExteriorTrivia:
                    case SyntaxKind.EndOfDocumentationCommentToken:
                    case SyntaxKind.MultiLineCommentTrivia:
                    case SyntaxKind.MultiLineDocumentationCommentTrivia:
                    case SyntaxKind.SingleLineDocumentationCommentTrivia:
                        sb.Append("<span class=\"pre-comment\">")
                            .Append(trivia)
                            .Append("</span>");
                        break;
                    default:
                        sb.Append(trivia);
                        break;
                }
            }

            var kind = token.Kind();
            if (token.IsKeyword())
            {
                switch (kind)
                {
                    case SyntaxKind.BreakKeyword:
                    case SyntaxKind.CaseKeyword:
                    case SyntaxKind.CatchKeyword:
                    case SyntaxKind.ContinueKeyword:
                    case SyntaxKind.DoKeyword:
                    case SyntaxKind.ElseKeyword:
                    case SyntaxKind.ForEachKeyword:
                    case SyntaxKind.ForKeyword:
                    case SyntaxKind.IfKeyword:
                    case SyntaxKind.InKeyword:
                    case SyntaxKind.ReturnKeyword:
                    case SyntaxKind.SwitchKeyword:
                    case SyntaxKind.ThrowKeyword:
                    case SyntaxKind.TryKeyword:
                    case SyntaxKind.WhileKeyword:
                    case SyntaxKind.YieldKeyword:
                        sb.Append("<span class=\"pre-control\">");
                        break;
                    default:
                        sb.Append("<span class=\"pre-element\">");
                        break;
                }
                sb.Append(Sanitized(token.Text))
                    .Append("</span>");
            }
            else if (token.RawKind is >= 8100 and <= 8299)
            {
                sb.Append("<span class=\"pre-operator\">")
                    .Append(Sanitized(token.Text))
                    .Append("</span>");
            }
            else
            {
                switch (kind)
                {
                    case SyntaxKind.IdentifierToken:
                        SyntaxNodeOrToken original = token;
                        var parent = token.Parent;
                        if (parent?.IsKind(SyntaxKind.IdentifierName) == true)
                        {
                            original = parent;
                            parent = parent.Parent;
                        }
                        if (parent is null)
                        {
                            if (char.IsUpper(token.Text[0]))
                            {
                                if (token.Text[0] == 'I'
                                    && token.Text.Length > 1
                                    && char.IsUpper(token.Text[1]))
                                {
                                    sb.Append("<span class=\"pre-enum\">")
                                        .Append(token.Text)
                                        .Append("</span>");
                                }
                                else
                                {
                                    sb.Append("<span class=\"pre-class\">")
                                        .Append(token.Text)
                                        .Append("</span>");
                                }
                            }
                            else
                            {
                                sb.Append("<span class=\"pre-attribute\">")
                                    .Append(token.Text)
                                    .Append("</span>");
                            }
                        }
                        else if (parent.IsKind(SyntaxKind.MethodDeclaration)
                            || parent.IsKind(SyntaxKind.LocalFunctionStatement))
                        {
                            sb.Append("<span class=\"pre-method\">")
                                .Append(token.Text)
                                .Append("</span>");
                        }
                        else if (parent.IsKind(SyntaxKind.PropertyDeclaration))
                        {
                            sb.Append(token.Text);
                        }
                        else if (!char.IsUpper(token.Text[0]))
                        {
                            sb.Append("<span class=\"pre-attribute\">")
                                .Append(token.Text)
                                .Append("</span>");
                        }
                        else if (token.Text[0] == 'I'
                            && token.Text.Length > 1
                            && char.IsUpper(token.Text[1]))
                        {
                            sb.Append("<span class=\"pre-enum\">")
                                .Append(token.Text)
                                .Append("</span>");
                        }
                        else if (parent.IsKind(SyntaxKind.InvocationExpression))
                        {
                            sb.Append("<span class=\"pre-method\">")
                                .Append(token.Text)
                                .Append("</span>");
                        }
                        else
                        {
                            original.SpanStart.ToString();

                            var hasDot = parent.ChildTokens().Any(x => x.IsKind(SyntaxKind.DotToken));
                            var dot = hasDot
                                ? parent.ChildTokens().FirstOrDefault(x => x.IsKind(SyntaxKind.DotToken))
                                : new SyntaxToken();

                            if (parent.Parent?.IsKind(SyntaxKind.InvocationExpression) == true)
                            {
                                if (!hasDot || original.SpanStart > dot.SpanStart)
                                {
                                    sb.Append("<span class=\"pre-method\">")
                                        .Append(token.Text)
                                        .Append("</span>");
                                }
                                else
                                {
                                    sb.Append("<span class=\"pre-class\">")
                                        .Append(token.Text)
                                        .Append("</span>");
                                }
                            }
                            else if (!hasDot)
                            {
                                sb.Append("<span class=\"pre-class\">")
                                    .Append(token.Text)
                                    .Append("</span>");
                            }
                            else if (original.SpanStart > dot.SpanStart)
                            {
                                sb.Append("<span class=\"pre-value\">")
                                    .Append(token.Text)
                                    .Append("</span>");
                            }
                            else
                            {
                                sb.Append("<span class=\"pre-enum\">")
                                    .Append(token.Text)
                                    .Append("</span>");
                            }
                        }
                        break;
                    case SyntaxKind.InterpolatedStringEndToken:
                    case SyntaxKind.InterpolatedStringStartToken:
                    case SyntaxKind.InterpolatedStringTextToken:
                    case SyntaxKind.InterpolatedStringToken:
                    case SyntaxKind.InterpolatedVerbatimStringStartToken:
                    case SyntaxKind.StringLiteralToken:
                        sb.Append("<span class=\"pre-string\">")
                            .Append(Sanitized(token.Text))
                            .Append("</span>");
                        break;
                    case SyntaxKind.NumericLiteralToken:
                        sb.Append("<span class=\"pre-enum\">")
                            .Append(token.Text)
                            .Append("</span>");
                        break;
                    default:
                        sb.Append(Sanitized(token.Text));
                        break;
                }
            }

            foreach (var trivia in token.TrailingTrivia)
            {
                switch (trivia.Kind())
                {
                    case SyntaxKind.DocumentationCommentExteriorTrivia:
                    case SyntaxKind.EndOfDocumentationCommentToken:
                    case SyntaxKind.MultiLineCommentTrivia:
                    case SyntaxKind.MultiLineDocumentationCommentTrivia:
                    case SyntaxKind.SingleLineDocumentationCommentTrivia:
                        sb.Append("<span class=\"pre-comment\">")
                            .Append(trivia)
                            .Append("</span>");
                        break;
                    default:
                        sb.Append(trivia);
                        break;
                }
            }
        }
    }

    private static (CodeType type, int length) NextChunk(ReadOnlySpan<char> input, bool withinTag, bool isDirective)
    {
        if (input.Length == 0)
        {
            return (CodeType.None, 0);
        }

        // Handle newlines
        if (input[0] is '\n' or '\r')
        {
            if (input.Length > 1
                && (input[1] is '\n' or '\r'))
            {
                return (CodeType.NewLine, 2);
            }
            return (CodeType.NewLine, 1);
        }

        // Handle comments
        if (input.Length > 3
            && input[0] == '<'
            && input[1] == '!'
            && input[2] == '-'
            && input[3] == '-')
        {
            var i = 4;
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

        // Handle whitespace
        var index = 0;
        while (index < input.Length
            && char.IsWhiteSpace(input[index]))
        {
            index++;
        }
        if (index > 0)
        {
            return (CodeType.Whitespace, index);
        }

        // Handle numbers
        if (char.IsDigit(input[0]))
        {
            var i = 0;
            while (i < input.Length
                && (char.IsDigit(input[i])
                || input[i] == '.'
                || input[i] == ','))
            {
                i++;
            }
            if (input[i - 1] is '.' or ',')
            {
                i--;
            }
            return (CodeType.Number, i);
        }

        // Only recognize close tags within a tag
        if (withinTag)
        {
            if (input[0] == '>')
            {
                return (CodeType.ClosingTag, 1);
            }

            if (input.Length > 1
                && input[0] == '/'
                && input[1] == '>')
            {
                return (CodeType.ClosingTag, 2);
            }

            // Only treat = as an operator within tags
            if (input[0] is '=')
            {
                return (CodeType.Operator, 1);
            }

            // Only treat : as an operator after an in-tag directive
            if (isDirective
                && input[0] is ':')
            {
                return (CodeType.Operator, 1);
            }

            // Only treat " and ' as string delimiters within tags
            if (input[0] is '\'' or '"')
            {
                index = 1;
                var escapeCount = 0;
                var altEscapeCount = 0;
                var isAlt = false;
                var alt = input[0] == '\''
                    ? '"'
                    : '\'';
                while (index < input.Length)
                {
                    if (input[index] == alt)
                    {
                        if (isAlt)
                        {
                            escapeCount--;
                            isAlt = false;
                        }
                        else
                        {
                            escapeCount++;
                            isAlt = true;
                        }
                    }
                    if (input[index] == input[0])
                    {
                        if (isAlt)
                        {
                            altEscapeCount++;
                            isAlt = false;
                        }
                        else if (altEscapeCount > 0)
                        {
                            altEscapeCount--;
                            isAlt = true;
                        }
                        else
                        {
                            break;
                        }
                    }
                    index++;
                }
                if (index < input.Length
                    && input[index] == input[0])
                {
                    index++;
                }
                if (index > 0)
                {
                    return (CodeType.String, index);
                }
            }
        }
        // Only recognize open tag or open end tag when not within a tag
        else if (input[0] == '<')
        {
            if (input.Length > 1
                && input[1] == '/')
            {
                return (CodeType.OpeningTag, 2);
            }

            return (CodeType.OpeningTag, 1);
        }

        if (!char.IsLetter(input[0]))
        {
            return (CodeType.Misc, 1);
        }

        while (index < input.Length
            && !char.IsWhiteSpace(input[index])
            && (char.IsLetterOrDigit(input[index])
            || input[index] == '_'
            || input[index] == '-'))
        {
            index++;
        }
        return (CodeType.Text, index);
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

    private static StringBuilder Sanitized(string input)
        => Sanitized(input.AsSpan());
}
