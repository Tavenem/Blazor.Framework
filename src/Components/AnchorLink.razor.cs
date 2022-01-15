using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A link element which supports local fragments.
/// </summary>
public partial class AnchorLink
{
    private static readonly string[] _DisabledKeys = new[] { "href, target" };

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// If <see langword="true"/>, the link will be disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected string ClassName => new CssBuilder()
        .Add(ThemeColor.ToCSS())
        .Add(Class)
        .AddClassFromDictionary(UserAttributes)
        .ToString();

    private Dictionary<string, object> Attributes => Disabled
        || !string.IsNullOrEmpty(LocalLink)
        ? UserAttributes.Without(_DisabledKeys)
        : UserAttributes;

    [Inject] private FrameworkJsInterop? JsInterop { get; set; }

    private string? LocalLink { get; set; }

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        if (UserAttributes.TryGetValue("href", out var value)
            && value is string href
            && href.StartsWith('#'))
        {
            LocalLink = href[1..];
        }
    }

    private async Task OnClickLocalLinkAsync()
    {
        if (JsInterop is not null
            && !string.IsNullOrEmpty(LocalLink))
        {
            await JsInterop.ScrollToId(LocalLink);
        }
    }
}
