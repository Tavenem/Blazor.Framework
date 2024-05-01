using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for picker components.
/// </summary>
public class PickerComponentBase<TValue> : FormComponentBase<TValue>
{
    /// <summary>
    /// <para>
    /// Whether to allow the user to clear the current value.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// <para>
    /// This property is ignored if <typeparamref name="TValue"/> is not nullable, or if any of <see
    /// cref="FormComponentBase{TValue}.Disabled"/>, <see
    /// cref="FormComponentBase{TValue}.ReadOnly"/>, or <see
    /// cref="FormComponentBase{TValue}.Required"/> are <see langword="true"/>.
    /// </para>
    /// <para>
    /// Note that even when this property is <see langword="false"/>, a <see langword="null"/> value
    /// can still be set programmatically. This property only affects the presence of the clear
    /// button.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowClear { get; set; } = true;

    /// <summary>
    /// The format string to use for conversion.
    /// </summary>
    [Parameter] public string? Format { get; set; }

    /// <summary>
    /// The <see cref="IFormatProvider"/> to use for conversion.
    /// </summary>
    [Parameter] public IFormatProvider? FormatProvider { get; set; }

    /// <summary>
    /// Any help text displayed below the select.
    /// </summary>
    [Parameter] public string? HelpText { get; set; }

    /// <summary>
    /// The placeholder value.
    /// </summary>
    [Parameter] public string? Placeholder { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("shrink", ShrinkWhen)
        .ToString();

    /// <inheritdoc/>
    protected string? OuterInputCssClass => new CssBuilder("input picker-value")
        .Add("clearable", ShowClear)
        .Add("clearable-readonly", ShowClear)
        .ToString();

    private protected bool Clearable { get; set; }

    private protected string ContainerId { get; set; } = Guid.NewGuid().ToHtmlId();

    private protected string InputId { get; set; } = Guid.NewGuid().ToHtmlId();

    private protected virtual bool ShowClear => AllowClear && Clearable;

    private protected virtual bool ShrinkWhen => false;

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes is not null
            && AdditionalAttributes.TryGetValue("id", out var id)
            && id is string idString
            && !string.IsNullOrEmpty(idString))
        {
            ContainerId = idString;
        }
    }

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public virtual Task ClearAsync()
    {
        if (!Disabled && !ReadOnly)
        {
            CurrentValueAsString = null;
        }

        StateHasChanged();
        return Task.CompletedTask;
    }
}
