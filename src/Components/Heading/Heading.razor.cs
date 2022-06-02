using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A heading component which geneates an h# element, with theme support
/// and support for automatic page contents.
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

    private string? CalculatedId { get; set; }

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    internal string? IdValue => Id ?? CalculatedId;

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
    }

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized() => CalculatedId = FrameworkLayout is null
        ? Guid.NewGuid().ToHtmlId()
        : FrameworkLayout.Add(this);

    /// <summary>
    /// Method invoked after each time the component has been rendered. Note that the component does
    /// not automatically re-render after the completion of any returned <see cref="Task" />,
    /// because that would cause an infinite render loop.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see cref="ComponentBase.OnAfterRender(bool)"
    /// /> has been invoked on this component instance; otherwise <c>false</c>.
    /// </param>
    /// <returns>A <see cref="Task" /> representing any asynchronous operation.</returns>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are useful for performing
    /// interop, or interacting with values received from <c>@ref</c>. Use the <paramref
    /// name="firstRender" /> parameter to ensure that initialization work is only performed once.
    /// </remarks>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && Title is null)
        {
            Title = await _element.GetTextContentAsync();
            StateHasChanged();
            FrameworkLayout?.RefreshContents();
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
            if (disposing && FrameworkLayout is not null)
            {
                FrameworkLayout.Remove(this);
            }

            _disposedValue = true;
        }
    }
}