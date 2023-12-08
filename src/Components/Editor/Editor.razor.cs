using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Editor.InternalDialogs;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A rich text editor which supports any content type.
/// </summary>
public partial class Editor : FormComponentBase<string>
{
    private bool _disposedValue;
    private bool _initialized;

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
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will be
    /// ignored.
    /// </remarks>
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
        .Add("editor-field")
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

    private ColorInput<string>? BackgroundPicker { get; set; }

    private string? BoldClass => new CssBuilder()
        .Add("filled", IsActive(EditorCommandType.Strong))
        .Add("outlined", IsActive(EditorCommandType.Bold))
        .ToString();

    private int CurrentLength { get; set; }

    [Inject, NotNull] DialogService? DialogService { get; set; }

    private bool DisplayCommands => IsWysiwyg
        || Syntax is EditorSyntax.HTML or EditorSyntax.Markdown;

    private bool DisplayShowAll => DisplayCommands
        || !LockSyntax
        || (!LockEditMode && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown)
        || CustomToolbarButtons is not null;

    private string? EditorClass => new CssBuilder("editor")
        .Add("set-height", !string.IsNullOrEmpty(Height) || !string.IsNullOrEmpty(MaxHeight))
        .Add("no-statusbar", IsReadOnly || IsDisabled || !IsWysiwyg)
        .Add("no-toolbar", IsReadOnly || IsDisabled)
        .ToString();

    private string? EditorStyle => new CssBuilder()
        .AddStyle("height", Height)
        .AddStyle("max-height", MaxHeight)
        .ToString();

    [Inject, NotNull] private EditorService? EditorService { get; set; }

    private List<string> Fonts { get; } = ["sans-serif", "serif", "monospace", "cursive"];

    private ColorInput<string>? ForegroundPicker { get; set; }

    private bool IsWysiwyg => EditorMode == EditorMode.WYSIWYG
        && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown;

    private string? ItalicClass => new CssBuilder()
        .Add("filled", IsActive(EditorCommandType.Italic))
        .Add("outlined", IsActive(EditorCommandType.Italic))
        .ToString();

    private string? Language => Syntax switch
    {
        EditorSyntax.None => null,
        EditorSyntax.Cpp => "language-cpp",
        EditorSyntax.CSharp => "language-csharp",
        EditorSyntax.HTML => "language-xml",
        EditorSyntax.ObjectiveC => "language-objectivec",
        _ => $"language-{Syntax.ToString().ToLowerInvariant()}",
    };

    private string? LanguageClass => new CssBuilder("static-syntax-highlighting")
        .Add(Language)
        .ToString();

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

    private string? NewForeground { get; set; } = "black";

    private bool ShowAll { get; set; }

    private string? ShowAllClass => new CssBuilder("btn btn-icon rounded small editor-toolbar-show-all-btn")
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

    private MarkupString StaticContent
    {
        get
        {
            if (string.IsNullOrEmpty(Value))
            {
                if (string.IsNullOrEmpty(Placeholder))
                {
                    return new();
                }
                return new($"<span class=\"text-muted\">{Placeholder}</span>");
            }
            return new(Value);
        }
    }

    private string TableGroupId { get; set; } = Guid.NewGuid().ToHtmlId();

    private string? ToolbarClass => new CssBuilder("editor-toolbar")
        .Add("editor-toolbar-extended", ShowAll)
        .ToString();

    [Inject, NotNull] private UtilityService? UtilityService { get; set; }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var newReadOnly = false;
        var pendingReadOnly = false;

        var newDisabled = false;
        var pendingDisabled = false;

        var newSyntax = EditorSyntax.None;
        var pendingSyntax = false;

        string? newValue = null;
        var pendingValue = false;

        if (_initialized)
        {
            if (parameters.TryGetValue(nameof(ReadOnly), out newReadOnly)
                && newReadOnly != ReadOnly)
            {
                pendingReadOnly = true;
            }

            if (parameters.TryGetValue(nameof(Disabled), out newDisabled)
                && newDisabled != Disabled)
            {
                pendingDisabled = true;
            }

            if (parameters.TryGetValue(nameof(Syntax), out newSyntax)
                && newSyntax != Syntax)
            {
                pendingSyntax = true;
            }

            if (parameters.TryGetValue(
                nameof(Value),
                out newValue)
                && ((newValue is null) != (Value is null)
                    || newValue?.Equals(Value) == false))
            {
                pendingValue = true;
            }
        }

        await base.SetParametersAsync(parameters);

        if (pendingSyntax)
        {
            await SetSyntax(newSyntax);
        }

        if (pendingValue)
        {
            await SetValueAsync(newValue);
        }

