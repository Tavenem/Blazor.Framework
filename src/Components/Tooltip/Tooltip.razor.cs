using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Wraps content with a <see cref="Popover"/> displayed on hover.
/// </summary>
public partial class Tooltip : IDisposable
{
    private readonly AdjustableTimer _hideTimer;
    private readonly AdjustableTimer _showTimer;

    private bool _dismissed;
    private bool _disposedValue;
    private bool _visible;

    /// <summary>
    /// <para>
    /// Whether the tooltip should have an arrow pointing towards its anchor element.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool Arrow { get; set; } = true;

    /// <summary>
    /// The delay before showing the tooltip, in milliseconds.
    /// </summary>
    [Parameter] public int Delay { get; set; } = 0;

    /// <summary>
    /// <para>
    /// Whether the tooltip should be dismissed when it is tapped with the pointer.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>, which permits interaction with the tooltip content.
    /// </para>
    /// </summary>
    [Parameter] public bool DismissOnTap { get; set; }

    /// <summary>
    /// <para>
    /// Whether the container should be an inline element.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool Inline { get; set; }

    /// <summary>
    /// <para>
    /// Sets the max-height CSS style for the tooltip.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxHeight { get; set; }

    /// <summary>
    /// The side of the element on which the tooltip will appear (if there is room).
    /// </summary>
    [Parameter] public Side Side { get; set; } = Side.Bottom;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the tooltip.
    /// </summary>
    [Parameter] public string? TooltipClass { get; set; }

    /// <summary>
    /// The content of the tooltip.
    /// </summary>
    [Parameter] public RenderFragment? TooltipContent { get; set; }

    /// <summary>
    /// <para>
    /// HTML to display as a tooltip.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TooltipContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public MarkupString? TooltipMarkup { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the tooltip.
    /// </summary>
    [Parameter] public string? TooltipStyle { get; set; }

    /// <summary>
    /// <para>
    /// The text to display as a tooltip.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TooltipMarkup"/> or <see cref="TooltipContent"/> is non-<see
    /// langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? TooltipText { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("tooltip-root")
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("inline", Inline)
        .ToString();

    /// <summary>
    /// The final value assigned to the tooltip's class attribute, including component values.
    /// </summary>
    protected string? TooltipCssClass => new CssBuilder("tooltip")
        .Add(TooltipClass)
        .Add("arrow", Arrow)
        .ToString();

    private Origin AnchorOrigin => Side switch
    {
        Side.Top => Origin.Top_Center,
        Side.Bottom => Origin.Bottom_Center,
        Side.Left => Origin.Center_Left,
        Side.Right => Origin.Center_Right,
        _ => Origin.Center_Center,
    };

    private bool Interactive { get; set; }

    private Origin PopoverOrigin => Side switch
    {
        Side.Top => Origin.Bottom_Center,
        Side.Bottom => Origin.Top_Center,
        Side.Left => Origin.Center_Right,
        Side.Right => Origin.Center_Left,
        _ => Origin.Center_Center,
    };

    /// <summary>
    /// Contructs a new instance of <see cref="Tooltip"/>.
    /// </summary>
    public Tooltip()
    {
        _hideTimer = new(Hide, 200);
        _showTimer = new(Show, 200);
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Interactive = true;
            StateHasChanged();
        }
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Toggles the visibility of this tooltip.
    /// </summary>
    public void Toggle()
    {
        _visible = !_visible;
        if (!_disposedValue)
        {
            _dismissed = false;
            _hideTimer.Cancel();
            _showTimer.Cancel();
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _hideTimer.Dispose();
                _showTimer.Dispose();
            }

            _disposedValue = true;
        }
    }

    private void Hide()
    {
        _visible = false;
        if (!_disposedValue)
        {
            _showTimer.Cancel();
        }
        StateHasChanged();
    }

    private void OnDismiss()
    {
        if (!_disposedValue)
        {
            _dismissed = true;
            _showTimer.Cancel();
            _hideTimer.Start();
        }
    }

    private void OnMouseOver()
    {
        if (_disposedValue || _dismissed)
        {
            return;
        }
        _hideTimer.Cancel();
        if (Delay > 0)
        {
            _showTimer.Change(Delay);
            _showTimer.Start();
        }
        else
        {
            _visible = true;
        }
    }

    private void OnMouseOut()
    {
        if (!_disposedValue)
        {
            _dismissed = false;
            _showTimer.Cancel();
            _hideTimer.Start();
        }
    }

    private void Show()
    {
        _visible = true;
        StateHasChanged();
    }
}