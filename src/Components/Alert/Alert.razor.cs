using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an alert, with support for simple theming and closing.
/// </summary>
public partial class Alert
{
    /// <summary>
    /// Whether this alert should display a close button that sets its <c>display</c> property to
    /// <c>none</c>.
    /// </summary>
    [Parameter] public bool AutoClose { get; set; }

    /// <summary>
    /// <para>
    /// Whether this alert should display an icon appropriate to its theme.
    /// </para>
    /// <para>
    /// The default is <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool AutoIcon { get; set; } = true;

    /// <summary>
    /// Raised when the component is closed.
    /// </summary>
    public event EventHandler? Closed;

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

    /// <inheritdoc />
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add(ThemeColor.ToCSS())
        .Add("alert")
        .Add("clickable", OnClick.HasDelegate)
        .ToString();

    private string Icon => ThemeColor switch
    {
        ThemeColor.Danger => "error_outline",
        ThemeColor.Success => "check_circle",
        ThemeColor.Warning => "warning_amber",
        _ => "info",
    };

    private string? IconClass => ThemeColor switch
    {
        ThemeColor.Danger or ThemeColor.Success or ThemeColor.Warning => null,
        _ => "outlined",
    };

    private bool Interactive { get; set; }

    /// <inheritdoc />
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Interactive = true;
            StateHasChanged();
        }
    }

    private async Task OnClosedAsync()
    {
        if (OnClosed.HasDelegate)
        {
            await OnClosed.InvokeAsync(this);
        }
        Closed?.Invoke(this, EventArgs.Empty);
    }
}