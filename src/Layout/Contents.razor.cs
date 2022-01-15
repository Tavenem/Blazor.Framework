using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An auto-generated list of page contents.
/// </summary>
public partial class Contents
{
    private readonly List<HeadingData> _headings = new();

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
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected string ClassName => new CssBuilder("list contents left-select darken")
        .Add(ThemeColor.ToCSS())
        .Add("d-none", _headings.Count == 0)
        .Add(BreakpointClass, _headings.Count > 0)
        .Add(Class)
        .AddClassFromDictionary(UserAttributes)
        .ToString();

    private string BreakpointClass => Breakpoint switch
    {
        Breakpoint.None => "d-flex",
        _ => $"d-none d-{Breakpoint.ToCSS}-flex",
    };

    [Inject] private FrameworkJsInterop? JsInterop { get; set; }

    /// <summary>
    /// Method invoked after each time the component has been rendered. Note
    /// that the component does not automatically re-render after the completion
    /// of any returned <see cref="Task" />, because that would cause an
    /// infinite render loop.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <returns>A <see cref="Task" /> representing any asynchronous
    /// operation.</returns>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        _headings.Clear();
        if (JsInterop is null)
        {
            return;
        }

        var headings = await JsInterop.GetHeadings();
        _headings.AddRange(headings);
    }
}
