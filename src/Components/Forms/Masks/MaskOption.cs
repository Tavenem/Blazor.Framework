using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A mask to be applied when the input matches a certain pattern, or is a certain length.
/// </summary>
public record MaskOption
{
    /// <summary>
    /// <para>
    /// A length which the input must have in order for the corresponding mask to be applied.
    /// </para>
    /// <para>
    /// Note: if both this and <see cref="Pattern"/> are <see langword="null"/>, this option will never
    /// apply.
    /// </para>
    /// </summary>
    public int? Length { get; set; }

    /// <summary>
    /// The mask to apply when the input matches the given prefix.
    /// </summary>
    public string Mask { get; set; }

    /// <summary>
    /// <para>
    /// A regular expression which the input must match in order for the corresponding mask to be applied.
    /// </para>
    /// <para>
    /// Note: if both this and <see cref="Length"/> are <see langword="null"/>, this option will never
    /// apply.
    /// </para>
    /// </summary>
    public Regex? Pattern { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="MaskOption"/>.
    /// </summary>
    /// <param name="mask">
    /// The mask to apply when the input matches the given prefix.
    /// </param>
    /// <param name="length">
    /// A length which the input must have in order for the corresponding mask to be applied.
    /// </param>
    /// <param name="pattern">
    /// A regular expression which the input must match in order for the corresponding mask to be applied.
    /// </param>
#if NET7_0_OR_GREATER
    public MaskOption(string mask, int length, [StringSyntax(StringSyntaxAttribute.Regex)] string? pattern = null)
#else
    public MaskOption(string mask, int length, string? pattern = null)
#endif
    {
        Mask = mask;
        Length = length;
        Pattern = string.IsNullOrEmpty(pattern)
            ? null
            : new(pattern);
    }

    /// <summary>
    /// Constructs a new instance of <see cref="MaskOption"/>.
    /// </summary>
    /// <param name="mask">
    /// The mask to apply when the input matches the given prefix.
    /// </param>
    /// <param name="pattern">
    /// A regular expression which the input must match in order for the corresponding mask to be applied.
    /// </param>
#if NET7_0_OR_GREATER
    public MaskOption(string mask, [StringSyntax(StringSyntaxAttribute.Regex)] string pattern)
#else
    public MaskOption(string mask, string? pattern = null)
#endif
    {
        Mask = mask;
        Pattern = string.IsNullOrEmpty(pattern)
            ? null
            : new(pattern);
    }
}
