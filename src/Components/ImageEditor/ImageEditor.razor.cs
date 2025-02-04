using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// An image editor component.
/// </summary>
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(CropEventArgs))]
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(StreamEventArgs))]
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ToggleEventArgs))]
public partial class ImageEditor() : IAsyncDisposable
{
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
    /// <para>
    /// The id of the editor element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

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
    /// <para>
    /// The quality of the output when exporting the image, for lossy formats.
    /// </para>
    /// <para>
    /// Values should fall between <c>0</c> and <c>1</c>. Values outside this range will be ignored,
    /// causing the browser to use a default quality.
    /// </para>
    /// <para>
    /// When using a lossless <see cref="Format"/> (such as the default, "image/png"), this
    /// parameter is ignored.
    /// </para>
    /// </summary>
    [Parameter] public double? Quality { get; set; }

    /// <summary>
    /// An optional callback invoked when saving the image. Receives a <see cref="Stream"/>
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
    /// An image source to load.
    /// </summary>
    /// <remarks>
    /// Any URL which would function as the <c>src</c> attribute for an HTML <c>img</c> element
    /// should work.
    /// </remarks>
    [Parameter] public string? Src { get; set; }

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
    [Parameter] public Func<ImageEditor, CropEventArgs, Task<bool>>? VerifyCrop { get; set; }

    [Inject, NotNull] private IJSRuntime? JSRuntime { get; set; }

    /// <inheritdoc />
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var wasEditing = Editing;

        await base.SetParametersAsync(parameters);

        if (wasEditing != Editing)
        {
            if (Editing)
            {
                await BeginEditAsync();
            }
            else
            {
                await CancelEditAsync();
            }
        }
    }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
    }

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _module = await JSRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-image-editor.js");
        }
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
            await _module.DisposeAsync();
        }
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Causes the control to enter edit mode.
    /// </summary>
    public async Task BeginEditAsync()
    {
        if (!IsDisposed && _module is not null)
        {
            await _module.InvokeVoidAsync("startEdit", Id);
        }
    }

    /// <summary>
    /// Causes the control to exit edit mode without saving.
    /// </summary>
    public async Task CancelEditAsync()
    {
        if (!IsDisposed && _module is not null)
        {
            await _module.InvokeVoidAsync("destroy", Id);
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
        if (!IsDisposed && _module is not null)
        {
            await _module.InvokeVoidAsync("clear", Id);
        }
    }

    /// <summary>
    /// Loads an image in the editor from a URL.
    /// </summary>
    /// <param name="imageUrl">The URL to load. Should resolve as an image file.</param>
    public async Task LoadImageAsync(string? imageUrl = null)
    {
        if (!IsDisposed && _module is not null)
        {
            await _module.InvokeVoidAsync("setImage", Id, imageUrl);
        }
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
        if (!IsDisposed && _module is not null)
        {
            using var streamReference = new DotNetStreamReference(stream);
            await _module.InvokeVoidAsync("setImageFromStream", Id, streamReference);
        }
    }

    /// <summary>
    /// Starts a crop operation.
    /// </summary>
    /// <remarks>
    /// Causes the control to enter edit mode if it wasn't already.
    /// </remarks>
    public async Task StartCropAsync()
    {
        if (!IsDisposed && _module is not null)
        {
            await _module.InvokeVoidAsync("startCrop", Id);
        }
    }

    private async Task OnCropAsync(CropEventArgs e)
    {
        if (IsDisposed || _module is null || VerifyCrop is null)
        {
            return;
        }

        if (!await VerifyCrop(this, e))
        {
            await _module.InvokeVoidAsync("undo", Id);
        }
    }

    private async Task OnEditChangeAsync(ToggleEventArgs e)
    {
        if (Editing == (e.Value ?? false))
        {
            return;
        }
        Editing = e.Value ?? false;
        await EditingChanged.InvokeAsync(Editing);
    }

    private async Task OnSaveAsync(StreamEventArgs e)
    {
        if (SaveCallback is null
            || e.Value is null)
        {
            return;
        }
        if (e.Value.Length > MaxAllowedStreamSize)
        {
            Console.WriteLine($"Length of {nameof(ImageEditor)} {Id} save stream was {e.Value.Length}B, which exceeds the configured maximum of {(MaxAllowedStreamSize <= 0 ? 512000 : MaxAllowedStreamSize)}B");
            return;
        }
        await using var stream = await e.Value.OpenReadStreamAsync(MaxAllowedStreamSize <= 0
            ? 512000
            : MaxAllowedStreamSize);
        await SaveCallback.Invoke(stream);
    }
}
