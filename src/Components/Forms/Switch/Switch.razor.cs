using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A boolean toggle input component.
/// </summary>
public partial class Switch : BoolInputComponentBase<bool>
{
    /// <summary>
    /// An optional icon to display in the checked state.
    /// </summary>
    [Parameter] public string? CheckedIcon { get; set; }

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <inheritdoc/>
    public override bool HasValue => IsChecked == true;

    /// <summary>
    /// An optional icon to display in the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedIcon { get; set; }

    /// <summary>
    /// An optional label for the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedLabel { get; set; }

    /// <summary>
    /// Focuses this input.
    /// </summary>
    public ValueTask FocusAsync() => ElementReference.FocusAsync();

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("switch")
        .Add("checked", IsChecked == true)
        .ToString();

    private string? ButtonClass => new CssBuilder("btn btn-icon")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string? Icon => IsChecked == true
        ? CheckedIcon
        : UncheckedIcon;

    private void OnChange(ChangeEventArgs e) => Toggle();
}