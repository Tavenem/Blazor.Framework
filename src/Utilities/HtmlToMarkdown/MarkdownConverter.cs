using HtmlAgilityPack;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.RegularExpressions;
using Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown.Converters;

namespace Tavenem.Blazor.Framework.Utilities.HtmlToMarkdown;

internal class MarkdownConverter
{
    private readonly Dictionary<string, TagConverter> _converters = new();
    private readonly PassThroughConverter _passThroughConverter;

    public static MarkdownConverter Instance { get; } = new();

    public MarkdownConverter()
    {
        _passThroughConverter = new PassThroughConverter();
        _passThroughConverter.Register(this);

        new AConverter().Register(this);
        new AsideConverter().Register(this);
        new BlockquoteConverter().Register(this);
        new BrConverter().Register(this);
        new BypassConverter().Register(this);
        new CodeConverter().Register(this);
        new DelConverter().Register(this);
        new DivConverter().Register(this);
        new EmConverter().Register(this);
        new HConverter().Register(this);
        new HrConverter().Register(this);
        new IgnoreConverter().Register(this);
        new InsConverter().Register(this);
        new LiConverter().Register(this);
        new MarkConverter().Register(this);
        new OlConverter().Register(this);
        new PConverter().Register(this);
        new PreConverter().Register(this);
        new SpanConverter().Register(this);
        new StrongConverter().Register(this);
        new SubConverter().Register(this);
        new SupConverter().Register(this);
        new TableConverter().Register(this);
        new TdConverter().Register(this);
        new TextConverter().Register(this);
        new TrConverter().Register(this);
    }

    /// <summary>
    /// Converts the given HTML into equivalent markdown-formatted text.
    /// </summary>
    /// <param name="html">HTML content</param>
    /// <returns>Markdown-formatted text</returns>
    [return: NotNullIfNotNull("html")]
    public string? Convert(string? html)
    {
        if (html is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        var doc = new HtmlDocument();
        doc.LoadHtml(html
            .NormalizeSpaces()
            .ReplaceTabs());

        var root = doc.DocumentNode;

        var body = root.Descendants("body").FirstOrDefault();
        if (body is not null)
        {
            root = body;
        }

        var sb = new StringBuilder();
        GetConverterFor(root.Name).Convert(root, sb);

        // replace new line after new line with break
        return Regex.Replace(
            sb.ToString(),
            @"(^\p{Zs}*(\r\n|\n)){2,}",
            $"{Environment.NewLine}<br>",
            RegexOptions.Multiline)
            .Trim();
    }

    public void Register(string tagName, TagConverter converter)
        => _converters[tagName] = converter;

    public TagConverter GetConverterFor(string tagName) => _converters.TryGetValue(tagName, out var converter)
        ? converter
        : _passThroughConverter;
}
