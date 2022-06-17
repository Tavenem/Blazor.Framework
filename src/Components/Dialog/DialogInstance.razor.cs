using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// <para>
/// An instance of a dialog.
/// </para>
/// <para>
/// This component class should not be used directly. Instances will be created
/// when the <see cref="DialogService"/> is used to open dialogs.
/// </para>
/// </summary>
public partial class DialogInstance
{
    private readonly string _elementId = string.Concat("dialog_", Guid.NewGuid().ToString("N").AsSpan(0, 8));

    private Dialog? _dialog;

    /// <summary>
    /// <para>
    /// The id of this dialog.
    /// </para>
    /// <para>
    /// Should only be set internally.
    /// </para>
    /// </summary>
    [Parameter] public Guid Id { get; set; }

    /// <summary>
    /// <para>
    /// The options for displaying this dialog.
    /// </para>
    /// <para>
    /// Should only be set internally. Use <see cref="SetOptions"/> to change.
    /// </para>
    /// </summary>
    [Parameter]
    public DialogOptions Options { get; set; } = new();

    /// <summary>
    /// <para>
    /// The title to display in the header.
    /// </para>
    /// <para>
    /// Should only be set internally.
    /// </para>
    /// </summary>
    [Parameter] public string? Title { get; set; }

    /// <summary>
    /// <para>
    /// The content to display in the header.
    /// </para>
    /// <para>
    /// Should only be set internally.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment? TitleContent { get; set; }

    /// <summary>
    /// The final value assigned to the container's class attribute.
    /// </summary>
    protected string? ContainerCssClass => new CssBuilder("dialog-container")
        .Add(Options.Origin.ToCSS())
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder()
        .Add("fullscreen", Options.FullScreen)
        .Add($"dialog-{Options.Breakpoint.ToCSS()}", Options.Breakpoint != Breakpoint.None && !Options.FullScreen)
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    [Inject] private IKeyListener KeyListener { get; set; } = default!;

    [CascadingParameter] private FrameworkLayout? Parent { get; set; }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && !Options.DisableCloseOnEscape)
        {
            await KeyListener.ConnectAsync(_elementId, new()
            {
                Keys =
                {
                    new()
                    {
                        Key = "Escape",
                        SubscribeDown = true,
                    }
                },
            });
            KeyListener.KeyDown += OnEscapeKeyDown;
        }
    }

    /// <summary>
    /// Close this dialog with a Cancel result.
    /// </summary>
    public void Cancel() => Close(DialogResult.DefaultCancel);

    /// <summary>
    /// Close this dialog with the given result.
    /// </summary>
    /// <param name="dialogResult">
    /// The result to set. If none is provided, a Cancel result will be used.
    /// </param>
    public void Close(DialogResult? dialogResult = null)
        => Parent?.DismissDialogInstance(Id, dialogResult);

    /// <summary>
    /// Close this dialog with an Ok result that contains the given data.
    /// </summary>
    /// <param name="data">The data to return.</param>
    public void Close(object? data)
        => Parent?.DismissDialogInstance(Id, DialogResult.Ok(data));

    /// <summary>
    /// Configures the options for this dialog.
    /// </summary>
    /// <param name="options">
    /// A <see cref="DialogOptions"/> instance.
    /// </param>
    public void SetOptions(DialogOptions options)
    {
        Options = options;
        StateHasChanged();
    }

    internal void Register(Dialog dialog)
    {
        _dialog = dialog;
        Class = dialog.Class;
        Style = dialog.Style;
        TitleContent = dialog.TitleContent;
        StateHasChanged();
    }

    private void OnEscapeKeyDown(KeyboardEventArgs args)
    {
        if (!Options.DisableCloseOnEscape
            && args.Key == "Escape")
        {
            Close(DialogResult.DefaultCancel);
        }
    }

    private void OnOverlayClick()
    {
        if (!Options.DisableCloseOnOverlayClick)
        {
            Close();
        }
    }
}