using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A dialog component.
/// </summary>
public partial class Dialog
{
    private DialogReference? _reference;

    /// <summary>
    /// Custom CSS class(es) for the body.
    /// </summary>
    [Parameter] public string? BodyClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the body.
    /// </summary>
    [Parameter] public string? BodyStyle { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the footer.
    /// </summary>
    [Parameter] public string? FooterClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the footer.
    /// </summary>
    [Parameter] public string? FooterStyle { get; set; }

    /// <summary>
    /// The content displayed in the footer.
    /// </summary>
    [Parameter] public RenderFragment? FooterContent { get; set; }

    /// <summary>
    /// <para>
    /// This can be bound to show and hide an inline dialog.
    /// </para>
    /// <para>
    /// This property has no effect on dialogs opened with the <see
    /// cref="Framework.DialogService"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool IsVisible { get; set; }

    /// <summary>
    /// Raised when an inline dialog's visibility changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsVisibleChanged { get; set; }

    /// <summary>
    /// <para>
    /// The options for displaying this dialog.
    /// </para>
    /// <para>
    /// Passed to <c>DialogService.Show</c> if set, and none is explicitly
    /// provided in the method call.
    /// </para>
    /// </summary>
    [Parameter] public DialogOptions? Options { get; set; }

    /// <summary>
    /// The content displayed in the header.
    /// </summary>
    [Parameter] public RenderFragment? TitleContent { get; set; }

    /// <summary>
    /// The final value assigned to the body class attribute.
    /// </summary>
    protected string? BodyCssClass => new CssBuilder("body")
        .Add(BodyClass)
        .ToString();

    /// <summary>
    /// The final value assigned to the footer class attribute.
    /// </summary>
    protected string? FooterCssClass => new CssBuilder("footer")
        .Add(FooterClass)
        .ToString();

    [CascadingParameter] private DialogInstance? DialogInstance { get; set; }

    [Inject] private DialogService DialogService { get; set; } = default!;

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
            if (DialogInstance is null)
            {
                if (IsVisible)
                {
                    Show();
                }
                else
                {
                    Close();
                }
            }
            await IsVisibleChanged.InvokeAsync(IsVisible);
        }
    }

    /// <inheritdoc/>
    protected override void OnInitialized() => DialogInstance?.Register(this);

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (DialogInstance is null
            && _reference?.Dialog is Dialog dialog)
        {
            dialog.StateHasChanged();
        }
    }

    private void Close(DialogResult? dialogResult = null)
    {
        if (DialogInstance is not null
            || _reference is null)
        {
            return;
        }
        _reference.Close(dialogResult);
        _reference = null;
    }

    private DialogReference Show(string? title = null, DialogOptions? options = null)
    {
        if (_reference is not null)
        {
            Close();
        }
        var parameters = new DialogParameters()
        {
            [nameof(BodyClass)] = BodyClass,
            [nameof(BodyStyle)] = BodyStyle,
            [nameof(ChildContent)] = ChildContent,
            [nameof(Class)] = Class,
            [nameof(FooterClass)] = FooterClass,
            [nameof(FooterContent)] = FooterContent,
            [nameof(FooterStyle)] = FooterStyle,
            [nameof(Style)] = Style,
            [nameof(TitleContent)] = TitleContent,
        };
        _reference = DialogService.Show<Dialog>(title, parameters, options ?? Options);
        _reference.Result.ContinueWith(t =>
        {
            IsVisible = false;
            InvokeAsync(() => IsVisibleChanged.InvokeAsync(false));
        });
        return _reference;
    }
}