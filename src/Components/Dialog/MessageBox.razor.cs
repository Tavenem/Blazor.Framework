using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A message box.
/// </summary>
public partial class MessageBox
{
    /// <summary>
    /// <para>
    /// The text to display on the alternative choice button.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> no alternative choice button will be
    /// displayed.
    /// </para>
    /// </summary>
    [Parameter] public string? AltText { get; set; }

    /// <summary>
    /// <para>
    /// The text to display on the negative choice button.
    /// </para>
    /// <para>
    /// If left <see langword="null"/> no negative choice button will be
    /// displayed.
    /// </para>
    /// </summary>
    [Parameter] public string? CancelText { get; set; }

    /// <summary>
    /// <para>
    /// This can be bound to show and hide an inline message box.
    /// </para>
    /// <para>
    /// This property has no effect on message boxes opened with the <see
    /// cref="Framework.DialogService"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool IsVisible { get; set; }

    /// <summary>
    /// Raised when an inline message box's visibility changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsVisibleChanged { get; set; }

    /// <summary>
    /// The message to display.
    /// </summary>
    [Parameter] public MarkupString Message { get; set; }

    /// <summary>
    /// <para>
    /// The text to display on the affirmative choice button.
    /// </para>
    /// <para>
    /// Defaults to "OK."
    /// </para>
    /// </summary>
    [Parameter] public string OkText { get; set; } = MessageBoxOptions.DefaultOk;

    /// <summary>
    /// Raised when the alternative choice button is chosen.
    /// </summary>
    [Parameter] public EventCallback<bool> OnAlt { get; set; }

    /// <summary>
    /// Raised when the negative choice button is chosen, or the message box is
    /// closed without a choice.
    /// </summary>
    [Parameter] public EventCallback<bool> OnCancel { get; set; }

    /// <summary>
    /// Raised when the affirmative choice button is chosen.
    /// </summary>
    [Parameter] public EventCallback<bool> OnOk { get; set; }

    /// <summary>
    /// The title to display in the header. Optional.
    /// </summary>
    [Parameter] public string? Title { get; set; }

    [CascadingParameter] private DialogInstance? DialogInstance { get; set; }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var visibleChanged = false;
        if (parameters.TryGetValue<bool>(nameof(IsVisible), out var isVisible)
            && isVisible != IsVisible)
        {
            visibleChanged = true;
        }

        await base.SetParametersAsync(parameters);

        if (visibleChanged)
        {
            await IsVisibleChanged.InvokeAsync(IsVisible);
        }
    }

    private async Task OnAltClicked()
    {
        DialogInstance?.Close(DialogResult.DefaultAlt);
        await OnAlt.InvokeAsync();
    }

    private async Task OnCancelClicked()
    {
        DialogInstance?.Close(DialogResult.DefaultCancel);
        await OnCancel.InvokeAsync();
    }

    private async Task OnOkClicked()
    {
        DialogInstance?.Close(DialogResult.DefaultOk);
        await OnOk.InvokeAsync();
    }
}