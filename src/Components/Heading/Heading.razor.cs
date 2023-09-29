using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A heading component which generates an h# element, with theme support and support for automatic
/// page contents.
/// </summary>
public partial class Heading : IDisposable
{
    internal const string HeadingClassName = "heading";

    private bool _disposedValue;
    private ElementReference _element;

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A generated id will be assigned if none is supplied (including through splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string? Id { get; set; }

    /// <summary>
    /// The type of heading tag.
    /// </summary>
    [Parameter] public HeadingLevel Level { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// <para>
    /// An optional string which appears as the title of this heading in tables of contents.
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, its text content will be used.
    /// </para>
    /// </summary>
    [Parameter] public string? Title { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(HeadingClassName)
        .Add(ThemeColor.ToCSS())
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    private HeadingInfo? HeadingInfo { get; set; }

    internal string? IdValue => Id ?? HeadingInfo?.Id;

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
        Id ??= Guid.NewGuid().ToHtmlId();
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            Title ??= await _element.GetTextContentAsync();
            if (FrameworkLayout is not null)
            {
                HeadingInfo = new()
                {
                    Id = IdValue,
                    Level = Level,
                    Title = Title,
                };
                HeadingInfo.Id = FrameworkLayout.AddHeading(HeadingInfo);
            }
            StateHasChanged();
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing && HeadingInfo is not null && FrameworkLayout is not null)
            {
                FrameworkLayout.RemoveHeading(HeadingInfo);
            }

            _disposedValue = true;
        }
    }
}