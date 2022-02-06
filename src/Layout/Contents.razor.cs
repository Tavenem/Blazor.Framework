using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An auto-generated list of page contents.
/// </summary>
public partial class Contents : IDisposable
{
    private readonly List<HeadingData> _headings = new();

    private bool _disposedValue;

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
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; } = ThemeColor.Primary;

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("list contents highlight-start darken")
        .Add(ThemeColor.ToCSS())
        .Add("d-none", _headings.Count == 0)
        .Add(BreakpointClass, _headings.Count > 0)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssStyle => new CssBuilder("max-width:15em")
        .AddStyle(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    private string BreakpointClass => Breakpoint switch
    {
        Breakpoint.None => "d-flex",
        _ => $"d-none d-{Breakpoint.ToCSS()}-flex",
    };

    [CascadingParameter] private FrameworkLayout? Framework { get; set; }

    [Inject] private FrameworkJsInterop JsInterop { get; set; } = default!;

    private int LowestLevel => (int)(_headings
        .Where(x => x.Level != HeadingLevel.None)
        .MinBy(x => (int)x.Level)?.Level ?? HeadingLevel.None);

    private int HighestLevel => (int)(_headings
        .MaxBy(x => (int)x.Level)?.Level ?? HeadingLevel.None);

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized() => Framework?.Add(this);

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
                Framework?.Remove(this);
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Refresh the headings listed by the component.
    /// </summary>
    public async Task RefreshHeadingsAsync()
    {
        _headings.Clear();
        var headings = await JsInterop.GetHeadings();
        _headings.AddRange(headings);
        await InvokeAsync(StateHasChanged);
    }

    internal void SetActiveHeading(string? id)
    {
        foreach (var heading in _headings)
        {
            heading.IsActive = heading.Id == id;
        }
        StateHasChanged();
    }

    private string? HeadingStyle(HeadingData heading)
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
}
