using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A checkbox input component.
/// </summary>
public partial class Checkbox<TValue> : BoolInputComponentBase<TValue>
{
    /// <summary>
    /// The icon to use for the checked state.
    /// </summary>
    [Parameter] public string? CheckedIcon { get; set; }

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
    [Parameter] public string? IndeterminateIcon { get; set; }

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="CheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsCheckedIconOutlined { get; set; }

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="IndeterminateIcon"/>.
    /// </summary>
    [Parameter] public bool IsIndeterminateIconOutlined { get; set; }

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="UncheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsUncheckedIconOutlined { get; set; }

    /// <summary>
    /// Whether a <see cref="InputBase{TValue}.Value"/> of <see langword="true"/> is
    /// required to fulfill the <see cref="FormComponentBase{TValue}.Required"/> requirement (rather
    /// than a non-<see langword="null"/> value, which is the default behavior).
    /// </summary>
    [Parameter] public bool RequiresTrue { get; set; }

    /// <summary>
    /// The icon to use for the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedIcon { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("checkbox")
        .ToString();

    private string? CheckedIconClass => IsCheckedIconOutlined ? "checked outlined" : "checked";

    private string? IconClass => new CssBuilder("btn btn-icon")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string? IndeterminateIconClass => IsIndeterminateIconOutlined ? "indeterminate outlined" : "indeterminate";

    private string? UncheckedIconClass => IsUncheckedIconOutlined ? "unchecked outlined" : "unchecked";

    private void OnChange(ChangeEventArgs e) => Toggle();
}