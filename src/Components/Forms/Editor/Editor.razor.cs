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
    /// <para>
    /// The content type used by this editor.
    /// </para>
    /// <para>
    /// Defaults to plain text.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will not
    /// update the content type of the editor.
    /// </remarks>
    [Parameter] public EditorContentType ContentType { get; set; }

    /// <summary>
    /// An optional set of custom toolbar buttons.
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will not
    /// update the toolbar.
    /// </remarks>
    [Parameter] public List<MarkdownEditorButton>? CustomToolbarButtons { get; set; }

    /// <summary>
    /// Whether the editor is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// <para>
    /// Whether this editor shows raw text or WYSIWYG mode.
    /// </para>
    /// <para>
    /// Only available for rendered content types, such as markdown and HTML.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: this parameter does not update to reflect the user switching modes via the UI. You
    /// may, however, update the property programmatically to force a mode switch.
    /// </remarks>
    [Parameter] public EditorMode EditMode { get; set; }

    /// <summary>
    /// <para>
    /// Sets the height CSS style for the editor.
    /// </para>
    /// <para>
    /// Should include a unit, such as "200px" or "10rem."
    /// </para>
    /// <para>
    /// Default is "40rem."
    /// </para>
    /// </summary>
    [Parameter] public string Height { get; set; } = "40rem";

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
    /// <para>
    /// Whether <see cref="EditMode"/> can be changed by the user.
    /// </para>
    /// <para>
    /// Only applies to rendered content types, such as markdown and HTML.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will not
    /// update the lock state.
    /// </remarks>
    [Parameter] public bool LockEditMode { get; set; }

    /// <summary>
    /// The maximum length of the input.
    /// </summary>
    [Parameter] public int? MaxLength { get; set; }

    /// <summary>
    /// The placeholder value.
    /// </summary>
    /// <remarks>
    /// Note: this property is only referenced during initialization. Subsequent changes will not
    /// update the placeholder.
    /// </remarks>
    [Parameter] public string? Placeholder { get; set; }

    /// <summary>
    /// Whether to show a split view with markdown and a rendered preview, or separate tabs with the
    /// text and preview, when <see cref="ContentType"/> is set to <see
    /// cref="EditorContentType.Markdown"/> and <see cref="EditMode"/> is set to <see
    /// cref="EditorMode.Text"/>.
    /// </summary>
    [Parameter] public MarkdownPreviewStyle PreviewStyle { get; set; }

    /// <summary>
    /// Whether the editor is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show the current character count and maximum length, if <see cref="MaxLength"/>
    /// has been set.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>
    /// </para>
    /// </summary>
    [Parameter] public bool ShowLength { get; set; } = true;

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
    /// The tabindex of the viewer.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// <para>
    /// Whether the bound <see cref="InputBase{TValue}.Value"/> should update whenever the value
    /// changes (rather than on blur or when the enter key is pressed).
    /// </para>
    /// <para>
    /// When set to <see langword="true"/> a short debounce interval is applied to prevent excessive
    /// updates.
    /// </para>
    /// </summary>
    [Parameter] public bool UpdateOnInput { get; set; }

    /// <inheritdoc />
    protected override string? CssStyle => new CssBuilder(base.CssStyle)
        .AddStyle("height", Height)
        .ToString();

    /// <summary>
    /// A reference to the editor element.
    /// </summary>
    protected ElementReference ElementReference { get; set; }

    private int CurrentLength { get; set; }

    private string? EditorClass => new CssBuilder("editor")
        .Add("toastui-editor-dark", IsDarkMode)
        .ToString();

    [Inject] private EditorService EditorService { get; set; } = default!;

    private bool IsDarkMode { get; set; }

    private string? SpellcheckValue => Spellcheck == true ? "true" : "false";

    [Inject] private ThemeService ThemeService { get; set; } = default!;

    [Inject] private UtilityService UtilityService { get; set; } = default!;

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        string? newValue = null;
        var pendingValue = false;

        var newMode = EditorMode.None;
        var pendingMode = false;

        var newStyle = MarkdownPreviewStyle.None;
        var pendingStyle = false;

        var newReadOnly = false;
        var pendingReadOnly = false;

        if (_initialized)
        {
            if (parameters.TryGetValue(nameof(Value), out newValue)
                && newValue != Value)
            {
                pendingValue = true;
            }

            if (parameters.TryGetValue(nameof(EditMode), out newMode)
                && newMode != EditMode)
            {
                pendingMode = true;
            }

            if (parameters.TryGetValue(nameof(PreviewStyle), out newStyle)
                && newStyle != PreviewStyle)
            {
                pendingStyle = true;
            }

            if (parameters.TryGetValue(nameof(ReadOnly), out newReadOnly)
                && newReadOnly != ReadOnly)
            {
                pendingReadOnly = true;
            }
        }

        await base.SetParametersAsync(parameters);

        if (pendingValue)
        {
            await SetValueAsync(newValue);
        }

        if (pendingMode)
        {
            await SetModeAsync(newMode);
        }

        if (pendingStyle)
        {
            await SetPreviewStyle(newStyle);
        }

        if (pendingReadOnly)
        {
            await SetReadOnly(newReadOnly);
        }

        if (string.IsNullOrEmpty(Height))
        {
            Height = "40rem";
        }
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            var mode = await ThemeService.GetPreferredColorScheme();
            IsDarkMode = mode == ThemePreference.Dark;
            ThemeService.OnThemeChange += OnThemeChange;

            EditorService.AutoFocus = AutoFocus;
            EditorService.ContentType = ContentType;
            EditorService.EditMode = EditMode;
            EditorService.ElementId = Id;
            EditorService.LockEditMode = LockEditMode;
            EditorService.MarkdownEditorButtons = CustomToolbarButtons;
            EditorService.Placeholder = Placeholder;
            EditorService.PreviewStyle = PreviewStyle;
            EditorService.ReadOnly = ReadOnly;
            EditorService.UpdateOnInput = UpdateOnInput;
            EditorService.OnInput += OnInput;
            _initialized = true;
        }
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
    public async Task FocusAsync()
    {
        EditorService.FocusEditorAsync()
    }

    /// <summary>
    /// Selects all text in this editor.
    /// </summary>
    public ValueTask SelectAsync() => ElementReference.SelectAsync();

    /// <summary>
    /// Selects a range of text in this editor.
    /// </summary>
    /// <param name="start">The index of the first character to select.</param>
    /// <param name="end">
    /// <para>
    /// The exclusive index of the last index in the selection.
    /// </para>
    /// <para>
    /// If <see langword="null"/> the entire remaining text will be selected.
    /// </para>
    /// </param>
    public ValueTask SelectRangeAsync(int start, int? end = null)
        => ElementReference.SelectRangeAsync(start, end);

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                ThemeService.OnThemeChange -= OnThemeChange;
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

    private async void OnThemeChange(object? sender, ThemePreference theme)
    {
        IsDarkMode = theme == ThemePreference.Dark;
        if (ContentType == EditorContentType.None)
        {
            await EditorService.SetCodeEditorTheme(theme);
        }
    }

    private async Task SetModeAsync(EditorMode value)
    {
        EditorService.EditMode = value;
        if (_initialized && ContentType == EditorContentType.Markdown)
        {
            await EditorService.SetMarkdownEditorMode(value);
        }
    }

    private async Task SetPreviewStyle(MarkdownPreviewStyle value)
    {
        EditorService.PreviewStyle = value;
        if (_initialized && ContentType == EditorContentType.Markdown)
        {
            await EditorService.SetMarkdownEditorPreviewStyle(value);
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

    private async Task SetValueAsync(string? value)
    {
        if (_initialized)
        {
            await EditorService.SetValue(value);
        }
    }
}