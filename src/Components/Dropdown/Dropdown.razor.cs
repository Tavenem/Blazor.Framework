using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A popup menu activated by a button.
/// </summary>
public partial class Dropdown : IAsyncDisposable
{
    private readonly AdjustableTimer _timer;

    private MouseEvent _activation;
    private int _buttonMouseEnterListenerId;
    private int _buttonMouseLeaveListenerId;
    private bool _disposedValue;
    private DotNetObjectReference<Dropdown>? _dotNetRef;
    private bool _isMouseOver;
    private bool _isOpen;
    private int _popoverMouseEnterListenerId;
    private int _popoverMouseLeaveListenerId;

    /// <summary>
    /// <para>
    /// The type of interaction which will trigger this menu.
    /// </para>
    /// <para>
    /// Set to <see cref="MouseEvent.LeftClick"/> by default.
    /// </para>
    /// </summary>
    [Parameter] public MouseEvent ActivationType { get; set; } = MouseEvent.LeftClick;

    /// <summary>
    /// <para>
    /// The id of an element which should be used as the anchor for the popover
    /// (optional).
    /// </para>
    /// <para>
    /// If left unset the button will automatically be set as the anchor.
    /// </para>
    /// </summary>
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
    [Parameter] public Origin? AnchorOrigin { get; set; }

    /// <summary>
    /// Whether the popover list should use dense padding.
    /// </summary>
    [Parameter] public bool Dense { get; set; }

    /// <summary>
    /// Whether this menu is currently disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// If <see langword="true"/> no trigger button will appear. Instead, the container itself will
    /// respond to interaction events.
    /// </summary>
    [Parameter] public bool HideButton { get; set; }

    /// <summary>
    /// An icon to display on the toggle button.
    /// </summary>
    [Parameter] public string? Icon { get; set; }

