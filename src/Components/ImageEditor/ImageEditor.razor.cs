using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Tavenem.Blazor.Framework.Components.ImageEditor;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An image editor component.
/// </summary>
public partial class ImageEditor : TavenemComponentBase, IAsyncDisposable
{
    private const double BrushSizeDefault = 12;

    private IJSObjectReference? _module;

    /// <summary>
    /// <para>
    /// When <see langword="true"/> the edit controls are visible even when no image is loaded. This
    /// enables drawing on a blank canvas.
    /// </para>
    /// <para>
    /// When <see langword="false"/> (the default), edit controls are only visible when an image is
    /// loaded.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowEditNoImage { get; set; }

    /// <summary>
    /// <para>
    /// When <see langword="true"/> (the default) the save button is shown for users, which
    /// overwrites the original image with the edited version.
    /// </para>
    /// <para>
    /// When <see langword="false"/> edited images can be downloaded, but the original image cannot
    /// be replaced on the page.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowSaving { get; set; } = true;

    /// <summary>
    /// Gets the current brush color, as a hex string.
    /// </summary>
    public string? BrushColor { get; private set; } = "#000000";

    /// <summary>
    /// Gets the current brush width, in pixels.
    /// </summary>
    public double BrushSize { get; private set; } = BrushSizeDefault;

    /// <summary>
    /// <para>
    /// The aspect ratio used when cropping an image.
    /// </para>
    /// <para>
    /// Unless prevented with <see cref="ShowCropAspectRatioControls"/>, this value can be changed
    /// by the user with the UI.
    /// </para>
    /// </summary>
    [Parameter] public double? CropAspectRatio { get; set; }

    /// <summary>
    /// A callback invoked when the aspect ratio used when cropping an image changes.
    /// </summary>
    [Parameter] public EventCallback<double?> CropAspectRatioChanged { get; set; }

    /// <summary>
    /// Gets the current <see cref="Framework.DrawingMode"/> of the editor.
    /// </summary>
    public DrawingMode DrawingMode { get; private set; }

    /// <summary>
    /// <para>
    /// The name of the Material Icon to use for the edit button.
    /// </para>
    /// <para>
    /// Default is "edit"
    /// </para>
    /// </summary>
    [Parameter] public string EditIcon { get; set; } = "edit";

    /// <summary>
    /// Gets or sets whether the editor is in edit mode (vs. image mode).
    /// </summary>
    [Parameter] public bool Editing { get; set; }

    /// <summary>
    /// A callback invoked when the editor switches from preview to edit mode, or vice versa.
    /// </summary>
    [Parameter] public EventCallback<bool> EditingChanged { get; set; }

    /// <summary>
    /// The MIME type to use when exporting the image.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Defaults to "image/png".
    /// </para>
    /// <para>
    /// The types "image/jpeg" and "image/webp" are also likely to be supported by most browsers.
    /// </para>
    /// <para>
    /// See <a
    /// href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob">https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob</a>
    /// for more information.
    /// </para>
    /// </remarks>
    [Parameter] public string Format { get; set; } = "image/png";

    /// <summary>
    /// CSS class(es) to apply to the inner image container (which may contain an HTML <c>img</c> or
    /// <c>canvas</c> element, depending on whether the image is currently being edited).
    /// </summary>
    [Parameter] public string? ImageClass { get; set; }

    /// <summary>
    /// CSS styles to apply to the inner image container (which may contain an HTML <c>img</c> or
    /// <c>canvas</c> element, depending on whether the image is currently being edited).
    /// </summary>
    [Parameter] public string? ImageStyle { get; set; }

    /// <summary>
    /// Gets a value determining if the component and associated services have been disposed.
    /// </summary>
    public bool IsDisposed { get; set; }

    /// <summary>
    /// The maximum number of bytes permitted to be read by the stream returned for <see
    /// cref="SaveCallback"/>.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Does not place a limit on the size of the image in any other context.
    /// </para>
    /// <para>
    /// Defaults to 512000 if not set, or set to a value &lt;= 0.
    /// </para>
    /// </remarks>
    [Parameter] public long MaxAllowedStreamSize { get; set; }

