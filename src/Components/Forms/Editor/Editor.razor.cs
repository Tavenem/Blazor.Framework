using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A rich text editor which supports any content type.
/// </summary>
public partial class Editor : IDisposable
{
    private bool _disposedValue;
    private bool _initialized;

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

    private int CurrentLength { get; set; }

    private bool DisplayToolbar => !LockSyntax
        || IsWysiwyg
        || (Syntax is EditorSyntax.HTML or EditorSyntax.Markdown
        && !LockEditMode);

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

    private bool IsWysiwyg => EditMode == EditorMode.WYSIWYG
        && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown;

    private string? SpellcheckValue => Spellcheck == true ? "true" : "false";

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

    private void OnInput(object? sender, string? value)
    {
        CurrentLength = value?.Length ?? 0;

        if (!string.Equals(CurrentValueAsString, value))
        {
            CurrentValueAsString = value;
        }
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
}