    /// <summary>
    /// <para>
    /// The id of the button element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// Invoked when the dropdown opens or closes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsOpenChanged { get; set; }

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
    /// If <see langword="true"/> the popover will open at the position of the mouse click or tap
    /// event.
    /// </summary>
    [Parameter] public bool OpenAtPointer { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the popover.
    /// </summary>
    [Parameter] public string? PopoverClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the popover.
    /// </summary>
    [Parameter] public string? PopoverStyle { get; set; }

    /// <summary>
    /// <para>
    /// The connection point of the popover to the anchor point.
    /// </para>
    /// <para>
    /// For example, <see cref="Origin.Top_Left"/> means that the top-left
    /// corner of the popover will be connected to the anchor point.
    /// </para>
    /// </summary>
    [Parameter] public Origin? PopoverOrigin { get; set; }

    /// <summary>
    /// Text to display on the toggle button.
    /// </summary>
    [Parameter] public string? Text { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// A reference to the button element.
    /// </summary>
    protected ElementReference Button { get; set; }

    /// <summary>
    /// The CSS class assigned to the button, including component values.
    /// </summary>
    protected override string? CssClass => new CssBuilder("btn")
        .Add(Class)
        .Add("btn-icon", !string.IsNullOrEmpty(Icon) && string.IsNullOrEmpty(Text))
        .Add(ThemeColor.ToCSS())
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component values and anything
    /// assigned by the user in <see cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssStyle => new CssBuilder("position:relative")
        .AddStyle(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The CSS class assigned to the popover's list, including component values.
    /// </summary>
    protected string? ListCssClass => new CssBuilder("list clickable filled solid")
        .Add("dense", Dense)
        .Add(ThemeColor.ToCSS())
        .ToString();

    /// <summary>
    /// The popover component.
    /// </summary>
    protected Popover? Popover { get; set; }

    /// <summary>
    /// The CSS class assigned to the popover, including component values.
    /// </summary>
    protected string? PopoverCssClass => new CssBuilder(PopoverClass)
        .Add("filled")
        .ToString();

    private Origin? AnchorOriginOverride => OpenAtPointer ? Origin.Top_Left : null;

    private Origin AnchorOriginValue => AnchorOriginOverride ?? AnchorOrigin ?? DefaultAnchorOrigin;

    private Origin DefaultAnchorOrigin => HideButton ? Origin.Top_Left : Origin.Bottom_Center;

    private Origin DefaultPopoverOrigin => HideButton ? Origin.Top_Left : Origin.Top_Center;

    [Inject] private IJSRuntime JSRuntime { get; set; } = default!;

    [Inject] private NavigationManager NavigationManager { get; set; } = default!;

    private double? PopoverOffsetX { get; set; }

    private double? PopoverOffsetY { get; set; }

    private Origin PopoverOriginValue => PopoverOrigin ?? DefaultPopoverOrigin;

    [Inject] private UtilityService UtilityService { get; set; } = default!;

    /// <summary>
    /// Constructs a new instance of <see cref="Dropdown"/>.
    /// </summary>
    public Dropdown() => _timer = new(Close, 100);

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (Disabled && _isOpen)
        {
            Close();
        }

        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
    }

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
        if (firstRender)
        {
            _dotNetRef ??= DotNetObjectReference.Create(this);
            if (!HideButton)
            {
                _buttonMouseEnterListenerId = await Button.AddEventListenerAsync(
                    _dotNetRef,
                    "mouseenter",
                    nameof(OnButtonMouseEnterAsync));
                _buttonMouseLeaveListenerId = await Button.AddEventListenerAsync(
                    _dotNetRef,
                    "mouseleave",
                    nameof(OnButtonMouseLeaveAsync));
            }
            if (Popover is not null)
            {
                _popoverMouseEnterListenerId = await Popover.ElementReference.AddEventListenerAsync(
                    _dotNetRef,
                    "mouseenter",
                    nameof(OnPopoverMouseEnter));
                _popoverMouseLeaveListenerId = await Popover.ElementReference.AddEventListenerAsync(
                    _dotNetRef,
                    "mouseleave",
                    nameof(OnPopoverMouseLeave));
            }
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
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
    /// Close the dropdown.
    /// </summary>
    public void Close()
    {
        _timer.Cancel();
        _isMouseOver = false;
        _activation = MouseEvent.None;
        _isOpen = false;
        PopoverOffsetX = null;
        PopoverOffsetY = null;
        StateHasChanged();
    }

    /// <summary>
    /// Invoked by javascript internally.
    /// </summary>
    [JSInvokable]
    public async Task OnButtonMouseEnterAsync(MouseEventArgs e)
    {
        if (!_isOpen
            && ActivationType.HasFlag(MouseEvent.MouseOver))
        {
            await OpenAsync(e);
        }
    }

    /// <summary>
    /// Invoked by javascript internally.
    /// </summary>
    [JSInvokable]
    public async Task OnButtonMouseLeaveAsync()
    {
        if (!_isOpen)
        {
            return;
        }

        await Task.Delay(100);
        if (!_isMouseOver
            && _activation == MouseEvent.MouseOver)
        {
            Close();
        }
    }

    /// <summary>
    /// Invoked by javascript internally.
    /// </summary>
    [JSInvokable]
    public void OnPopoverMouseEnter() => _isMouseOver = true;

    /// <summary>
    /// Invoked by javascript internally.
    /// </summary>
    [JSInvokable]
    public void OnPopoverMouseLeave()
    {
        if (_isOpen
            && _activation == MouseEvent.MouseOver)
        {
            Close();
        }
    }

    /// <summary>
    /// <para>
    /// Opens the dropdown.
    /// </para>
    /// <para>
    /// If <see cref="OpenAtPointer"/> is <see langword="true"/> and <paramref name="e"/> is
    /// non-<see langword="null"/>, the dropdown will open at the position of the event.
    /// </para>
    /// </summary>
    /// <param name="e">An instance of <see cref="MouseEventArgs"/>.</param>
    public async Task OpenAsync(MouseEventArgs? e)
    {
        _timer.Cancel();
        if (Disabled)
        {
            return;
        }

        if (OpenAtPointer)
        {
            PopoverOffsetX = e?.ClientX;
            PopoverOffsetY = e?.ClientY;
        }

        if (e?.Type == "mouseenter")
        {
            _activation = MouseEvent.MouseOver;
        }
        else
        {
            _activation = GetMouseButton(e);
        }

        _isOpen = true;
        if (Popover is not null)
        {
            await Popover.ElementReference.FocusAsync();
        }
        StateHasChanged();
    }

    /// <summary>
    /// <para>
    /// Toggles the open state of the dropdown.
    /// </para>
    /// <para>
    /// If the dropdown is currently not open, <see cref="OpenAtPointer"/> is <see
    /// langword="true"/>, and <paramref name="e"/> is non-<see langword="null"/>, the dropdown will
    /// open at the position of the event.
    /// </para>
    /// </summary>
    /// <param name="e">An instance of <see cref="MouseEventArgs"/>.</param>
    public async Task ToggleAsync(MouseEventArgs? e)
    {
        Console.WriteLine("here");
        var correctButton = ActivationType.HasFlag(GetMouseButton(e));

        if (_isOpen)
        {
            Close();
            if (correctButton
                && OpenAtPointer)
            {
                await OpenAsync(e);
            }
        }
        else if (!Disabled && correctButton)
        {
            await OpenAsync(e);
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _dotNetRef?.Dispose();
                _timer.Dispose();

                IJSObjectReference? module = null;
                try
                {
                    module = await JSRuntime.InvokeAsync<IJSObjectReference>(
                        "import",
                        "./_content/Tavenem.Blazor.Framework/tavenem-utility.js");
                    if (!HideButton)
                    {
                        await module.InvokeVoidAsync(
                            "removeEventListenerById",
                            Id,
                            "mouseenter",
                            _buttonMouseEnterListenerId);
                        await module.InvokeVoidAsync(
                            "removeEventListenerById",
                            Id,
                            "mouseleave",
                            _buttonMouseLeaveListenerId);
                    }
                    if (Popover is not null)
                    {
                        await module.InvokeVoidAsync(
                            "removeEventListenerById",
                            Popover.Id,
                            "mouseenter",
                            _popoverMouseEnterListenerId);
                        await module.InvokeVoidAsync(
                            "removeEventListenerById",
                            Popover.Id,
                            "mouseleave",
                            _popoverMouseLeaveListenerId);
                    }
                }
                finally
                {
                    if (module is not null)
                    {
                        await module.DisposeAsync();
                    }
                }
            }

            _disposedValue = true;
        }
    }

    private static MouseEvent GetMouseButton(MouseEventArgs? e) => e is null
        ? MouseEvent.None
        : e.Button switch
        {
            0 => MouseEvent.LeftClick,
            2 => MouseEvent.RightClick,
            _ => MouseEvent.None,
        };

    private void OnMouseDown() => _timer.Cancel();

    private void StartClosing() => _timer.Start();
}