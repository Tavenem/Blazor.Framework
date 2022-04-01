using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Mimics the appearance of input elements.
/// </summary>
public partial class Field
{
    /// <summary>
    /// Whether the field is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// <para>
    /// Whether the help text should only be displayed when the field has focus.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool DisplayHelpTextOnFocus { get; set; }

    /// <summary>
    /// Any help text displayed below the input.
    /// </summary>
    [Parameter] public string? HelpText { get; set; }

    /// <summary>
    /// <para>
    /// The id of the field.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// Whether this field is currently valid.
    /// </summary>
    [Parameter] public bool IsValid { get; set; } = true;

    /// <summary>
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// Whether the field is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// Whether this field is required.
    /// </summary>
    [Parameter] public bool Required { get; set; }

    /// <summary>
    /// <para>
    /// The tabindex of the field.
    /// </para>
    /// <para>
    /// Default is zero.
    /// </para>
    /// </summary>
    [Parameter] public int? TabIndex { get; set; } = 0;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// <para>
    /// Any current validation messages for this field.
    /// </para>
    /// <para>
    /// Displayed only if <see cref="IsValid"/> is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public IEnumerable<string>? ValidationMessages { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .Add("read-only", ReadOnly)
        .Add("field")
        .Add("shrink", ShrinkWhen)
        .Add("required", Required)
        .Add("valid", IsValid)
        .Add("invalid", !IsValid)
        .ToString();

    private protected string? HelpersClass => new CssBuilder("field-helpers")
        .Add("onfocus", DisplayHelpTextOnFocus)
        .ToString();

    private bool ShrinkWhen => ChildContent is not null;
}