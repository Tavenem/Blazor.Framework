using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A popover component which displays above other elements.
/// </summary>
public partial class Popover : IAsyncDisposable
{
    private bool _disposedValue;
    private PopoverHandler? _handler;
    private bool _initialized;

    /// <summary>
    /// <para>
    /// The id of an element which should be used as the anchor for this popover
    /// (optional).
    /// </para>
    /// <para>
    /// If no anchor element is set, the popover's nearest containing parent
    /// with relative position is used as its anchor, as well as its container.
    /// </para>
    /// </summary>
    /// <remarks>
    /// The anchor element must have the same offset parent as the popover
    /// (nearest positioned ancestor element in the containment hierarchy).
    /// </remarks>
    [Parameter] public string? AnchorId { get; set; }

    /// <summary>
    /// <para>
    /// The anchor point of the element to which the popover is attached.
    /// </para>
    /// <para>
    /// For example, <see cref="Origin.Bottom_Right"/> means that the popover
    /// will be attached to the bottom-right corner of the anchor element.
    /// </para>
    /// </summary>
    [Parameter] public Origin AnchorOrigin { get; set; } = Origin.Bottom_Center;

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// The delay between opening the popover and performing the visibility
    /// transition, in milliseconds.
    /// </summary>
    [Parameter] public double Delay { get; set; } = 0;

    /// <summary>
    /// <para>
    /// Controls how the popover behaves when there isn't enough space in the
    /// direction it would normally open.
    /// </para>
    /// <para>
    /// Defaults to <see cref="FlipBehavior.Filp_OnOpen"/>.
    /// </para>
    /// </summary>
    [Parameter] public FlipBehavior FlipBehavior { get; set; } = FlipBehavior.Filp_OnOpen;

    /// <summary>
    /// Whether the popover is currently visible.
    /// </summary>
    [Parameter] public bool IsOpen { get; set; }

    /// <summary>
    /// Whether the popover should have the same width at its anchor element.
    /// </summary>
    [Parameter] public bool MatchWidth { get; set; }

    /// <summary>
    /// <para>
    /// Sets the max-height CSS style for the popover.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxHeight { get; set; }

    /// <summary>
    /// <para>
    /// The connection point of the popover to the anchor point.
    /// </para>
    /// <para>
    /// For example, <see cref="Origin.Top_Left"/> means that the top-left
    /// corner of the popover will be connected to the anchor point.
    /// </para>
    /// </summary>
    [Parameter] public Origin PopoverOrigin { get; set; } = Origin.Top_Center;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("popover")
        .Add(PopoverOrigin.ToCSS())
        .Add($"anchor-{AnchorOrigin.ToCSS()}")
        .Add(FlipBehavior.ToCSS())
        .Add(ThemeColor.ToCSS())
        .Add("open", IsOpen)
        .Add("match-width", MatchWidth)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssStyle => new CssBuilder(Style)
        .AddStyle("transition-delay", $"{Delay}ms")
        .AddStyle("max-height", MaxHeight)
        .AddStyle("overflow-y", "auto", !string.IsNullOrEmpty(MaxHeight))
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    [Inject] private FrameworkJsInterop JsInterop { get; set; } = default!;

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
    /// <returns>
    /// A <see cref="Task" /> representing any asynchronous operation.
    /// </returns>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await JsInterop.InitializePopoversAsync();
            _handler = await JsInterop.RegisterPopoverAsync(AnchorId);
            StateHasChanged();
        }
        else if (!_initialized && _handler is not null)
        {
            await _handler.Initialize();
            _initialized = true;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing && _handler is not null)
            {
                try
                {
                    await JsInterop.UnregisterPopoverHandler(_handler);
                }
                catch (JSDisconnectedException) { }
                catch (TaskCanceledException) { }
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'DisposeAsync(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }
}