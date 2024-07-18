using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

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

    /// <inheritdoc/>
    public override bool HasValue => IsChecked == true;

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="CheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsCheckedIconOutlined { get; set; }

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="UncheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsUncheckedIconOutlined { get; set; }

    /// <summary>
    /// An optional icon to display in the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedIcon { get; set; }

    /// <summary>
    /// An optional label for the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedLabel { get; set; }

    private string? CheckedIconClass => IsCheckedIconOutlined ? "outlined" : null;

    private string? UncheckedIconClass => IsUncheckedIconOutlined ? "outlined" : null;

    private void OnToggle(ToggleEventArgs e) => SetValue(e.Value);
}