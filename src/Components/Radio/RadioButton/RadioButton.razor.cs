using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A radio button input component.
/// </summary>
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ToggleEventArgs))]
public partial class RadioButton<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue>()
    : BoolInputComponentBase<TValue>
{
    /// <summary>
    /// The icon to use for the checked state.
    /// </summary>
    [Parameter] public string? CheckedIcon { get; set; }

    /// <summary>
    /// Content for the label of the field.
    /// </summary>
    [Parameter] public RenderFragment<TValue?>? LabelContent { get; set; }

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="CheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsCheckedIconOutlined { get; set; }

    /// <summary>
    /// Whether to use an outlined variant of the <see cref="UncheckedIcon"/>.
    /// </summary>
    [Parameter] public bool IsUncheckedIconOutlined { get; set; }

    /// <summary>
    /// The icon to use for the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedIcon { get; set; }

    /// <summary>
    /// The context for this <see cref="InputRadio{TValue}"/>.
    /// </summary>
    internal RadioContext<TValue>? Context { get; private set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add(ThemeColor.ToCSS())
        .ToString();

    /// <inheritdoc/>
    protected override ThemeColor EffectiveThemeColor => ThemeColor == ThemeColor.None
        ? (Group?.ThemeColor ?? ThemeColor.None)
        : ThemeColor;

    /// <inheritdoc/>
    protected override bool? IsChecked
    {
        get
        {
            if (Context is null)
            {
                return base.IsChecked;
            }
            return Context.CurrentValue is null
                ? Value is null
                : Context.CurrentValue.Equals(Value);
        }
    }

    private bool IsDisabled => Disabled || Group?.Disabled == true;

    private bool IsReadOnly => ReadOnly || Group?.ReadOnly == true;

    [CascadingParameter] private RadioGroup<TValue>? Group { get; set; }

    [CascadingParameter] private RadioContext<TValue>? CascadingContext { get; set; }

    private string? CheckedIconClass => IsCheckedIconOutlined ? "outlined" : null;

    private string? UncheckedIconClass => IsUncheckedIconOutlined ? "outlined" : null;

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        Context = string.IsNullOrEmpty(Name)
            ? CascadingContext
            : CascadingContext?.FindContextInAncestors(Name);

        base.OnParametersSet();
    }

    private async Task OnToggleAsync(ToggleEventArgs e)
    {
        if (Context is null)
        {
            SetValue(e.Value);
        }
        else if (e.Value == true)
        {
            await Context.ChangeEventCallback.InvokeAsync(new ChangeEventArgs { Value = Value?.ToString() });
        }
    }
}