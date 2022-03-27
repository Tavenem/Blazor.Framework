using System.Text;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Defines a mask for an input value.
/// </summary>
public class InputMask
{
    private const char CharMask = '?';
    private const char DigitMask = '0';
    private const char LetterMask = 'x';
    private const char LetterMaskAlt = 'X';
    private const char LowerMask = 'a';
    private const char UpperMask = 'A';

    /// <summary>
    /// <para>
    /// A string defining the format of an input.
    /// </para>
    /// <para>
    /// In this string, the following characters have special meaning:
    /// <list type="table">
    /// <item>
    /// <term>?</term>
    /// <description>any single input character</description>
    /// </item>
    /// <item>
    /// <term>0</term>
    /// <description>any single digit [0-9]</description>
    /// </item>
    /// <item>
    /// <term>A</term>
    /// <description>
    /// <para>
    /// any single uppercase letter [A-Z]
    /// </para>
    /// <para>
    /// transforms an uppercase letter in this position to a lowercase letter
    /// </para>
    /// </description>
    /// </item>
    /// <item>
    /// <term>a</term>
    /// <description>
    /// <para>
    /// any single lowercase letter [a-z]
    /// </para>
    /// <para>
    /// transforms a lowercase letter in this position to an uppercase letter
    /// </para>
    /// </description>
    /// </item>
    /// <item>
    /// <term>x or X</term>
    /// <description>any single letter [a-zA-Z]</description>
    /// </item>
    /// </list>
    /// </para>
    /// <para>
    /// All other characters (including whitespace) are considered delimiters.
    /// </para>
    /// <para>
    /// To use a mask character as a delimiter, precede it with a '\' character.
    /// </para>
    /// <para>
    /// To use the '\' character as a delimiter (and to make a following mask character behave as
    /// usual), use a double "\\".
    /// </para>
    /// <para>
    /// May be <see langword="null"/> if all masks are defined with <see cref="Options"/>.
    /// </para>
    /// </summary>
    public string? Mask { get; set; }

