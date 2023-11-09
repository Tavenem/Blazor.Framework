using Markdig;
using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Components.MarkdownRenderer;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Renders markdown-formatted text as sanitized HTML.
/// </summary>
public partial class MarkdownRenderer
{
    /// <summary>
    /// The rendered HTML.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This value will be non-<see langword="null"/> after the component's parameters have been
    /// set.
    /// </para>
    /// <para>
    /// The content is sanitized prior to being assigned.
    /// </para>
    /// </remarks>
    public string? HTML { get; private set; }

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A generated id will be assigned if none is supplied (including through splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// The markdown-formatted string to display.
    /// </summary>
    [Parameter] public string? Value { get; set; }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }

        HTML = RenderHtml(Value);
    }

    /// <summary>
    /// Renders the given <paramref name="markdown"/> to HTML.
    /// </summary>
    /// <param name="markdown">A markdown-formatted string.</param>
    /// <returns>An HTML-formatted string.</returns>
    /// <remarks>
    /// Sanitizes the HTML prior to returning a value.
    /// </remarks>
    public static string RenderHtml(string? markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
        {
            return string.Empty;
        }

        var html = Markdown.ToHtml(markdown, MarkdownPipelineConfig.MarkdownPipeline);
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        return MarkdownPipelineConfig.HtmlSanitizer.Sanitize(html);
    }
}