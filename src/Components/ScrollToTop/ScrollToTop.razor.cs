using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Scrolls to the top of a selected element.
/// </summary>
public partial class ScrollToTop : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// The CSS selector to which the scroll event will be attached.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> the entire document will be the target.
    /// </para>
    /// </summary>
    [Parameter] public string? Selector { get; set; }

    /// <summary>
    /// <para>
    /// The distance in pixels from the top of the selected element at which the
    /// component becomes visible.
    /// </para>
    /// <para>
    /// Default is 300.
    /// </para>
    /// </summary>
    [Parameter] public int TopOffset { get; set; } = 300;

    /// <summary>
    /// <para>
    /// If set to <see langword="true"/>, the component starts visible.
    /// </para>
    /// <para>
    /// Otherwise it will become visible when the TopOffset is reached.
    /// </para>
    /// </summary>
    [Parameter] public bool Visible { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("scroll-to-top")
        .Add("hidden", !Visible)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    [Inject] private ScrollService ScrollService { get; set; } = default!;

    [Inject] private ScrollListener ScrollListener { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized() => FrameworkLayout?.Add(this);

    /// <summary>
    /// Method invoked after each time the component has been rendered.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            ScrollListener.Selector = Selector;
            ScrollListener.OnScroll += OnScroll;
        }
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
                FrameworkLayout?.Remove(this);
                ScrollListener.OnScroll -= OnScroll;
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

    private async Task OnClickAsync() => await ScrollService.ScrollToTop(ScrollListener?.Selector);

    private async void OnScroll(object? sender, ScrollEventArgs e)
    {
        var topOffset = e.NodeName == "#document"
            ? (e.FirstChildBoundingClientRect?.Top ?? 0) * -1
            : e.ScrollTop;

        if (topOffset >= TopOffset && !Visible)
        {
            Visible = true;
            await InvokeAsync(StateHasChanged);
        }
        else if (topOffset < TopOffset && Visible)
        {
            Visible = false;
            await InvokeAsync(StateHasChanged);
        }
    }
}
