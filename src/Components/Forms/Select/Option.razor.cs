using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An option for a select component.
/// </summary>
/// <typeparam name="TValue">
/// The type of bound value.
/// </typeparam>
public partial class Option<TValue> : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// Custom HTML attributes for the component.
    /// </summary>
    [Parameter(CaptureUnmatchedValues = true)]
    public Dictionary<string, object>? AdditionalAttributes { get; set; }

    /// <summary>
    /// Content for this option.
    /// </summary>
    [Parameter] public RenderFragment<TValue?>? ChildContent { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the component.
    /// </summary>
    [Parameter] public string? Class { get; set; }

    /// <summary>
    /// Whether this option is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// A reference to the element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <summary>
    /// <para>
    /// The id of this element.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// <para>
    /// Whether this option will cause all options to be selected.
    /// </para>
    /// <para>
    /// Has no effect is this option isn't contained in a <see cref="MultiSelect{TValue}"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: this options's own <see cref="Value"/> is also included (if non-<see
    /// langword="null"/>).
    /// </remarks>
    [Parameter] public bool IsSelectAll { get; set; }

    /// <summary>
    /// Whether this option is currently selected.
    /// </summary>
    public bool IsSelected
    {
        get
        {
            if (IsSelectAll)
            {
                return Select?.AllSelected == true;
            }
            return Value is not null
                && Select?.IsSelected(Value) == true;
        }
    }

    /// <summary>
    /// <para>
    /// The text to display for this option.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ChildContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter]
    public string? Label { get; set; }

    /// <summary>
    /// Whether to show a separator after this option.
    /// </summary>
    [Parameter] public bool SeparatorAfter { get; set; }

    /// <summary>
    /// Whether to show a separator before this option.
    /// </summary>
    [Parameter] public bool SeparatorBefore { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the component.
    /// </summary>
    [Parameter] public string? Style { get; set; }

    /// <summary>
    /// The value of this option.
    /// </summary>
    [Parameter]
    public TValue? Value { get; set; }

    private string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("clickable")
        .Add("active", IsSelected)
        .Add("disabled", Disabled)
        .ToString();

    private string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    private protected string? IconName
    {
        get
        {
            if (IsMultiselect)
            {
                return IsSelected
                    ? DefaultIcons.CheckBox_Checked
                    : DefaultIcons.CheckBox_Unchecked;
            }
            return IsSelected ? DefaultIcons.Selected : null;
        }
    }

    private bool IsMultiselect => Select is MultiSelect<TValue>;

    [CascadingParameter]
    private ISelect<TValue>? Select { get; set; }

    /// <inheritdoc/>
    protected override void OnInitialized() => Select?.Add(this);

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                Select?.Remove(this);
            }
            _disposedValue = true;
        }
    }

    private void OnClick()
    {
        if (!Disabled)
        {
            Select?.SetValue(Value);
        }
    }
}