    /// <summary>
    /// An optional callback invoked when saving the image. Recevies a <see cref="Stream"/>
    /// containing the current (edited) image.
    /// </summary>
    [Parameter] public Func<Stream, Task>? SaveCallback { get; set; }

    /// <summary>
    /// Determines whether the crop aspect ratio UI is displayed.
    /// </summary>
    [Parameter] public bool ShowCropAspectRatioControls { get; set; } = true;

    /// <summary>
    /// Determines whether the crop UI is displayed.
    /// </summary>
    [Parameter] public bool ShowCropControls { get; set; } = true;

    /// <summary>
    /// Determines whether the drawing controls are displayed.
    /// </summary>
    [Parameter] public bool ShowDrawingControls { get; set; } = true;

    /// <summary>
    /// Determines whether the toggle to enter edit mode is displayed.
    /// </summary>
    [Parameter] public bool ShowEditButton { get; set; } = true;

    /// <summary>
    /// Determines whether the image flip UI is displayed.
    /// </summary>
    [Parameter] public bool ShowFlipControls { get; set; } = true;

    /// <summary>
    /// Determines whether the output format dropdown is displayed.
    /// </summary>
    [Parameter] public bool ShowFormats { get; set; } = true;

    /// <summary>
    /// Determines whether the rotation UI is displayed.
    /// </summary>
    [Parameter] public bool ShowRotateControls { get; set; } = true;

    /// <summary>
    /// An image source to load initially.
    /// </summary>
    /// <remarks>
    /// Any URL which would function as the <c>src</c> attribute for an HTML <c>img</c> element
    /// should work.
    /// </remarks>
    [Parameter] public string? Src { get; set; }

    /// <summary>
    /// A theme color for the edit controls.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// <para>
    /// If provided, any attempted crop will be validated by this function, which receives a
    /// reference to the control, the proposed bounds, and should return a <see
    /// cref="Task{TRsesult}"/> of <see cref="bool"/>.
    /// </para>
    /// <para>
    /// If the result is <see langword="true"/> the crop operation will be permitted to proceed.
    /// Otherwise it will be canceled.
    /// </para>
    /// </summary>
    /// <remarks>
    /// The bounds are guaranteed to have a non-zero width and height. Attempted crop operations
    /// with zero dimensions will fail automatically, without invoking this function unnecessarily.
    /// </remarks>
    [Parameter] public Func<ImageEditor, CropBounds, Task<bool>>? VerifyCrop { get; set; }

    /// <inheritdoc />
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("image-editor-wrapper")
        .ToString();

    private string ContainerId { get; set; } = Guid.NewGuid().ToHtmlId();

    private string? ContainerCssClass => new CssBuilder(ImageClass)
        .Add("image-editor-container")
        .ToString();

    [Inject] private DialogService DialogService { get; set; } = default!;

    private bool HasImage { get; set; }

    private bool IsCropping { get; set; }

    private bool IsErasing { get; set; }

    private bool IsLoading { get; set; }

    [Inject] private IJSRuntime JSRuntime { get; set; } = default!;

    private bool RedoHistoryHasState { get; set; }

    private string SaveGroupId { get; set; } = Guid.NewGuid().ToHtmlId();

    private ImageEditorInterop Interop { get; set; } = new();

    private bool TextMode { get; set; }

    private string? ThemeClass => ThemeColor.ToCSS();

    private bool UndoHistoryHasState { get; set; }

    /// <inheritdoc />
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var wasEditing = Editing;
        var aspectRatio = CropAspectRatio;

        await base.SetParametersAsync(parameters);

        var beganEdit = false;
        if (wasEditing != Editing)
        {
            if (Editing)
            {
                await BeginEditAsync();
                beganEdit = true;
            }
            else
            {
                await CancelEditAsync();
            }
        }

