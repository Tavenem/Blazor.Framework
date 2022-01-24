using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A heading component which geneates an h# element, with theme support
/// and support for automatic page contents.
/// </summary>
public partial class Heading
{
    internal const string HeadingClassName = "heading";

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string? Id { get; set; }

    /// <summary>
    /// The type of heading tag.
    /// </summary>
    [Parameter] public HeadingLevel Level { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected string CssClass => new CssBuilder(HeadingClassName)
        .Add(ThemeColor.ToCSS())
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        if (AdditionalAttributes.TryGetValue("id", out var value)
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
        else if (string.IsNullOrWhiteSpace(Id))
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}