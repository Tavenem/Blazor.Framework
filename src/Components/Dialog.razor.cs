using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A dialog component.
/// </summary>
public partial class Dialog
{
    private bool _isVisible;
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
    /// The content displayed in the dialog.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

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
    [Parameter]
    public bool IsVisible
    {
        get => _isVisible;
        set
        {
            if (_isVisible == value)
            {
                return;
            }

            _isVisible = value;
            if (DialogInstance is null)
            {
                if (_isVisible)
                {
                    Show();
                }
                else
                {
                    Close();
                }
            }
            IsVisibleChanged.InvokeAsync(value);
        }
    }

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
    protected string BodyCssClass => new CssBuilder("body")
        .Add(BodyClass)
        .ToString();

    /// <summary>
    /// The final value assigned to the footer class attribute.
    /// </summary>
    protected string FooterCssClass => new CssBuilder("footer")
        .Add(FooterClass)
        .ToString();

    [CascadingParameter] private DialogInstance? DialogInstance { get; set; }

    [Inject] private DialogService DialogService { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized() => DialogInstance?.Register(this);

    /// <summary>
    /// Method invoked after each time the component has been rendered.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override void OnAfterRender(bool firstRender)
    {
        if (DialogInstance is null
            && _reference?.Dialog is Dialog dialog)
        {
            dialog.StateHasChanged();
        }
    }

    /// <summary>
    /// Close a currently open inlined dialog.
    /// </summary>
    /// <param name="dialogResult">
    /// The result to set. If none is provided, a Cancel result will be used.
    /// </param>
    public void Close(DialogResult? dialogResult = null)
    {
        if (DialogInstance is not null
            || _reference is null)
        {
            return;
        }
        _reference.Close(dialogResult);
        _reference = null;
    }

    /// <summary>
    /// Show an inlined dialog.
    /// </summary>
    /// <param name="title">The title to display.</param>
    /// <param name="options">
    /// <para>
    /// The options for displaying this dialog.
    /// </para>
    /// <para>
    /// If omitted, and the <see cref="Options"/> parameter has been set, those
    /// will be used.
    /// </para>
    /// </param>
    /// <returns>
    /// A <see cref="DialogReference"/> for the displayed dialog.
    /// </returns>
    /// <exception cref="InvalidOperationException">
    /// <para>
    /// Throws if called for a dialog displayed with the <see cref="Framework.DialogService"/>.
    /// </para>
    /// <para>
    /// Only valid for inlined dialogs.
    /// </para>
    /// </exception>
    public DialogReference Show(string? title = null, DialogOptions? options = null)
    {
        if (DialogInstance is not null)
        {
            throw new InvalidOperationException("You can only show an inlined dialog.");
        }
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
            _isVisible = false;
            InvokeAsync(() => IsVisibleChanged.InvokeAsync(false));
        });
        return _reference;
    }
}