using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A rich text editor which supports any content type.
/// </summary>
public partial class Editor : IDisposable
{
    private bool _disposedValue;
    private bool _initialized;
    private bool _isFontSizeDialogVisible;
    private bool _isLineHeightDialogVisible;
    private bool _isLinkDialogVisible;
    private bool _isImgDialogVisible;

    /// <summary>
    /// Whether this editor should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

    /// <summary>
    /// An optional set of custom toolbar buttons.
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will be ignored.
    /// </remarks>
    [Parameter] public List<MarkdownEditorButton>? CustomToolbarButtons { get; set; }

    /// <summary>
    /// <para>
    /// Whether this editor shows source text or WYSIWYG mode.
    /// </para>
    /// <para>
    /// <see cref="EditorMode.WYSIWYG"/> is only supported when <see cref="Syntax"/> is set to <see
    /// cref="EditorSyntax.HTML"/> or <see cref="EditorSyntax.Markdown"/>. When <see cref="Syntax"/>
    /// has any other value, this property is ignored.
    /// </para>
    /// <para>
    /// By default this is set to <see cref="EditorMode.WYSIWYG"/>, but this is ignored if <see
    /// cref="Syntax"/> does not have a supported value.
    /// </para>
    /// </summary>
    [Parameter] public EditorMode EditMode { get; set; } = EditorMode.WYSIWYG;

    /// <summary>
    /// <para>
    /// Sets the height of the editor.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// <para>
    /// When left <see langword="null"/> (the default) the editor will auto-size based on the length
    /// of the content.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will be
    /// ignored.
    /// </remarks>
    [Parameter] public string? Height { get; set; }

    /// <summary>
    /// <para>
    /// The id of the editor element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// Whether <see cref="EditMode"/> can be changed by the user.
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will be
    /// ignored.
    /// </remarks>
    [Parameter] public bool LockEditMode { get; set; }

    /// <summary>
    /// <para>
    /// Whether <see cref="Syntax"/> can be changed by the user.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will be
    /// ignored.
    /// </remarks>
    [Parameter] public bool LockSyntax { get; set; } = true;

    /// <summary>
    /// The placeholder value.
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will be
    /// ignored.
    /// </remarks>
    [Parameter] public string? Placeholder { get; set; }

    /// <summary>
    /// Whether the editor is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// <para>
    /// Whether the browser's built-in spellcheck feature should be enabled for this field.
    /// </para>
    /// <para>
    /// Default is <see langword="null"/>, which means that the browser will use the default
    /// behavior.
    /// </para>
    /// <para>
    /// Note: this attribute may not be supported by all browsers.
    /// </para>
    /// </summary>
    [Parameter] public bool? Spellcheck { get; set; }

    /// <summary>
    /// <para>
    /// The type of text syntax expected by the editor (i.e. the code language).
    /// </para>
    /// <para>
    /// Defaults to plain text.
    /// </para>
    /// </summary>
    [Parameter] public EditorSyntax Syntax { get; set; }

