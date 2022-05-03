namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

internal class IgnoreConverter : TagConverter
{
    public override void Register(MarkdownConverter converter)
    {
        converter.Register("col", this);
        converter.Register("colgroup", this);
        converter.Register("script", this);
        converter.Register("style", this);
    }
}
