using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An auto-generated list of page contents.
/// </summary>
public partial class Contents : IDisposable
{
    internal const string HeadingClassName = "tav-heading";

    private bool _disposedValue;
    private DotNetObjectReference<Contents>? _dotNetRef;

    /// <summary>
    /// <para>
    /// The breakpoint at which the list should be visible.
    /// </para>
    /// <para>
    /// Set to <see cref="Breakpoint.None"/> to make the list visible at all
    /// breakpoints.
    /// </para>
    /// </summary>
    [Parameter] public Breakpoint Breakpoint { get; set; }

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
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; } = ThemeColor.Primary;

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("list contents highlight-start dense")
        .Add(ThemeColor.ToCSS())
        .Add(BreakpointClass)
        .Add("d-none", Headings.Count == 0)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssStyle => new CssBuilder("max-width:15em")
        .AddStyle(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    private HeadingInfo? ActiveHeading { get; set; }

    private string BreakpointClass => Breakpoint switch
    {
        Breakpoint.None => "d-flex",
        _ => $"d-none d-{Breakpoint.ToCSS()}-flex",
    };

    [Inject, NotNull] private ContentsService? ContentsService { get; set; }

    private int LowestLevel => (int)(Headings
        .Where(x => x.Level != HeadingLevel.None)
        .MinBy(x => (int)x.Level)?.Level ?? HeadingLevel.None);

    private List<HeadingInfo> Headings { get; } = [];

    private int HighestLevel => (int)(Headings.MaxBy(x => (int)x.Level)?.Level ?? HeadingLevel.None);

    [Inject, NotNull] private NavigationManager? NavigationManager { get; set; }

    [Inject, NotNull] private ScrollService? ScrollService { get; set; }

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

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            NavigationManager.LocationChanged += OnLocationChanged;

            _dotNetRef = DotNetObjectReference.Create(this);
            await ScrollService.ScrollSpy(_dotNetRef, $"{HeadingClassName},h1,h2,h3,h4,h5,h6");

            Headings.AddRange(await ContentsService.GetHeadingsAsync(Id));
            if (Headings.Count > 0)
            {
                StateHasChanged();
            }
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Adds a heading to the contents list.
    /// </summary>
    /// <param name="heading">The heading to add.</param>
    /// <returns>
    /// The heading's ID. If it was <see langword="null"/> or empty, a new ID will be created.
    /// </returns>
    /// <remarks>
    /// This method can be used to add headings dynamically.
    /// </remarks>
    public string AddHeading(HeadingInfo heading)
    {
        Headings.Add(heading);
        if (string.IsNullOrEmpty(heading.Id))
        {
            heading.Id = $"heading-{Headings.Count}";
        }
        StateHasChanged();
        return heading.Id;
    }

    /// <summary>
    /// Invoked by JavaScript interop.
    /// </summary>
    [JSInvokable]
    public void RaiseOnScrollSpy(string? id)
    {
        ActiveHeading = string.IsNullOrEmpty(id)
            ? null
            : Headings.Find(x => x.Id == id);
        StateHasChanged();
    }

    /// <summary>
    /// Refreshes the headings list.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Useful if heading elements have been added or removed dynamically after the contents element
    /// was rendered.
    /// </para>
    /// <para>
    /// Note: any headings manually added with <see cref="AddHeading(HeadingInfo)"/> will be removed
    /// unless they use a heading element, or have the <c>tav-heading</c> CSS class.
    /// </para>
    /// </remarks>
    public async Task RefreshHeadingsAsync()
    {
        Headings.Clear();
        Headings.AddRange(await ContentsService.GetHeadingsAsync(Id));
        StateHasChanged();
    }

    /// <summary>
    /// Removes a heading from the contents list.
    /// </summary>
    /// <param name="heading">The heading to remove.</param>
    /// <remarks>
    /// Does not throw an error if the given heading is not present.
    /// </remarks>
    public void RemoveHeading(HeadingInfo heading)
    {
        Headings.Remove(heading);
        StateHasChanged();
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _dotNetRef?.Dispose();
            }

            _disposedValue = true;
        }
    }

    private async Task GoToAsync(HeadingInfo heading)
        => await ScrollService.ScrollToHeading(Id, (int)heading.Level, heading.Title);

    private string? HeadingStyle(HeadingInfo heading)
    {
        if (LowestLevel == 0)
        {
            return null;
        }

        var offset = heading.Level == HeadingLevel.None
            ? HighestLevel + 1
            : (int)heading.Level - LowestLevel;
        if (offset == 0)
        {
            return null;
        }

        return $"padding-inline-start:{offset * 0.5}rem";
    }

    private async void OnLocationChanged(object? sender, LocationChangedEventArgs e)
    {
        var count = Headings.Count;
        Headings.Clear();
        Headings.AddRange(await ContentsService.GetHeadingsAsync(Id));
        if (Headings.Count != count)
        {
            StateHasChanged();
        }
    }
}
