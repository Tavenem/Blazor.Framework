using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A checkbox input component.
/// </summary>
public partial class Checkbox<TValue>
{
    /// <summary>
    /// The icon to use for the checked state.
    /// </summary>
    [Parameter] public string CheckedIcon { get; set; } = "check_box";

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <summary>
    /// <para>
    /// The icon to use for an indeterminate state.
    /// </para>
    /// <para>
    /// Applies only to checkboxes bound to nullable <see cref="bool"/> values.
    /// </para>
    /// </summary>
    [Parameter] public string IndeterminateIcon { get; set; } = "indeterminate_check_box";

    /// <summary>
    /// The icon to use for the unchecked state.
    /// </summary>
    [Parameter] public string UncheckedIcon { get; set; } = "check_box_outline_blank";

    /// <summary>
    /// Focuses this input.
    /// </summary>
    public ValueTask FocusAsync() => ElementReference.FocusAsync();

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("checkbox")
        .ToString();

    private string Icon
    {
        get
        {
            if (Value is null)
            {
                return IndeterminateIcon;
            }
            else
            {
                return IsChecked == true ? CheckedIcon : UncheckedIcon;
            }
        }
    }

    private string? IconClass => new CssBuilder("btn btn-icon")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private void OnChange(ChangeEventArgs e) => Toggle();
}