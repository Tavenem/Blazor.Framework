using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A checkbox input component.
/// </summary>
public partial class Checkbox<TValue>
{
    /// <summary>
    /// The icon to use for the checked state.
    /// </summary>
    [Parameter] public string CheckedIcon { get; set; } = DefaultIcons.CheckBox_Checked;

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <inheritdoc/>
    public override bool HasValue => RequiresTrue
        ? IsChecked == true
        : Value is not null;

    /// <summary>
    /// <para>
    /// The icon to use for an indeterminate state.
    /// </para>
    /// <para>
    /// Applies only to checkboxes bound to nullable <see cref="bool"/> values.
    /// </para>
    /// </summary>
    [Parameter] public string IndeterminateIcon { get; set; } = DefaultIcons.CheckBox_Indeterminate;

    /// <summary>
    /// Whether a <see cref="InputBase{TValue}.Value"/> of <see langword="true"/> is required to
    /// fulfill the <see cref="FormComponentBase{TValue}.Required"/> requirement (rather than a
    /// non-<see langword="null"/> value, which is the default behavior).
    /// </summary>
    [Parameter] public bool RequiresTrue { get; set; }

    /// <summary>
    /// The icon to use for the unchecked state.
    /// </summary>
    [Parameter] public string UncheckedIcon { get; set; } = DefaultIcons.CheckBox_Unchecked;

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