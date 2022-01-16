using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays a chip, with support for simple theming and closing.
/// </summary>
public partial class Chip : IAsyncDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// Whether this chip should have a close button.
    /// </summary>
    [Parameter] public bool CanClose { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

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
    [Parameter] public bool IsSelected { get; set; }

    /// <summary>
    /// Raised when the chip's selection state changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsSelectedChanged { get; set; }

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
    [Parameter] public EventCallback<Chip> OnClosed { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected string ClassName => new CssBuilder("chip")
        .Add(FinalThemeColor.ToCSS())
        .Add("clickable", OnClick.HasDelegate)
        .Add("selected", IsSelected)
        .Add("d-none", IsClosed)
        .Add(Class)
        .AddClassFromDictionary(UserAttributes)
        .ToString();

    /// <summary>
    /// The set to which this chip belongs, if any.
    /// </summary>
    [CascadingParameter] protected ChipSet? ChipSet { get; set; }

    private string? IconClassName
    {
        get
        {
            if (ChipSet?.ShowSelectionIcon == true
                && IsSelected)
            {
                return "icon done";
            }
            return string.IsNullOrWhiteSpace(IconClass)
                ? null
                : $"icon {IconClass}";
        }
    }

    private bool IsClosed { get; set; }

    private ThemeColor FinalThemeColor => ChipSet is not null
        && ChipSet.SelectedColor != ThemeColor.None
        && IsSelected
        ? ChipSet.SelectedColor
        : ThemeColor;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized() => ChipSet?.Add(this);

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing && ChipSet is not null)
            {
                await ChipSet.RemoveAsync(this);
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    public async ValueTask DisposeAsync()
    {
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Changes this chip's selection state.
    /// </summary>
    /// <param name="value">Whether the chip is selected.</param>
    /// <returns>
    /// <see langword="true"/> if the selection state changes; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public async ValueTask<bool> SelectAsync(bool value)
    {
        if (IsSelected == value)
        {
            return false;
        }

        IsSelected = value;
        await IsSelectedChanged.InvokeAsync(value);
        return true;
    }

    internal void ForceRedraw() => StateHasChanged();

    private async Task OnClickAsync(MouseEventArgs e)
    {
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