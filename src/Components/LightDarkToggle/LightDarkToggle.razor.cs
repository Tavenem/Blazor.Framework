using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Toggles between light and dark mode.
/// </summary>
public partial class LightDarkToggle
{
    /// <summary>
    /// Custom icon when set to dark mode.
    /// </summary>
    [Parameter] public string DarkModeIcon { get; set; } = DefaultIcons.DarkMode;

    /// <summary>
    /// Custom icon when set to light mode.
    /// </summary>
    [Parameter] public string LightModeIcon { get; set; } = DefaultIcons.LightMode;

    /// <summary>
    /// Whether the app is current set to a dark color scheme.
    /// </summary>
    public bool IsDarkMode { get; private set; }

    /// <summary>
    /// Text to display on the button.
    /// </summary>
    [Parameter] public string? Text { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("btn")
        .Add("btn-icon", string.IsNullOrWhiteSpace(Text))
        .Add(ThemeColor.ToCSS())
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private string Icon => IsDarkMode
        ? (DarkModeIcon ?? LightModeIcon)
        : (LightModeIcon ?? DarkModeIcon);

    [Inject] private ThemeService ThemeService { get; set; } = default!;

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            var mode = await ThemeService.GetPreferredColorScheme();
            IsDarkMode = mode == ThemePreference.Dark;
        }
    }

    private async Task OnClickAsync()
    {
        await ThemeService.SetColorScheme(IsDarkMode ? ThemePreference.Light : ThemePreference.Dark);
        IsDarkMode = !IsDarkMode;
    }
}