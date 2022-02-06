using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays a chip, with support for simple theming and closing.
/// </summary>
public partial class Chip<TChip>
{
    /// <summary>
    /// Whether this chip should display a close button that sets its <c>display</c> property to
    /// <c>none</c>.
    /// </summary>
    [Parameter] public bool AutoClose { get; set; }

    /// <summary>
    /// Whether this chip should have a close button.
    /// </summary>
    [Parameter] public bool CanClose { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// The name of the icon to be displayed before the content.
    /// </summary>
    [Parameter] public string? Icon { get; set; }

    /// <summary>
    /// <para>
    /// Optional CSS class(es) for an icon displayed before the content.
    /// </para>
    /// <para>
    /// The class "icon" is automatically included.
    /// </para>
    /// </summary>
    [Parameter] public string? IconClass { get; set; }

    /// <summary>
    /// Indicates whether this chip has been selected.
    /// </summary>
    public bool IsSelected => SelectedItems?.Contains(Item) == true;

    /// <summary>
    /// The item to which this chip is bound (if any).
    /// </summary>
    [Parameter] public TChip? Item { get; set; }

    /// <summary>
    /// Raised when the chip is clicked.
    /// </summary>
    [Parameter] public EventCallback<MouseEventArgs> OnClick { get; set; }

    /// <summary>
    /// Invoked when the chip is clicked.
    /// </summary>
    public event EventHandler? OnClicked;

    /// <summary>
    /// Invoked when the component is closed.
    /// </summary>
    [Parameter] public EventCallback<Chip<TChip>> OnClosed { get; set; }

    /// <summary>
    /// <para>
    /// The text to be displayed.
    /// </para>
    /// <para>
    /// Ignored if <see cref="ChildContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? Text { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("chip")
        .Add(FinalThemeColor.ToCSS())
        .Add("clickable", OnClick.HasDelegate || ChipSet is not null)
        .Add("selected", IsSelected)
        .Add("d-none", IsClosed)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The set to which this chip belongs, if any.
    /// </summary>
    [CascadingParameter] protected ChipSet<TChip>? ChipSet { get; set; }

    /// <summary>
    /// The selected items of the set to which this chip belongs, if any.
    /// </summary>
    [CascadingParameter] protected IEnumerable<TChip>? SelectedItems { get; set; }

    private string? IconClassName => string.IsNullOrWhiteSpace(IconClass)
        ? "icon"
        : $"icon {IconClass}";

    private string? IconName
    {
        get
        {
            if (ChipSet?.ShowSelectionIcon == true
                && IsSelected)
            {
                return "done";
            }
            return string.IsNullOrWhiteSpace(Icon)
                ? null
                : Icon;
        }
    }

    private bool IsClosed { get; set; }

    private ThemeColor FinalThemeColor => ChipSet is not null
        && ChipSet.SelectedColor != ThemeColor.None
        && IsSelected
        ? ChipSet.SelectedColor
        : ThemeColor;

    private async Task OnClickAsync(MouseEventArgs e)
    {
        if (ChipSet is not null)
        {
            await ChipSet.OnClickChipAsync(Item);
        }
        await OnClick.InvokeAsync(e);
        OnClicked?.Invoke(this, EventArgs.Empty);
    }

    private async Task OnClosedAsync()
    {
        if (OnClosed.HasDelegate)
        {
            await OnClosed.InvokeAsync(this);
        }
        else
        {
            IsClosed = true;
        }
    }
}