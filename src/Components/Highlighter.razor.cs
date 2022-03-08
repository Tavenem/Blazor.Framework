using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// This component provides highlighting for text content.
/// </summary>
public partial class Highlighter
{
    private IEnumerable<HighlightingChunk>? _chunks;

    /// <summary>
    /// <para>
    /// Whether to accept only case-sensitive matches for the <see cref="HighlightedText"/>.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool CaseSensitive { get; set; }

    /// <summary>
    /// The highlighted text.
    /// </summary>
    [Parameter] public string? HighlightedText { get; set; }

    /// <summary>
    /// <para>
    /// Whether <see cref="HighlightedText"/> is a regular expression.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool IsRegex { get; set; }

    /// <summary>
    /// The text in which a portion may be highlighted.
    /// </summary>
    [Parameter] public string? Text { get; set; }

    /// <summary>
    /// <para>
    /// Whether to highlight the entire word, if a match is found within it.
    /// </para>
    /// <para>
    /// Ignored if <see cref="WholeWord"/> is <see langword="true"/> (since partial matches within a
    /// word are impossible).
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool HighlightWholeWord { get; set; }

    /// <summary>
    /// <para>
    /// Whether to match only whole words.
    /// </para>
    /// <para>
    /// Defaults to <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool WholeWord { get; set; }

    /// <summary>
    /// The final value assigned to the style attribute, including component values and anything
    /// assigned by the user in <see cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssStyle => new CssBuilder()
        .AddStyle("padding-left:0;padding-right:0")
        .AddStyle(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in
    /// the render tree, and the incoming values have been assigned to properties.
    /// </summary>
    protected override void OnParametersSet() => _chunks = Text.GetHighlightingChunks(
        HighlightedText,
        CaseSensitive,
        IsRegex,
        WholeWord,
        HighlightWholeWord);
}