    /// <summary>
    /// <para>
    /// A set of optional masks to apply when the input matches certain patterns.
    /// </para>
    /// <para>
    /// If more than one pattern matches a given input, the first one to match will apply.
    /// </para>
    /// </summary>
    public List<MaskOption>? Options { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="InputMask"/>.
    /// </summary>
    public InputMask() { }

    /// <summary>
    /// Constructs a new instance of <see cref="InputMask"/>.
    /// </summary>
    /// <param name="mask">
    /// <para>
    /// A string defining the format of an input.
    /// </para>
    /// <para>
    /// In this string, the following characters have special meaning:
    /// <list type="table">
    /// <item>
    /// <term>?</term>
    /// <description>any single input character</description>
    /// </item>
    /// <item>
    /// <term>0</term>
    /// <description>any single digit [0-9]</description>
    /// </item>
    /// <item>
    /// <term>A</term>
    /// <description>
    /// <para>
    /// any single uppercase letter [A-Z]
    /// </para>
    /// <para>
    /// transforms an uppercase letter in this position to a lowercase letter
    /// </para>
    /// </description>
    /// </item>
    /// <item>
    /// <term>a</term>
    /// <description>
    /// <para>
    /// any single lowercase letter [a-z]
    /// </para>
    /// <para>
    /// transforms a lowercase letter in this position to an uppercase letter
    /// </para>
    /// </description>
    /// </item>
    /// <item>
    /// <term>x or X</term>
    /// <description>any single letter [a-zA-Z]</description>
    /// </item>
    /// </list>
    /// </para>
    /// <para>
    /// All other characters (including whitespace) are considered delimiters.
    /// </para>
    /// <para>
    /// To use a mask character as a delimiter, precede it with a '\' character.
    /// </para>
    /// <para>
    /// To use the '\' character as a delimiter (and to make a following mask character behave as
    /// usual), use a double "\\".
    /// </para>
    /// <para>
    /// May be <see langword="null"/> if all masks are defined with <paramref name="options"/>.
    /// </para>
    /// </param>
    /// <param name="options">
    /// <para>
    /// A set of optional masks to apply when the input matches certain patterns.
    /// </para>
    /// <para>
    /// If more than one pattern matches a given input, the first one to match will apply.
    /// </para>
    /// </param>
    public InputMask(string? mask, params MaskOption[] options)
    {
        Mask = mask;
        Options = options.ToList();
    }

    /// <summary>
    /// Gets a string which represents the given <paramref name="input"/> formatted according to the
    /// mask.
    /// </summary>
    /// <param name="input">The raw input string.</param>
    /// <returns>
    /// The input string formatted according to the mask. Or, if the input does not conform to the
    /// mask's pattern, the unaltered input.
    /// </returns>
    public string? FormatInput(string? input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return null;
        }

        var mask = Mask;
        if (Options is not null)
        {
            foreach (var option in Options)
            {
                if (option.Length.HasValue)
                {
                    if (input.Length == option.Length
                        && option.Pattern?.IsMatch(input) != false)
                    {
                        mask = option.Mask;
                        break;
                    }
                }
                else if (option.Pattern?.IsMatch(input) == true)
                {
                    mask = option.Mask;
                    break;
                }
            }
        }
        if (string.IsNullOrEmpty(mask))
        {
            return input;
        }

        var sb = new StringBuilder();
        var i = 0;
        var m = 0;
        var escaped = false;
        bool newEscape;
        for (; m < mask.Length && i < input.Length; m++)
        {
            newEscape = false;
            switch (mask[m])
            {
                case CharMask:
                    if (escaped)
                    {
                        sb.Append(mask[m]);
                    }
                    else
                    {
                        sb.Append(input[i]);
                        i++;
                    }
                    break;
                case DigitMask:
                    if (escaped)
                    {
                        sb.Append(mask[m]);
                    }
                    else if (!char.IsDigit(input[i]))
                    {
                        return input;
                    }
                    else
                    {
                        sb.Append(input[i]);
                        i++;
                    }
                    break;
                case LetterMask:
                case LetterMaskAlt:
                    if (escaped)
                    {
                        sb.Append(mask[m]);
                    }
                    else if (!char.IsLetter(input[i]))
                    {
                        return input;
                    }
                    else
                    {
                        sb.Append(input[i]);
                        i++;
                    }
                    break;
                case LowerMask:
                    if (escaped)
                    {
                        sb.Append(mask[m]);
                    }
                    else if (!char.IsLetter(input[i]))
                    {
                        return input;
                    }
                    else if (char.IsUpper(input[i]))
                    {
                        sb.Append(char.ToLower(input[i]));
                        i++;
                    }
                    else
                    {
                        sb.Append(input[i]);
                        i++;
                    }
                    break;
                case UpperMask:
                    if (escaped)
                    {
                        sb.Append(mask[m]);
                    }
                    else if (!char.IsLetter(input[i]))
                    {
                        return input;
                    }
                    else if (char.IsLower(input[i]))
                    {
                        sb.Append(char.ToUpper(input[i]));
                        i++;
                    }
                    else
                    {
                        sb.Append(input[i]);
                        i++;
                    }
                    break;
                case '\\':
                    if (escaped)
                    {
                        sb.Append(mask[m]);
                        if (input[i] == mask[m])
                        {
                            i++;
                        }
                    }
                    else
                    {
                        newEscape = true;
                    }
                    break;
                default:
                    if (escaped)
                    {
                        sb.Append('\\');
                        if (input[i] == '\\')
                        {
                            i++;
                        }
                    }
                    sb.Append(mask[m]);
                    if (input[i] == mask[m])
                    {
                        i++;
                    }
                    break;
            }
            escaped = newEscape;
        }

        if (m < mask.Length
            || i < input.Length)
        {
            return input;
        }

        return sb.ToString();
    }
}
