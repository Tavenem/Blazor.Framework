using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for input components which express a boolean state (possibly including a third
/// "null" or "indeterminate" state).
/// </summary>
public abstract class BoolInputComponentBase<TValue>
    : FormComponentBase<TValue>
{
    /// <summary>
    /// <para>
    /// Whether a <see langword="null"/> value can be set by interacting with the component.
    /// </para>
    /// <para>
    /// Only applies when <typeparamref name="TValue"/> is nullable <see cref="bool"/>?
    /// </para>
    /// </summary>
    /// <remarks>
    /// Even when this is <see langword="false"/>, if <typeparamref name="TValue"/> is nullable <see
    /// cref="bool"/>? then a <see langword="null"/> value can be assigned programmatically.
    /// </remarks>
    [Parameter] public bool AllowNull { get; set; }

    /// <summary>
    /// Whether this input should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

    /// <summary>
    /// Whether the input is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// <para>
    /// The id of the input element.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// Custom HTML attributes for the input element.
    /// </summary>
    [Parameter] public Dictionary<string, object> InputAttributes { get; set; } = new();

    /// <summary>
    /// Custom CSS class(es) for the input element.
    /// </summary>
    [Parameter] public string? InputClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the input element.
    /// </summary>
    [Parameter] public string? InputStyle { get; set; }

    /// <summary>
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// Whether the input is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// The tabindex of the input element.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .Add("read-only", ReadOnly)
        .Add("required", Required)
        .Add("no-label", string.IsNullOrEmpty(Label))
        .ToString();

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected virtual string? InputCssClass => InputClass;

    /// <summary>
    /// The final value assigned to the input element's style attribute, including component values.
    /// </summary>
    protected virtual string? InputCssStyle => InputStyle;

    private protected bool? IsChecked => Value is null
        ? null
        : (bool)(object)Value;

    /// <summary>
    /// Constructs a new instance of <see cref="BoolInputComponentBase{TValue}"/>.
    /// </summary>
    protected BoolInputComponentBase()
    {
        if (typeof(TValue) != typeof(bool)
            && typeof(TValue) != typeof(bool?))
        {
            throw new InvalidOperationException("Only bool and nullable bool? are valid types for BoolInputComponentBase");
        }
    }

    /// <summary>
    /// Sets this input's value.
    /// </summary>
    /// <param name="value">
    /// <para>
    /// The new value.
    /// </para>
    /// <para>
    /// Assigning <see langword="null"/> to a <see cref="BoolInputComponentBase{TValue}"/> with a
    /// non-nullable type results in a value of <see langword="false"/>.
    /// </para>
    /// </param>
    public void SetValue(bool? value)
    {
        if (IsChecked == value
            || (typeof(TValue) == typeof(bool)
            && !value.HasValue
            && IsChecked == false))
        {
            return;
        }

        CurrentValue = typeof(TValue) == typeof(bool)
            ? (TValue)(object)(value ?? false)
            : (TValue?)(object?)value;

        if (!IsTouched)
        {
            SetTouchedDebounced();
        }

        if (!IsNested)
        {
            EvaluateDebounced();
        }

        StateHasChanged();
    }

    /// <summary>
    /// Toggles this input's value.
    /// </summary>
    /// <remarks>
    /// <para>
    /// When <typeparamref name="TValue"/> is <see cref="bool"/>, switches between <see
    /// langword="true"/> and <see langword="false"/>.
    /// </para>
    /// <para>
    /// When <typeparamref name="TValue"/> is nullable <see cref="bool"/>? and <see
    /// cref="AllowNull"/> is <see langword="true"/>, cycles between <see langword="true"/>, <see
    /// langword="false"/>, and <see langword="null"/>.
    /// </para>
    /// </remarks>
    public void Toggle()
    {
        if (AllowNull
            && typeof(TValue) == typeof(bool?))
        {
            if (Value is null)
            {
                SetValue(true);
            }
            else if (IsChecked == true)
            {
                SetValue(false);
            }
            else
            {
                SetValue(null);
            }
        }
        else if (IsChecked == true)
        {
            SetValue(false);
        }
        else
        {
            SetValue(true);
        }
    }
}