    /// <summary>
    /// The tabindex of the viewer.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// <para>
    /// Whether the bound <see cref="InputBase{TValue}.Value"/> should update whenever the value
    /// changes (rather than on blur).
    /// </para>
    /// <para>
    /// When set to <see langword="true"/> a short debounce interval is applied to prevent excessive
    /// updates.
    /// </para>
    /// </summary>
    [Parameter] public bool UpdateOnInput { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add(ThemeColor.ToCSS())
        .Add("read-only", ReadOnly)
        .Add("editor-field")
        .Add("required", Required)
        .ToString();

    private ColorInput<string>? BackgroundPicker { get; set; }

    private string? CurrentBackground { get; set; } = "transparent";

    private string? CurrentFontFamily { get; set; } = "sans-serif";

    private string? CurrentFontSize { get; set; } = "1em";

    private string? CurrentForeground { get; set; } = "black";

    private int CurrentLength { get; set; }

    private string? CurrentLineHeight { get; set; } = "normal";

    private bool DisplayCommands => IsWysiwyg
        || Syntax is EditorSyntax.HTML or EditorSyntax.Markdown;

    private bool DisplayToolbar => DisplayCommands
        || !LockSyntax
        || (!LockEditMode && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown);

    private string? EditorClass => new CssBuilder("editor")
        .Add("set-height", !string.IsNullOrEmpty(Height))
        .Add(
            "no-toolbar",
            (EditMode != EditorMode.WYSIWYG
            || Syntax is not EditorSyntax.HTML and not EditorSyntax.Markdown)
            && LockSyntax)
        .ToString();

    private string? EditorStyle => new CssBuilder()
        .AddStyle("height", Height)
        .ToString();

    [Inject] private EditorService EditorService { get; set; } = default!;

    private List<string> Fonts { get; } = new() { "sans-serif", "serif", "monospace", "cursive" };

    private TextInput? FontSizeInput { get; set; }

    private List<string> FontSizes { get; } = new() { ".75em", ".875em", "1em", "1.25em", "1.5em", "1.75em", "2em", "2.5em", "3em" };

    private ColorInput<string>? ForegroundPicker { get; set; }

    private ImgInfo Img { get; set; } = new();

    private Form? ImgForm { get; set; }

    private bool IsWysiwyg => EditMode == EditorMode.WYSIWYG
        && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown;

    private TextInput? LineHeightInput { get; set; }

    private List<string> LineHeights { get; } = new() { "normal", "1", "1.2", "1.5", "2" };

    private LinkInfo Link { get; set; } = new();

    private Form? LinkForm { get; set; }

    private bool ShowAdvanced { get; set; }

    private string? ShowAdvancedClass => new CssBuilder("btn btn-icon small")
        .Add("filled", ShowAdvanced)
        .ToString();

    private string? SpellcheckValue => Spellcheck == true ? "true" : "false";

    [Inject] private UtilityService UtilityService { get; set; } = default!;

    /// <inheritdoc />
    protected override async Task OnInitializedAsync()
        => Fonts.AddRange(await UtilityService.GetFontsAsync());

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var newMode = EditorMode.None;
        var pendingMode = false;

        var newReadOnly = false;
        var pendingReadOnly = false;

        var newSyntax = EditorSyntax.None;
        var pendingSyntax = false;

        string? newValue = null;
        var pendingValue = false;

        if (_initialized)
        {
            if (parameters.TryGetValue(nameof(EditMode), out newMode)
                && newMode != EditMode)
            {
                pendingMode = true;
            }

            if (parameters.TryGetValue(nameof(ReadOnly), out newReadOnly)
                && newReadOnly != ReadOnly)
            {
                pendingReadOnly = true;
            }

            if (parameters.TryGetValue(nameof(Syntax), out newSyntax)
                && newSyntax != Syntax)
            {
                pendingSyntax = true;
            }

            if (parameters.TryGetValue(nameof(Value), out newValue)
                && newValue != Value)
            {
                pendingValue = true;
            }
        }

        await base.SetParametersAsync(parameters);

        if (pendingSyntax)
        {
            await SetSyntax(newSyntax);
        }

        if (pendingMode)
        {
            await SetModeAsync(newMode);
        }

        if (pendingValue)
        {
            await SetValueAsync(newValue);
        }

        if (pendingReadOnly)
        {
            await SetReadOnly(newReadOnly);
        }
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (!firstRender)
        {
            return;
        }

        EditorService.AutoFocus = AutoFocus;
        EditorService.EditMode = EditMode;
        EditorService.ElementId = Id;
        EditorService.InitialValue = Value;
        EditorService.Placeholder = Placeholder;
        EditorService.ReadOnly = ReadOnly;
        EditorService.Syntax = Syntax;
        EditorService.UpdateOnInput = UpdateOnInput;
        EditorService.OnInput += OnInput;
        _initialized = true;
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out string? result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = value;
        validationErrorMessage = null;
        HasConversionError = false;

        if (!IsTouched
            && !string.Equals(result, InitialValue))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && !string.Equals(result, CurrentValue))
        {
            EvaluateDebounced();
        }

