using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.InternalComponents;

/// <summary>
/// <para>
/// An individual snackbar message.
/// </para>
/// <para>
/// Not intended to be used directly. Use <c>SnackbarService.Add</c> to display snackbars.
/// </para>
/// </summary>
public partial class SnackbarElement : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// Whether this snackbar is the additional message displayed above the maximum limit.
    /// </summary>
    [Parameter] public bool IsExtra { get; set; }

    /// <summary>
    /// The <see cref="Framework.Snackbar"/> displayed by this component.
    /// </summary>
    [Parameter] public Snackbar? Snackbar { get; set; }

    /// <summary>
    /// Component-specific style fragment.
    /// </summary>
    protected RenderFragment? StyleFragment;

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values.
    /// </summary>
    protected override string? CssClass => Snackbar?.Properties.Class ?? string.Empty;

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values.
    /// </summary>
    protected override string? CssStyle => new CssBuilder()
        .AddStyle(Snackbar?.Properties.Style)
        .AddStyle("opacity", ".3", IsExtra)
        .ToString();

    /// <summary>
    /// The message to display.
    /// </summary>
    protected MarkupString Message => Snackbar?.Properties.Options.Message ?? (MarkupString)"!";

    private string Icon => (Snackbar?.Properties.Options.ThemeColor ?? ThemeColor.None) switch
    {
        ThemeColor.Danger => "error_outline",
        ThemeColor.Success => "check_circle",
        ThemeColor.Warning => "warning_amber",
        _ => "info",
    };

    private string Role => (Snackbar?.Properties.Options.ThemeColor ?? ThemeColor.None) switch
    {
        ThemeColor.Danger or ThemeColor.Warning => "alert",
        _ => "status",
    };

    private bool ShowClose => Snackbar?.Properties.Options.ShowCloseButton != false;

    [Inject] SnackbarService SnackbarService { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        if (Snackbar is null)
        {
            return;
        }

        Snackbar.OnUpdate += OnSnackbarUpdate;
        Snackbar.Initialize();

        StyleFragment = builder =>
        {
            var transition = Snackbar.Properties.TransitionClass;
            if (!string.IsNullOrEmpty(transition))
            {
                builder.OpenElement(1, "style");
                builder.AddContent(2, transition);
                builder.CloseElement();
            }
        };
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
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
            if (disposing && Snackbar is not null)
            {
                Snackbar.OnUpdate -= OnSnackbarUpdate;
            }

            _disposedValue = true;
        }
    }

    private void OnClick() => Snackbar?.OnClick();

    private void OnClosed() => Snackbar?.OnClick(true);

    private void OnSnackbarUpdate() => InvokeAsync(StateHasChanged);
}