        if (pendingReadOnly || pendingDisabled)
        {
            await SetReadOnly(newReadOnly || newDisabled);
        }
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (IsInteractive)
        {
            if (!_initialized)
            {
                EditorService.AutoFocus = AutoFocus;
                EditorService.EditMode = EditorMode;
                EditorService.ElementId = Id;
                EditorService.InitialValue = Value;
                EditorService.Placeholder = Placeholder;
                EditorService.ReadOnly = ReadOnly || Disabled;
                EditorService.Syntax = Syntax;
                EditorService.UpdateOnInput = UpdateOnInput;
                EditorService.OnInput += OnInput;
                EditorService.CommandsUpdated += CommandsUpdated;
                _initialized = true;
            }
        }
        else if (firstRender)
        {
            Fonts.AddRange(await UtilityService.GetFontsAsync());
            IsInteractive = true;
            StateHasChanged();
        }
    }

    /// <summary>
    /// Sets the <see cref="EditorMode"/> of this editor.
    /// </summary>
    /// <param name="value">
    /// <para>
    /// The mode to set.
    /// </para>
    /// <para>
    /// <see cref="EditorMode.WYSIWYG"/> is only supported when <see cref="Syntax"/> is set to <see
    /// cref="EditorSyntax.HTML"/> or <see cref="EditorSyntax.Markdown"/>. When <see cref="Syntax"/>
    /// has any other value, the <see cref="EditorMode"/> is ignored.
    /// </para>
    /// </param>
    public async Task SetModeAsync(EditorMode value)
    {
        EditorMode = value;
        EditorService.EditMode = value;
        if (_initialized)
        {
            await EditorService.SetEditorMode(value);
        }
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out string result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = value!;
        validationErrorMessage = null;
        HasConversionError = false;
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
    public override async Task FocusAsync() => await EditorService.FocusEditorAsync();

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
        ? "btn btn-icon filled"
        : "btn btn-icon";

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

    private bool IsCommandDisabled(EditorCommandType type) => ReadOnly
        || Disabled
        || !EditorService
            .CommandsEnabled
            .TryGetValue(type, out var v)
        || !v;

    private bool IsAdvMarkDisabled() => ReadOnly
        || Disabled
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
        || Disabled
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
        || Disabled
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

    private void OnInput(object? sender, string? value)
    {
        CurrentLength = value?.Length ?? 0;

        if (!string.Equals(CurrentValueAsString, value))
        {
            CurrentValueAsString = value;
        }
    }

    private Task SetFontFamilyAsync(string? value)
    {
        NewFontFamily = value;
        return CommandAsync(EditorCommandType.SetFontFamily, value);
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

    private async Task ShowImgDialogAsync()
    {
        var result = await DialogService.Show<ImgDialog>("Image").Result;
        if (result.Choice != DialogChoice.Ok
            || result.Data is not ImgInfo img
            || string.IsNullOrEmpty(img.Src)
            || !Uri.TryCreate(img.Src, UriKind.RelativeOrAbsolute, out var uri))
        {
            return;
        }

        if (!uri.IsAbsoluteUri
            && Uri.TryCreate("http://" + img.Src, UriKind.Absolute, out var uri2))
        {
            uri = uri2;
        }

        var title = string.IsNullOrEmpty(img.Title)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(img.Title);
        var alt = string.IsNullOrEmpty(img.Alt)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(img.Alt);
        await CommandAsync(EditorCommandType.InsertImage, uri, title, alt);
    }

    private async Task ShowFontSizeDialogAsync()
    {
        var result = await DialogService.Show<FontSizeDialog>("Font Size").Result;
        if (result.Choice == DialogChoice.Ok
            && result.Data is string newFontSize)
        {
            await CommandAsync(EditorCommandType.SetFontSize, newFontSize);
        }
    }

    private async Task ShowLineHeightDialogAsync()
    {
        var result = await DialogService.Show<LineHeightDialog>("Line Height").Result;
        if (result.Choice == DialogChoice.Ok
            && result.Data is string newLineHeight)
        {
            await CommandAsync(EditorCommandType.SetLineHeight, newLineHeight);
        }
    }

    private async Task ShowLinkDialogAsync()
    {
        if (IsActive(EditorCommandType.InsertLink))
        {
            await CommandAsync(EditorCommandType.InsertLink);
            return;
        }

        var result = await DialogService.Show<LinkDialog>("Link").Result;
        if (result.Choice != DialogChoice.Ok
            || result.Data is not LinkInfo link
            || string.IsNullOrEmpty(link.Url)
            || !Uri.TryCreate(link.Url, UriKind.RelativeOrAbsolute, out var uri))
        {
            return;
        }

        if (!uri.IsAbsoluteUri
            && Uri.TryCreate("http://" + link.Url, UriKind.Absolute, out var uri2))
        {
            uri = uri2;
        }

        var title = string.IsNullOrEmpty(link.Title)
            ? null
            : System.Text.Encodings.Web.HtmlEncoder.Default.Encode(link.Title);
        await CommandAsync(EditorCommandType.InsertLink, uri.ToString(), title);
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
}