        return true;
    }

    /// <summary>
    /// Clears the current input text.
    /// </summary>
    public async Task ClearAsync()
    {
        CurrentLength = 0;
        CurrentValueAsString = null;
        await SetValueAsync(null);
    }

    /// <summary>
    /// Focuses the editor.
    /// </summary>
    public async Task FocusAsync() => await EditorService.FocusEditorAsync();

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                EditorService.OnInput -= OnInput;
            }

            base.Dispose(disposing);

            _disposedValue = true;
        }
    }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
    private static async IAsyncEnumerable<string> ValidateFontSizeAsync(string? value, object? _)
    {
        if (string.IsNullOrEmpty(value))
        {
            yield break;
        }

        if (double.TryParse(value, out var _))
        {
            yield break;
        }

        if (!Regex.IsMatch(value, @"^(0?\.?[\d]+(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt))|((x+-)?small|smaller|medium|(x+-)?large|larger|inherit|initial|revert|revert-layer|unset)$"))
        {
            yield return "Invalid font size";
        }
    }

    private static async IAsyncEnumerable<string> ValidateLineHeightAsync(string? value, object? _)
    {
        if (string.IsNullOrEmpty(value))
        {
            yield break;
        }

        if (double.TryParse(value, out var _))
        {
            yield break;
        }

        if (!Regex.IsMatch(value, @"^(0?\.?[\d]+(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt))|(normal|inherit|initial|revert|revert-layer|unset)$"))
        {
            yield return "Invalid font size";
        }
    }

    private static async IAsyncEnumerable<string> ValidateUri(string? value, object? _)
    {
        if (string.IsNullOrEmpty(value))
        {
            yield break;
        }

        if (value.StartsWith('#'))
        {
            yield break;
        }

        if (Uri.TryCreate(value, UriKind.RelativeOrAbsolute, out var _))
        {
            yield break;
        }

        yield return "Must be a valid URL";
    }
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously

    private string ActiveButtonClass(EditorCommandType type) => EditorService
        .CommandsActive
        .TryGetValue(type, out var v)
        && v
        ? "btn btn-icon small filled"
        : "btn btn-icon small";

    private string ActiveButtonGroupClass(EditorCommandType type) => EditorService
        .CommandsActive
        .TryGetValue(type, out var v)
        && v
        ? "btn btn-icon filled"
        : "btn btn-icon";

    private async Task CommandAsync(EditorCommandType type, params object?[] parameters)
        => await EditorService.ActivateCommandAsync(type, parameters);

    private bool IsActive(EditorCommandType type) => EditorService
        .CommandsActive
        .TryGetValue(type, out var v)
        && v;

    private bool IsDisabled(EditorCommandType type) => ReadOnly
        || (EditorService
            .CommandsEnabled
            .TryGetValue(type, out var v)
        && !v);

    private void OnInput(object? sender, string? value)
    {
        CurrentLength = value?.Length ?? 0;

        if (!string.Equals(CurrentValueAsString, value))
        {
            CurrentValueAsString = value;
        }
    }

    private Task SetBackgroundAsync(string? value)
    {
        CurrentBackground = value;
        return CommandAsync(EditorCommandType.BackgroundColor, value);
    }

    private Task SetFontFamilyAsync(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return Task.CompletedTask;
        }

        CurrentFontFamily = value;
        return CommandAsync(EditorCommandType.SetFontFamily, value);
    }

    private async Task SetFontSizeAsync()
    {
        if (string.IsNullOrEmpty(CurrentFontSize))
        {
            return;
        }

        if (FontSizeInput is not null)
        {
            await FontSizeInput.ValidateAsync();
            if (!FontSizeInput.IsValid)
            {
                return;
            }
        }

        if (double.TryParse(CurrentFontSize, out var _))
        {
            CurrentFontSize = $"{CurrentFontSize}em";
        }
        await CommandAsync(EditorCommandType.SetFontSize, CurrentFontSize);
    }

    private Task SetForegroundAsync(string? value)
    {
        CurrentForeground = value;
        return CommandAsync(EditorCommandType.ForegroundColor, value);
    }

    private async Task SetLineHeightAsync()
    {
        if (string.IsNullOrEmpty(CurrentLineHeight))
        {
            return;
        }

        if (LineHeightInput is not null)
        {
            await LineHeightInput.ValidateAsync();
            if (!LineHeightInput.IsValid)
            {
                return;
            }
        }

        await CommandAsync(EditorCommandType.SetLineHeight, CurrentLineHeight);
    }

    private async Task SetModeAsync(EditorMode value)
    {
        EditMode = value;
        EditorService.EditMode = value;
        if (_initialized)
        {
            await EditorService.SetEditorMode(value);
        }
    }

    private async Task SetReadOnly(bool value)
    {
        EditorService.ReadOnly = value;
        if (_initialized)
        {
            await EditorService.SetReadOnly(value);
        }
    }

    private async Task SetSyntax(EditorSyntax value)
    {
        Syntax = value;
        EditorService.Syntax = value;
        if (_initialized)
        {
            await EditorService.SetSyntax(value);
        }
    }

    private async Task SetValueAsync(string? value)
    {
        if (_initialized)
        {
            await EditorService.SetValue(value);
        }
    }

    private void ShowImgDialog()
    {
        Img.Alt = null;
        Img.Src = null;
        Img.Title = null;
        _isImgDialogVisible = true;
    }

    private void ShowFontSizeDialog()
    {
        CurrentFontSize = "1em";
        _isFontSizeDialogVisible = true;
    }

    private void ShowLineHeightDialog()
    {
        CurrentLineHeight = "normal";
        _isLineHeightDialogVisible = true;
    }

    private async Task ShowLinkDialogAsync()
    {
        if (IsActive(EditorCommandType.InsertLink))
        {
            await CommandAsync(EditorCommandType.InsertLink);
            return;
        }

        Link.Title = null;
        Link.Url = null;
        _isLinkDialogVisible = true;
    }

    private async Task SubmitImgDialogAsync()
    {
        if (ImgForm is null
            || string.IsNullOrEmpty(Img.Src))
        {
            return;
        }

        var valid = await ImgForm.ValidateAsync();
        if (!valid)
        {
            return;
        }

        var src = System.Text.Encodings.Web.UrlEncoder.Default.Encode(Img.Src);
        var title = string.IsNullOrEmpty(Img.Title)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(Img.Title);
        var alt = string.IsNullOrEmpty(Img.Alt)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(Img.Alt);
        await CommandAsync(EditorCommandType.InsertImage, src, title, alt);
        _isImgDialogVisible = false;
    }

    private async Task SubmitLinkDialogAsync()
    {
        if (LinkForm is null
            || string.IsNullOrEmpty(Link.Url))
        {
            return;
        }

        var valid = await LinkForm.ValidateAsync();
        if (!valid)
        {
            return;
        }

        var url = System.Text.Encodings.Web.UrlEncoder.Default.Encode(Link.Url);
        var title = string.IsNullOrEmpty(Link.Title)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(Link.Title);
        await CommandAsync(EditorCommandType.InsertLink, url, title);
        _isLinkDialogVisible = false;
    }

    private async Task ToggleModeAsync()
    {
        EditMode = EditMode == EditorMode.WYSIWYG
            ? EditorMode.Text
            : EditorMode.WYSIWYG;
        EditorService.EditMode = EditMode;
        if (_initialized)
        {
            await EditorService.SetEditorMode(EditMode);
        }
    }

    private class ImgInfo
    {
        public string? Alt { get; set; }
        public string? Src { get; set; }
        public string? Title { get; set; }
    }

    private class LinkInfo
    {
        public string? Title { get; set; }
        public string? Url { get; set; }
    }
}