using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A radio button input component.
/// </summary>
public partial class RadioButton<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TValue>
    : BoolInputComponentBase<TValue>
{
    private bool _trueValueToggle;

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
        .Add("checkbox")
        .Add("disabled", IsDisabled)
        .Add("read-only", IsReadOnly)
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

    private string? CheckedIconClass => IsCheckedIconOutlined ? "checked outlined" : "checked";

    private string? IconClass => new CssBuilder("btn btn-icon")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private string? IsCheckedString
        => Context?.CurrentValue?.Equals(Value) == true
        ? GetToggledTrueValue()
        : IsChecked?.ToString();

    private string? UncheckedIconClass => IsUncheckedIconOutlined ? "unchecked outlined" : "unchecked";

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        Context = string.IsNullOrEmpty(Name)
            ? CascadingContext
            : CascadingContext?.FindContextInAncestors(Name);

        base.OnParametersSet();
    }

    private string GetToggledTrueValue()
    {
        _trueValueToggle = !_trueValueToggle;
        return _trueValueToggle ? "a" : "b";
    }

    private async Task OnChangeAsync(ChangeEventArgs e)
    {
        if (Context is null)
        {
            Toggle();
        }
        else
        {
            await Context.ChangeEventCallback.InvokeAsync(e);
        }
    }
}