        if (!beganEdit && CropAspectRatio != aspectRatio)
        {
            await SetCropAspectRatioAsync(CropAspectRatio);
        }
    }

    /// <inheritdoc />
    protected override async Task OnInitializedAsync()
    {
        _module = await JSRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-image-editor.js");
        Interop.Cancel += CancelOperations;
        Interop.TextEdit += TextEdit;
        Interop.RedoHistoryChanged += RedoHistoryChanged;
        Interop.UndoHistoryChanged += UndoHistoryChanged;
        if (!string.IsNullOrEmpty(Src))
        {
            await SetLoadingAsync();
            await _module.InvokeVoidAsync("loadImage", ContainerId, Src);
            HasImage = true;
            await SetLoadingAsync(false);
        }
    }

    private void CancelOperations(object? sender, EventArgs e)
    {
        IsCropping = false;
        StateHasChanged();
    }

    /// <inheritdoc />
    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (IsDisposed)
        {
            return;
        }
        IsDisposed = true;
        if (_module is not null)
        {
            if (!string.IsNullOrEmpty(ContainerId))
            {
                await _module.InvokeVoidAsync("destroy", ContainerId);
            }
            await _module.DisposeAsync();
        }
        Interop.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Adds the given text to the image.
    /// </summary>
    /// <param name="text">The text to add.</param>
    /// <remarks>
    /// Causes the control to enter edit mode if it wasn't already.
    /// </remarks>
    public async Task AddTextAsync(string text)
    {
        if (IsDisposed)
        {
            return;
        }
        if (!Editing)
        {
            await BeginEditAsync();
        }
        if (_module is not null)
        {
            await _module.InvokeVoidAsync("addText", ContainerId, text);
        }
    }

    /// <summary>
    /// Causes the control to enter edit mode.
    /// </summary>
    public async Task BeginEditAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await SetLoadingAsync();
        Editing = true;
        if (EditingChanged.HasDelegate)
        {
            await EditingChanged.InvokeAsync(Editing);
        }
        await _module.InvokeVoidAsync("loadEditor", Interop.Reference, ContainerId, CropAspectRatio);
        await SetLoadingAsync(false);
    }

    /// <summary>
    /// Cancels an ongoing operation.
    /// </summary>
    public async Task CancelAsync()
    {
        if (IsDisposed)
        {
            return;
        }
        if (_module is not null)
        {
            await _module.InvokeVoidAsync("cancel", ContainerId);
        }
        IsCropping = false;
    }

    /// <summary>
    /// Causes the control to exit edit mode without saving.
    /// </summary>
    public async Task CancelEditAsync()
    {
        if (!Editing || IsDisposed || _module is null)
        {
            return;
        }
        await _module.InvokeVoidAsync("destroy", ContainerId);
        IsCropping = false;
        IsErasing = false;
        Editing = false;
        DrawingMode = DrawingMode.None;
        if (EditingChanged.HasDelegate)
        {
            await EditingChanged.InvokeAsync(Editing);
        }
    }

    /// <summary>
    /// Clears the image editor control.
    /// </summary>
    /// <remarks>
    /// Has no effect when not in edit mode.
    /// </remarks>
    public async Task ClearAsync()
    {
        if (!Editing || IsDisposed || _module is null)
        {
            return;
        }
        await _module.InvokeVoidAsync("clear", ContainerId);
        IsCropping = false;
    }

    /// <summary>
    /// Initiates a browser file download operation for the current state of the edited image.
    /// </summary>
    /// <param name="type">
    /// <para>
    /// The MIME type of the image to retrieve.
    /// </para>
    /// <para>
    /// <c>image/png</c> should always be supported, and is the default if no value is provided.
    /// </para>
    /// <para>
    /// <c>image/jpeg</c> and <c>image/webp</c> may also be supported.
    /// </para>
    /// <para>
    /// If an unsupported format is specified, <c>image/png</c> will be used.
    /// </para>
    /// </param>
    /// <param name="quality">
    /// <para>
    /// The quality of the output, for lossy formats.
    /// </para>
    /// <para>
    /// Values should fall between <c>0</c> and <c>1</c>. Values outside this range will be ignored,
    /// causing the browser to use a default quality (not necessarily the same as the parameter's
    /// default value).
    /// </para>
    /// <para>
    /// When using a lossless <paramref name="type"/> (such as the default, "image/png"), this
    /// parameter is ignored.
    /// </para>
    /// </param>
    public async Task ExportImageAsync(string? type = null, double? quality = 0.92)
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await _module.InvokeVoidAsync("exportImage", ContainerId, type, quality);
    }

    /// <summary>
    /// Flips the image horizontally.
    /// </summary>
    /// <remarks>
    /// Causes the control to enter edit mode if it wasn't already.
    /// </remarks>
    public async Task FlipHorizontalAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        if (!Editing)
        {
            await BeginEditAsync();
        }
        await _module.InvokeVoidAsync("flipHorizontal", ContainerId);
    }

    /// <summary>
    /// Flips the image vertically.
    /// </summary>
    /// <remarks>
    /// Causes the control to enter edit mode if it wasn't already.
    /// </remarks>
    public async Task FlipVerticalAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        if (!Editing)
        {
            await BeginEditAsync();
        }
        await _module.InvokeVoidAsync("flipVertical", ContainerId);
    }

    /// <summary>
    /// Loads an image in the editor from a URL.
    /// </summary>
    /// <param name="imageUrl">The URL to load. Should resolve as an image file.</param>
    public async Task LoadImageAsync(string? imageUrl = null)
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await SetLoadingAsync();
        if (Editing)
        {
            await _module.InvokeVoidAsync("setBackgroundImage", ContainerId, imageUrl);
        }
        else
        {
            await _module.InvokeVoidAsync("loadImage", ContainerId, imageUrl);
        }
        HasImage = !string.IsNullOrEmpty(imageUrl);
        if (BrushSize != BrushSizeDefault)
        {
            await SetBrushSizeAsync();
        }
        if (BrushColor is not null)
        {
            await SetBrushColorAsync();
        }
        await SetLoadingAsync(false);
    }

    /// <summary>
    /// Loads an image stream.
    /// </summary>
    /// <param name="stream">
    /// <para>
    /// An image stream to load.
    /// </para>
    /// <para>
    /// Any image file which can be displayed in an HTML <c>img</c> element should be supported.
    /// </para>
    /// </param>
    public async Task LoadImageAsync(Stream stream)
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await SetLoadingAsync();
        Editing = true;
        if (EditingChanged.HasDelegate)
        {
            await EditingChanged.InvokeAsync(Editing);
        }
        using (var streamReference = new DotNetStreamReference(stream))
        {
            await _module.InvokeVoidAsync("loadEditorFromStream", Interop.Reference, ContainerId, streamReference, CropAspectRatio);
        }
        HasImage = true;
        await SetLoadingAsync(false);
    }

    /// <summary>
    /// Rotate the image 90º clockwise.
    /// </summary>
    /// <remarks>
    /// Causes the control to enter edit mode if it wasn't already.
    /// </remarks>
    public async Task RotateClockwiseAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        if (!Editing)
        {
            await BeginEditAsync();
        }
        await _module.InvokeVoidAsync("rotateClockwise", ContainerId);
    }

    /// <summary>
    /// Rotate the image 90º counter-clockwise.
    /// </summary>
    /// <remarks>
    /// Causes the control to enter edit mode if it wasn't already.
    /// </remarks>
    public async Task RotateCounterClockwiseAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        if (!Editing)
        {
            await BeginEditAsync();
        }
        await _module.InvokeVoidAsync("rotateCounterClockwise", ContainerId);
    }

    /// <summary>
    /// Ends editing and saves the current image back to an HTML <c>img</c> element.
    /// </summary>
    /// <param name="type">
    /// <para>
    /// The MIME type of the image to save.
    /// </para>
    /// <para>
    /// <c>image/png</c> should always be supported, and is the default if no value is provided.
    /// </para>
    /// <para>
    /// <c>image/jpeg</c> and <c>image/webp</c> may also be supported.
    /// </para>
    /// <para>
    /// If an unsupported format is specified, <c>image/png</c> will be used.
    /// </para>
    /// </param>
    /// <param name="quality">
    /// <para>
    /// The quality of the output, for lossy formats.
    /// </para>
    /// <para>
    /// Values should fall between <c>0</c> and <c>1</c>. Values outside this range will be ignored,
    /// causing the browser to use a default quality (not necessarily the same as the parameter's
    /// default value).
    /// </para>
    /// <para>
    /// When using a lossless <paramref name="type"/> (such as the default, "image/png"), this
    /// parameter is ignored.
    /// </para>
    /// </param>
    /// <remarks>
    /// <para>
    /// Invokes <see cref="SaveCallback"/> if it has been defined.
    /// </para>
    /// <para>
    /// Has no effect if the control is not currently in edit mode, and <see cref="SaveCallback"/>
    /// is not defined.
    /// </para>
    /// </remarks>
    public async Task SaveAsync(string? type = null, double? quality = 0.92)
    {
        if (IsDisposed
            || _module is null
            || (SaveCallback is null
            && !Editing))
        {
            return;
        }
        await SetLoadingAsync();
        var wasEditing = Editing;
        if (SaveCallback is not null)
        {
            if (!Editing)
            {
                await _module.InvokeVoidAsync("loadEditor", Interop.Reference, ContainerId);
            }
            var streamReference = await _module.InvokeAsync<IJSStreamReference>("getStream", ContainerId, type, quality);
            if (streamReference is null)
            {
                return;
            }
            using var stream = await streamReference.OpenReadStreamAsync(MaxAllowedStreamSize <= 0
                ? 512000
                : MaxAllowedStreamSize);
            await SaveCallback.Invoke(stream);
        }
        await _module.InvokeVoidAsync("save", ContainerId, type, quality);
        Editing = false;
        if (wasEditing)
        {
            await EditingChanged.InvokeAsync(Editing);
        }
        await SetLoadingAsync(false);
    }

    /// <summary>
    /// Sets the current brush color to the given hex string.
    /// </summary>
    /// <param name="color">
    /// A hex string representing a color. Or <see langword="null"/> or an empty string to reset to black.
    /// </param>
    public async Task SetBrushColorAsync(string? color)
    {
        BrushColor = ColorString(color);
        await SetBrushColorAsync();
    }

    /// <summary>
    /// Sets the current brush size.
    /// </summary>
    /// <param name="value">A number of pixels.</param>
    public async Task SetBrushSizeAsync(double value)
    {
        BrushSize = Math.Max(1, value);
        await SetBrushSizeAsync(BrushSize);
    }

    /// <summary>
    /// Sets the cropping aspect ratio.
    /// </summary>
    /// <param name="ratio">
    /// <para>
    /// The aspect ratio for cropping.
    /// </para>
    /// <para>
    /// Zero or <see langword="null"/> indicates free cropping.
    /// </para>
    /// <para>
    /// A negative value indicates that the image's original aspect ratio should be used.
    /// </para>
    /// </param>
    /// <remarks>
    /// <para>
    /// Only effective in edit mode. Does <em>not</em> cause the control to enter edit mode.
    /// </para>
    /// <para>
    /// Invoking this method when not in edit mode has no effect.
    /// </para>
    /// <para>
    /// The method <em>is</em> effective when in edit mode but not currently performing a crop
    /// operation.
    /// </para>
    /// </remarks>
    public async Task SetCropAspectRatioAsync(double? ratio = null)
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        CropAspectRatio = ratio;
        await CropAspectRatioChanged.InvokeAsync();
        await _module.InvokeVoidAsync("setCropAspectRatio", ContainerId, ratio);
    }

    /// <summary>
    /// Starts a crop operation.
    /// </summary>
    /// <remarks>
    /// Causes the control to enter edit mode if it wasn't already.
    /// </remarks>
    public async Task StartCropAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        if (!Editing)
        {
            await BeginEditAsync();
        }
        IsCropping = true;
        await _module.InvokeVoidAsync("startCrop", ContainerId);
    }

    private static string? ColorString(string? color = null)
    {
        if (string.IsNullOrEmpty(color)
            || color[0] != '#')
        {
            return null;
        }
        if (color.Length is 4 or 7 or 9)
        {
            return color;
        }
        return null;
    }

    private async Task AddTextAsync()
    {
        var result = await DialogService.Show<Components.ImageEditor.Internal.TextDialog>("Add text").Result;
        if (result.Choice == DialogChoice.Ok
            && result.Data is string text
            && !string.IsNullOrWhiteSpace(text))
        {
            await AddTextAsync(text);
        }
    }

    private async Task CropAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        if (VerifyCrop is not null)
        {
            var bounds = await _module.InvokeAsync<CropBounds>("getCropBounds", ContainerId);
            if (bounds.Width > 0 && bounds.Height > 0)
            {
                var verified = await VerifyCrop.Invoke(this, bounds);
                if (!verified)
                {
                    await CancelAsync();
                    return;
                }
            }
        }
        await _module.InvokeVoidAsync("crop", ContainerId);
        IsCropping = false;
    }

    private string? GetAspectRatioClass(double? ratio) => new CssBuilder("btn btn-icon")
        .Add("filled",
            (!CropAspectRatio.HasValue && !ratio.HasValue)
            || (CropAspectRatio.HasValue && ratio.HasValue
            && Math.Abs(CropAspectRatio.Value - ratio.Value) < 0.00001))
        .ToString();

    private async Task RedoAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await _module.InvokeVoidAsync("redo", ContainerId);
    }

    private void RedoHistoryChanged(object? sender, bool e)
    {
        RedoHistoryHasState = e;
        StateHasChanged();
    }

    private async Task SetDrawingModeAsync(DrawingMode mode)
    {
        if (IsDisposed || _module is null || !Editing)
        {
            return;
        }
        DrawingMode = mode;
        await _module.InvokeVoidAsync("setDrawingMode", ContainerId, (int)DrawingMode);
    }

    private async Task SetIsErasingAsync(bool value)
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        IsErasing = value;
        await _module.InvokeVoidAsync("setIsErasing", ContainerId, value);
    }

    private async Task SetLoadingAsync(bool value = true)
    {
        IsLoading = value;
        await InvokeAsync(StateHasChanged);
    }

    private async Task SetBrushColorAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await _module.InvokeVoidAsync("setBrushColor", ContainerId, BrushColor);
    }

    private async Task SetBrushSizeAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await _module.InvokeVoidAsync("setBrushSize", ContainerId, BrushSize);
    }

    private async void TextEdit(object? sender, string e)
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        var result = await DialogService.Show<Components.ImageEditor.Internal.TextDialog>("Edit text", new DialogParameters
        {
            { nameof(Components.ImageEditor.Internal.TextDialog.Text), e },
        }).Result;
        if (result.Choice == DialogChoice.Ok
            && result.Data is string text
            && !string.IsNullOrWhiteSpace(text))
        {
            await _module.InvokeVoidAsync("editText", ContainerId, text);
        }
        else
        {
            await _module.InvokeVoidAsync("editText", ContainerId, e);
        }
    }

    private async Task UndoAsync()
    {
        if (IsDisposed || _module is null)
        {
            return;
        }
        await _module.InvokeVoidAsync("undo", ContainerId);
    }

    private void UndoHistoryChanged(object? sender, bool e)
    {
        UndoHistoryHasState = e;
        StateHasChanged();
    }
}
