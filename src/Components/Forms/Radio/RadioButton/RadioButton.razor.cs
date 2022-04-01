using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A radio button input component.
/// </summary>
public partial class RadioButton<TValue>
{
    /// <summary>
    /// Custom HTML attributes for the component.
    /// </summary>
    [Parameter(CaptureUnmatchedValues = true)]
    public Dictionary<string, object>? AdditionalAttributes { get; set; }

    /// <summary>
    /// Whether this input should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

    /// <summary>
    /// The icon to use for the checked state.
    /// </summary>
    [Parameter] public string? CheckedIcon { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the component.
    /// </summary>
    [Parameter] public string? Class { get; set; }

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <summary>
    /// <para>
    /// The id of the input element.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToString("N");

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
    /// <para>
    /// A label which describes the field.
    /// </para>
    /// <para>
    /// Ignored if <see cref="LabelContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// Content for the label of the field.
    /// </summary>
    [Parameter] public RenderFragment<TValue?>? LabelContent { get; set; }

    /// <summary>
    /// <para>
    /// The name of the associated <see cref="RadioGroup{TValue}"/>.
    /// </para>
    /// <para>
    /// May be omitted to use the nearest containing <see cref="RadioGroup{TValue}"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? Name { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the component.
    /// </summary>
    [Parameter] public string? Style { get; set; }

    /// <summary>
    /// The tabindex of the input element.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The icon to use for the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedIcon { get; set; }

    /// <summary>
    /// The value of this input.
    /// </summary>
    [Parameter] public TValue? Value { get; set; }

    /// <summary>
    /// The context for this <see cref="InputRadio{TValue}"/>.
    /// </summary>
    internal RadioContext<TValue>? Context { get; private set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component values and anything
    /// assigned by the user in <see cref="InputRadio{TValue}.AdditionalAttributes"/>.
    /// </summary>
    protected string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("checkbox")
        .Add("disabled", Group?.Disabled == true)
        .Add("read-only", Group?.ReadOnly == true)
        .Add((ThemeColor == ThemeColor.None ? (Group?.ThemeColor ?? ThemeColor.None) : ThemeColor).ToCSS())
        .ToString();

    private protected bool IsChecked => Context?.CurrentValue?.Equals(Value) ?? false;

    [CascadingParameter] private RadioGroup<TValue>? Group { get; set; }

    [CascadingParameter] private RadioContext<TValue>? CascadingContext { get; set; }

    private string Icon => IsChecked
        ? (CheckedIcon ?? Group?.CheckedIcon ?? DefaultIcons.Radio_Checked)
        : (UncheckedIcon ?? Group?.UncheckedIcon ?? DefaultIcons.Radio_Unchecked);

    private string? IconClass => new CssBuilder("btn btn-icon")
        .Add(ThemeColor.ToCSS())
        .ToString();

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        Context = string.IsNullOrEmpty(Name)
            ? CascadingContext
            : CascadingContext?.FindContextInAncestors(Name) ?? new(null, new());

        if (Context is null)
        {
            throw new InvalidOperationException($"{GetType()} must have an ancestor {typeof(RadioGroup<TValue>)} with a matching {nameof(Name)} property, if specified.");
        }

        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
    }

    /// <summary>
    /// Focuses this input.
    /// </summary>
    public ValueTask FocusAsync() => ElementReference.FocusAsync();
}