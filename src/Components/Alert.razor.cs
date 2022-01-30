using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an alert, with support for simple theming and closing.
/// </summary>
public partial class Alert
{
    /// <summary>
    /// Whether this alert should display an icon appropriate to its theme.
    /// </summary>
    [Parameter] public bool AutoIcon { get; set; } = true;

    /// <summary>
    /// Whether this alert should have a close button.
    /// </summary>
    [Parameter] public bool CanClose { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// Raised when the alert is clicked
    /// </summary>
    [Parameter] public EventCallback<MouseEventArgs> OnClick { get; set; }

    /// <summary>
    /// Invoked when the component is closed.
    /// </summary>
    [Parameter] public EventCallback<Alert> OnClosed { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected string CssClass => new CssBuilder("alert")
        .Add(ThemeColor.ToCSS())
        .Add("clickable", OnClick.HasDelegate)
        .Add("d-none", IsClosed)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private string Icon => ThemeColor switch
    {
        ThemeColor.Danger => "error_outline",
        ThemeColor.Success => "check_circle",
        ThemeColor.Warning => "warning_amber",
        _ => "info",
    };

    private string IconClass => ThemeColor switch
    {
        ThemeColor.Danger => "icon",
        ThemeColor.Success => "icon",
        ThemeColor.Warning => "icon",
        _ => "icon outlined",
    };

    private bool IsClosed { get; set; }

    private async Task OnClosedAsync()
    {
        if (OnClosed.HasDelegate)
        {
            await OnClosed.InvokeAsync(this);
        }
        else
        {
            IsClosed = true;
        }
    }
}