using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A rich text editor which supports any content type.
/// </summary>
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ValueChangeEventArgs))]
public partial class Editor() : FormComponentBase<string>, IAsyncDisposable
{
    private IJSObjectReference? _module;

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

    [Inject, NotNull] private IJSRuntime? JSRuntime { get; set; }

    private string? SpellcheckValue
    {
        get
        {
            if (Spellcheck.HasValue)
            {
                return Spellcheck.Value ? "true" : "false";
            }
            return EditorMode == EditorMode.WYSIWYG
                && Syntax is EditorSyntax.HTML or EditorSyntax.Markdown
                ? "true"
                : "false";
        }
    }

    /// <inheritdoc/>
    public async ValueTask DisposeAsync()
    {
        await DisposeAsyncCore().ConfigureAwait(false);

        Dispose(disposing: false);
        GC.SuppressFinalize(this);
    }

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (_module is IDisposable disposable)
        {
            disposable.Dispose();
            _module = null;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual async ValueTask DisposeAsyncCore()
    {
        if (_module is not null)
        {
            await _module.DisposeAsync().ConfigureAwait(false);
        }

        (this as IDisposable).Dispose();

        _module = null;
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _module = await JSRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-editor.js");
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
    public void Clear() => CurrentValueAsString = null;

    /// <summary>
    /// Focuses the editor.
    /// </summary>
    /// <remarks>
    /// Note: focuses the editable area, rather than the first interactive control in the toolbar.
    /// </remarks>
    public override async Task FocusAsync()
    {
        if (_module is null)
        {
            return;
        }

        try
        {
            await _module.InvokeVoidAsync("focusEditor", Id);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Gets the currently selected text in the editor.
    /// </summary>
    /// <returns>An <see cref="SelectedEditorText"/> record.</returns>
    public async Task<SelectedEditorText> GetSelectedTextAsync()
    {
        if (_module is null)
        {
            return default;
        }
        try
        {
            return await _module.InvokeAsync<SelectedEditorText>("getSelectedText", Id);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
        return default;
    }

    /// <summary>
    /// Overwrites the currently selected text in the editor, or inserts text at the cursor position
    /// (when the selection is empty).
    /// </summary>
    /// <param name="value">The text with which to replace the current selection.</param>
    public async Task SetSelectedTextAsync(string? value)
    {
        if (_module is null)
        {
            return;
        }
        try
        {
            await _module.InvokeVoidAsync("updateSelectedText", Id, value);
            StateHasChanged();
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    private async Task OnCustomButtonAsync(EditorButton button)
    {
        if (_module is null
            || (button.Action is null
            && button.AsyncAction is null))
        {
            return;
        }

        SelectedEditorText value = new();
        try
        {
            value = await _module.InvokeAsync<SelectedEditorText>("getSelectedText", Id);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }

        string? newValue = null;
        if (button.Action is not null)
        {
            newValue = button.Action.Invoke(value);
        }

        if (button.AsyncAction is not null)
        {
            newValue = await button.AsyncAction.Invoke(value);
        }

        try
        {
            await _module.InvokeVoidAsync(
                "updateSelectedText",
                Id,
                newValue);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    private void OnChange(ValueChangeEventArgs e)
    {
        if (!string.Equals(CurrentValueAsString, e.Value, StringComparison.Ordinal))
        {
            CurrentValueAsString = e.Value;
        }
    }

    private void OnInput(ValueChangeEventArgs e)
    {
        if (UpdateOnInput)
        {
            OnChange(e);
        }
    }
}