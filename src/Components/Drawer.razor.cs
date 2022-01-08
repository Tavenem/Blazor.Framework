using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

public partial class Drawer
{
    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// The child content of the footer.
    /// </summary>
    [Parameter] public RenderFragment? Footer { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the footer.
    /// </summary>
    [Parameter] public string? FooterClass { get; set; }

    /// <summary>
    /// The child content of the header.
    /// </summary>
    [Parameter] public RenderFragment? Header { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the header.
    /// </summary>
    [Parameter] public string? HeaderClass { get; set; }

    private bool _isOpen;
    /// <summary>
    /// Whether the drawer is currently open.
    /// </summary>
    [Parameter] public bool IsOpen
    {
        get => _isOpen;
        set
        {
            if (value)
            {
                _isClosed = false;
            }
            _isOpen = value;
        }
    }

    /// <summary>
    /// Raised when the drawer's current open status changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsOpenChanged { get; set; }

    /// <summary>
    /// Invoked when the component is closed.
    /// </summary>
    [Parameter] public EventCallback<Drawer> OnClosed { get; set; }

    /// <summary>
    /// The side on which the drawer is docked.
    /// </summary>
    [Parameter] public Side Side { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected string ClassName => new CssBuilder("drawer")
        .Add(Side.ToCSS())
        .Add("closed", IsClosed)
        .Add("open", IsOpen)
        .Add(Class)
        .AddClassFromDictionary(UserAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected string FooterToolbarClassName => new CssBuilder("toolbar filled")
        .Add(ThemeColor.ToCSS())
        .Add(FooterClass)
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected string HeaderToolbarClassName => new CssBuilder("toolbar filled")
        .Add(ThemeColor.ToCSS())
        .Add(HeaderClass)
        .ToString();

    private bool _isClosed;
    /// <summary>
    /// Whether the drawer is currently closed.
    /// </summary>
    private bool IsClosed
    {
        get => _isClosed;
        set
        {
            if (value)
            {
                _isOpen = false;
            }
            _isClosed = value;
        }
    }

    private async Task OnClosedAsync()
    {
        if (OnClosed.HasDelegate)
        {
            await OnClosed.InvokeAsync(this);
        }
        else
        {
            IsOpen = false;
            IsClosed = true;
            await IsOpenChanged.InvokeAsync(IsOpen);
        }
    }
}
