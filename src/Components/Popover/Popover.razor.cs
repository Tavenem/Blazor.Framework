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
    /// The id of an HTML element which should be used as the anchor for this popover (optional).
    /// </para>
    /// <para>
    /// If no anchor element is set, the popover's nearest containing parent with relative position
    /// is used as its anchor, as well as its container.
    /// </para>
    /// </summary>
    /// <remarks>
    /// The anchor element must have the same offset parent as the popover (nearest positioned
    /// ancestor element in the containment hierarchy).
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
    /// Defaults to <see cref="FlipBehavior.Flip_OnOpen"/>.
    /// </para>
    /// </summary>
    [Parameter] public FlipBehavior FlipBehavior { get; set; } = FlipBehavior.Flip_OnOpen;

    /// <summary>
    /// <para>
    /// The id of an HTML element which should be ignored for the purpose of determining when the
    /// popover's focus state changes.
    /// </para>
    /// <para>
    /// The may be the same as <see cref="AnchorId"/>, but does not need to be.
    /// </para>
    /// </summary>
    [Parameter] public string? FocusId { get; set; }

    /// <summary>
    /// Raised when the popover loses focus.
    /// </summary>
    [Parameter] public EventCallback FocusOut { get; set; }

    /// <summary>
    /// The id of the element.
    /// </summary>
    public string Id => $"popover-{_handler?.Id}";

    /// <summary>
    /// Whether the popover is currently visible.
    /// </summary>
    [Parameter] public bool IsOpen { get; set; }

    /// <summary>
    /// Whether the popover should have its max-width set to the width of its anchor element.
    /// </summary>
    [Parameter] public bool LimitWidth { get; set; }

    /// <summary>
    /// Whether the popover should have its min-width set to the width of its anchor element.
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
    /// Sets the max-width CSS style for the popover.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// <para>
    /// Default is "90vw."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxWidth { get; set; } = "90vw";

    /// <summary>
    /// A number of pixels this popover is offset from the left edge of its anchor.
    /// </summary>
    [Parameter] public double? OffsetX { get; set; }

    /// <summary>
    /// A number of pixels this popover is offset from the top edge of its anchor.
    /// </summary>
    [Parameter] public double? OffsetY { get; set; }

    /// <summary>
    /// <para>
    /// Set to enable absolute positioning. The popover will be placed this number of pixels from
    /// the left edge of the viewport.
    /// </para>
    /// <para>
    /// Note: both this and <see cref="PositionY"/> must be set, or the value will be ignored.
    /// </para>
    /// </summary>
    [Parameter] public double? PositionX { get; set; }

    /// <summary>
    /// <para>
    /// Set to enable absolute positioning. The popover will be placed this number of pixels from
    /// the top edge of the viewport.
    /// </para>
    /// <para>
    /// Note: both this and <see cref="PositionX"/> must be set, or the value will be ignored.
    /// </para>
    /// </summary>
    [Parameter] public double? PositionY { get; set; }

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

    internal ElementReference ElementReference { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("popover")
        .Add(PopoverOrigin.ToCSS())
        .Add($"anchor-{AnchorOrigin.ToCSS()}")
        .Add(FlipBehavior.ToCSS())
        .Add(ThemeColor.ToCSS())
        .Add("open", IsOpen)
        .Add("limit-width", LimitWidth)
        .Add("match-width", MatchWidth)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssStyle => new CssBuilder(Style)
        .AddStyle("transition-delay", $"{Delay}ms")
        .AddStyle("max-height", MaxHeight)
        .AddStyle("max-width", MaxWidth)
        .AddStyle("overflow-y", "auto", !string.IsNullOrEmpty(MaxHeight))
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    [Inject] private PopoverService PopoverService { get; set; } = default!;

    /// <summary>
    /// Sets parameters supplied by the component's parent in the render tree.
    /// </summary>
    /// <param name="parameters">The parameters.</param>
    /// <returns>
    /// A <see cref="Task" /> that completes when the component has finished updating and rendering
    /// itself.
    /// </returns>
    /// <remarks>
    /// <para>
    /// Parameters are passed when <see cref="ComponentBase.SetParametersAsync(ParameterView)" /> is
    /// called. It is not required that the caller supply a parameter value for all of the
    /// parameters that are logically understood by the component.
    /// </para>
    /// <para>
    /// The default implementation of <see cref="ComponentBase.SetParametersAsync(ParameterView)" />
    /// will set the value of each property decorated with <c>Parameter</c> or
    /// <c>CascadingParameter</c> that has a corresponding value in the <see cref="ParameterView"
    /// />. Parameters that do not have a corresponding value will be unchanged.
    /// </para>
    /// </remarks>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var initialOffsetX = OffsetX;
        var initialOffsetY = OffsetY;
        var initialPositionX = PositionX;
        var initialPositionY = PositionY;

        await base.SetParametersAsync(parameters);

        if (_handler is not null
            && _initialized)
        {
            if (OffsetX != initialOffsetX
                || OffsetY != initialOffsetY)
            {
                await _handler.SetOffsetAsync(OffsetX, OffsetY);
            }
            if (PositionX != initialPositionX
                || PositionY != initialPositionY)
            {
                await _handler.SetPositionAsync(PositionX, PositionY);
            }
        }
    }

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
            await PopoverService.InitializePopoversAsync();
            _handler = await PopoverService.RegisterPopoverAsync(AnchorId, FocusId);
            StateHasChanged();
        }
        else if (_handler is not null)
        {
            if (!_initialized)
            {
                await _handler.Initialize();
                _handler.FocusLeft += OnFocusOut;
                _initialized = true;
            }
            else
            {
                await _handler.RepositionPopoverAsync();
            }
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

    /// <summary>
    /// Gives focus to the popover element.
    /// </summary>
    public ValueTask FocusAsync() => ElementReference.FocusFirstAsync();

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
                _handler.FocusLeft -= OnFocusOut;
                try
                {
                    await PopoverService.UnregisterPopoverHandler(_handler);
                }
                catch (JSDisconnectedException) { }
                catch (TaskCanceledException) { }
            }

            _disposedValue = true;
        }
    }

    private async void OnFocusOut(object? sender, EventArgs e) => await FocusOut.InvokeAsync();
}