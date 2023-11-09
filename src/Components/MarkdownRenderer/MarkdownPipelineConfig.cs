using Ganss.Xss;
using Markdig;

namespace Tavenem.Blazor.Framework.Components.MarkdownRenderer;

internal static class MarkdownPipelineConfig
{
    private static IHtmlSanitizer? _HtmlSanitizer;
    internal static IHtmlSanitizer HtmlSanitizer
    {
        get
        {
            if (_HtmlSanitizer is null)
            {
                _HtmlSanitizer = new HtmlSanitizer();
                _HtmlSanitizer.AllowedAttributes.Add("class");
                _HtmlSanitizer.AllowedAttributes.Add("role");
                _HtmlSanitizer.AllowedAttributes.Add("id");

                _HtmlSanitizer.RemovingAttribute += (_, e) => e.Cancel |= e.Attribute.Name.StartsWith("data-");
            }
            return _HtmlSanitizer;
        }
    }

    private static MarkdownPipeline? _MarkdownPipeline;
    internal static MarkdownPipeline MarkdownPipeline
        => _MarkdownPipeline ??= new MarkdownPipelineBuilder()
        .UseAbbreviations()
        .UseAutoIdentifiers()
        .UseCitations()
        .UseCustomContainers()
        .UseDefinitionLists()
        .UseEmphasisExtras()
        .UseFigures()
        .UseFooters()
        .UseFootnotes()
        .UseGridTables()
        .UseMathematics()
        .UsePipeTables()
        .UseListExtras()
        .UseTaskLists()
        .UseAutoLinks()
        .UseGenericAttributes()
        .UseSmartyPants()
        .Build();
}
