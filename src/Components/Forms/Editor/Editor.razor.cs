using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Components.Web;
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
    private bool _isSyntaxDialogVisible;

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
    [Parameter] public List<EditorButton>? CustomToolbarButtons { get; set; }

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
    [Parameter] public EditorMode EditorMode { get; set; } = EditorMode.WYSIWYG;

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
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// Whether <see cref="EditorMode"/> can be changed by the user.
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
    /// <para>
    /// Sets the maximum height of the editor.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// </summary>
    [Parameter] public string? MaxHeight { get; set; }

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

    private string? AdditionalMarksClass => new CssBuilder("small")
        .Add("button-group", IsActive(EditorCommandType.Underline))
        .Add("button-group-text", !IsActive(EditorCommandType.Underline))
        .Add(
            "outlined",
            IsActive(EditorCommandType.Strikethrough)
            || IsActive(EditorCommandType.Subscript)
            || IsActive(EditorCommandType.Superscript)
            || IsActive(EditorCommandType.CodeInline)
            || IsActive(EditorCommandType.Small)
            || IsActive(EditorCommandType.Inserted))
        .ToString();

    private string AdditionalMarksGroupId { get; set; } = Guid.NewGuid().ToHtmlId();

    private Dropdown? BackgroundContext { get; set; }

    private ColorInput<string>? BackgroundPicker { get; set; }

    private string? BoldClass => new CssBuilder("rounded small")
        .Add("filled", IsActive(EditorCommandType.Strong))
        .Add("outlined", IsActive(EditorCommandType.Bold))
        .ToString();

    private int CurrentLength { get; set; }

    private bool DisplayCommands => IsWysiwyg
        || Syntax is EditorSyntax.HTML or EditorSyntax.Markdown;

    private bool DisplayShowAll => DisplayCommands
        || !LockSyntax
        || (!LockEditMode && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown)
        || CustomToolbarButtons is not null;

    private string? EditorClass => new CssBuilder("editor")
        .Add("set-height", !string.IsNullOrEmpty(Height) || !string.IsNullOrEmpty(MaxHeight))
        .Add("no-statusbar", !IsWysiwyg)
        .ToString();

    private string? EditorStyle => new CssBuilder()
        .AddStyle("height", Height)
        .AddStyle("max-height", MaxHeight)
        .ToString();

    [Inject] private EditorService EditorService { get; set; } = default!;

    private List<string> Fonts { get; } = new() { "sans-serif", "serif", "monospace", "cursive" };

    private TextInput? FontSizeInput { get; set; }

    private List<string> FontSizes { get; } = new() { "Reset", ".75em", ".875em", "1em", "1.25em", "1.5em", "1.75em", "2em", "2.5em", "3em" };

    private Dropdown? ForegroundContext { get; set; }

    private ColorInput<string>? ForegroundPicker { get; set; }

    private ImgInfo Img { get; set; } = new();

    private Form? ImgForm { get; set; }

    private bool IsWysiwyg => EditorMode == EditorMode.WYSIWYG
        && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown;

    private string? ItalicClass => new CssBuilder("rounded small")
        .Add("filled", IsActive(EditorCommandType.Italic))
        .Add("outlined", IsActive(EditorCommandType.Italic))
        .ToString();

    private TextInput? LineHeightInput { get; set; }

    private List<string> LineHeights { get; } = new() { "Reset", "normal", "1", "1.2", "1.5", "2" };

    private LinkInfo Link { get; set; } = new();

    private Form? LinkForm { get; set; }

    private string? ListGroupClass => new CssBuilder("small")
        .Add("button-group", IsActive(EditorCommandType.ListBullet))
        .Add("button-group-text", !IsActive(EditorCommandType.ListBullet))
        .Add(
            "outlined",
            IsActive(EditorCommandType.ListNumber)
            || IsActive(EditorCommandType.ListCheck))
        .ToString();

    private string ListsGroupId { get; set; } = Guid.NewGuid().ToHtmlId();

    private string? NewBackground { get; set; } = "transparent";

    private string? NewFontFamily { get; set; } = "sans-serif";

    private string? NewFontSize { get; set; } = "1em";

    private string? NewForeground { get; set; } = "black";

    private string? NewLineHeight { get; set; } = "normal";

    private EditorSyntax NewCodeSyntax { get; set; }

    private bool ShowAll { get; set; }

    private string? ShowAllClass => new CssBuilder("btn btn-icon rounded small")
        .Add("filled", ShowAll)
        .ToString();

    private string? SpellcheckValue
    {
        get
        {
            if (Spellcheck.HasValue)
            {
                return Spellcheck.Value ? "true" : "false";
            }
            return IsWysiwyg ? "true" : "false";
        }
    }

    private string TableGroupId { get; set; } = Guid.NewGuid().ToHtmlId();

    private string? ToolbarClass => new CssBuilder("editor-toolbar")
        .Add("editor-toolbar-extended", ShowAll)
        .ToString();

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
            if (parameters.TryGetValue(nameof(EditorMode), out newMode)
                && newMode != EditorMode)
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
        EditorService.EditMode = EditorMode;
        EditorService.ElementId = Id;
        EditorService.InitialValue = Value;
        EditorService.Placeholder = Placeholder;
        EditorService.ReadOnly = ReadOnly;
        EditorService.Syntax = Syntax;
        EditorService.UpdateOnInput = UpdateOnInput;
        EditorService.OnInput += OnInput;
        EditorService.CommandsUpdated += CommandsUpdated;
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
                EditorService.CommandsUpdated -= CommandsUpdated;
                EditorService.OnInput -= OnInput;
            }

            base.Dispose(disposing);

            _disposedValue = true;
        }
    }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
    private static async IAsyncEnumerable<string> ValidateFontSizeAsync(string? value, object? _)
    {
        if (string.IsNullOrEmpty(value)
            || value == "Reset")
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
        if (string.IsNullOrEmpty(value)
            || value == "Reset")
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
        ? "btn btn-icon rounded small filled"
        : "btn btn-icon rounded small";

    private string ActiveButtonGroupClass(EditorCommandType type) => EditorService
        .CommandsActive
        .TryGetValue(type, out var v)
        && v
        ? "btn btn-icon rounded-left filled"
        : "btn btn-icon rounded-left";

    private string? ActiveThemeClass(EditorCommandType type) => IsActive(type)
        ? (ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor).ToCSS()
        : null;

    private async Task CommandAsync(EditorCommandType type, params object?[] parameters)
        => await EditorService.ActivateCommandAsync(type, parameters);

    private void CommandsUpdated(object? _, EventArgs e) => StateHasChanged();

    private bool IsActive(EditorCommandType type) => EditorService
        .CommandsActive
        .TryGetValue(type, out var v)
        && v;

    private bool IsDisabled(EditorCommandType type) => ReadOnly
        || !EditorService
            .CommandsEnabled
            .TryGetValue(type, out var v)
        || !v;

    private bool IsAdvMarkDisabled() => ReadOnly
        || ((!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.Strikethrough, out var st)
        || !st)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.Subscript, out var sb)
        || !sb)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.Superscript, out var sp)
        || !sp)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.CodeInline, out var c)
        || !c)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.Small, out var sm)
        || !sm)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.Inserted, out var i)
        || !i));

    private bool IsBlockDisabled() => ReadOnly
        || ((!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.Heading, out var h)
        || !h)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.Paragraph, out var p)
        || !p)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.BlockQuote, out var b)
        || !b)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.CodeBlock, out var c)
        || !c));

    private bool IsTableDisabled() => ReadOnly
        || ((!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableInsertColumnBefore, out var t1)
        || !t1)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableInsertColumnAfter, out var t2)
        || !t2)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableDeleteColumn, out var t3)
        || !t3)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableInsertRowBefore, out var t4)
        || !t4)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableInsertRowAfter, out var t5)
        || !t5)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableDeleteRow, out var t6)
        || !t6)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableDelete, out var t7)
        || !t7)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableMergeCells, out var t8)
        || !t8)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableSplitCell, out var t9)
        || !t9)
        && (!EditorService
            .CommandsEnabled
            .TryGetValue(EditorCommandType.TableToggleHeaderRow, out var t10)
        || !t10));

    private void OnBackgroundContext(MouseEventArgs e) => BackgroundContext?.Open(e);

    private async Task OnCustomButtonAsync(EditorButton button)
    {
        if (button.Action is null
            && button.AsyncAction is null)
        {
            return;
        }

        var value = await EditorService.GetSelectedText();
        if (button.Action is not null)
        {
            value = button.Action.Invoke(value);
        }

        if (button.AsyncAction is not null)
        {
            value = await button.AsyncAction.Invoke(value);
        }

        await EditorService.UpdateSelectedText(value);
    }

    private void OnForegroundContext(MouseEventArgs e) => ForegroundContext?.Open(e);

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
        NewBackground = value;
        return CommandAsync(EditorCommandType.BackgroundColor, value);
    }

    private Task SetCodeSyntaxAsync(EditorSyntax value)
    {
        NewCodeSyntax = value;
        return CommandAsync(EditorCommandType.SetCodeSyntax, value.ToString());
    }

    private Task SetFontFamilyAsync(string? value)
    {
        NewFontFamily = value;
        return CommandAsync(EditorCommandType.SetFontFamily, value);
    }

    private async Task SetFontSizeAsync()
    {
        if (NewFontSize == "Reset")
        {
            NewFontSize = null;
        }

        if (FontSizeInput is not null)
        {
            await FontSizeInput.ValidateAsync();
            if (!FontSizeInput.IsValid)
            {
                return;
            }
        }

        if (!string.IsNullOrEmpty(NewFontSize)
            && double.TryParse(NewFontSize, out var _))
        {
            NewFontSize = $"{NewFontSize}em";
        }
        await CommandAsync(EditorCommandType.SetFontSize, NewFontSize);
        _isFontSizeDialogVisible = false;
    }

    private Task SetForegroundAsync(string? value)
    {
        NewForeground = value;
        return CommandAsync(EditorCommandType.ForegroundColor, value);
    }

    private async Task SetLineHeightAsync()
    {
        if (NewLineHeight == "Reset")
        {
            NewLineHeight = null;
        }

        if (LineHeightInput is not null)
        {
            await LineHeightInput.ValidateAsync();
            if (!LineHeightInput.IsValid)
            {
                return;
            }
        }

        await CommandAsync(EditorCommandType.SetLineHeight, NewLineHeight);
        _isLineHeightDialogVisible = false;
    }

    private async Task SetModeAsync(EditorMode value)
    {
        EditorMode = value;
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
        var oldSyntax = Syntax;
        Syntax = value;
        EditorService.Syntax = value;
        if (_initialized)
        {
            await EditorService.SetSyntax(value);
            if (value is EditorSyntax.HTML
                or EditorSyntax.Markdown
                && oldSyntax is not EditorSyntax.HTML
                and not EditorSyntax.Markdown
                && EditorMode == EditorMode.WYSIWYG)
            {
                await EditorService.SetEditorMode(EditorMode);
            }
        }
    }

    private async Task SetValueAsync(string? value)
    {
        if (_initialized)
        {
            await EditorService.SetValue(value);
        }
    }

    private void ShowCodeSyntaxDialog()
    {
        NewCodeSyntax = EditorSyntax.None;
        _isSyntaxDialogVisible = true;
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
        NewFontSize = "1em";
        _isFontSizeDialogVisible = true;
    }

    private void ShowLineHeightDialog()
    {
        NewLineHeight = "normal";
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

        if (!Uri.TryCreate(Img.Src, UriKind.RelativeOrAbsolute, out var uri))
        {
            return;
        }
        if (!uri.IsAbsoluteUri
            && Uri.TryCreate("http://" + Img.Src, UriKind.Absolute, out var uri2))
        {
            uri = uri2;
        }

        var title = string.IsNullOrEmpty(Img.Title)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(Img.Title);
        var alt = string.IsNullOrEmpty(Img.Alt)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(Img.Alt);
        await CommandAsync(EditorCommandType.InsertImage, uri, title, alt);
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

        if (!Uri.TryCreate(Link.Url, UriKind.RelativeOrAbsolute, out var uri))
        {
            return;
        }
        if (!uri.IsAbsoluteUri
            && Uri.TryCreate("http://" + Link.Url, UriKind.Absolute, out var uri2))
        {
            uri = uri2;
        }

        var title = string.IsNullOrEmpty(Link.Title)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(Link.Title);
        await CommandAsync(EditorCommandType.InsertLink, uri.ToString(), title);
        _isLinkDialogVisible = false;
    }

    private async Task ToggleModeAsync()
    {
        EditorMode = EditorMode == EditorMode.WYSIWYG
            ? EditorMode.Text
            : EditorMode.WYSIWYG;
        EditorService.EditMode = EditorMode;
        if (_initialized)
        {
            await EditorService.SetEditorMode(EditorMode);
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