using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

internal class EditorService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;
    private readonly ThemeService _themeService;

    private bool _disposedValue;
    private DotNetObjectReference<EditorService>? _dotNetRef;
    private EventHandler<string?>? _onInput;
    public bool AutoFocus { get; set; }

    public EditorMode EditMode { get; set; }

    /// <summary>
    /// The id of the editor element.
    /// </summary>
    public string? ElementId { get; set; }

    public string? InitialValue { get; set; }

    public string? Placeholder { get; set; }

    public bool ReadOnly { get; set; }

    public EditorSyntax Syntax { get; set; }

    public bool UpdateOnInput { get; set; }

    /// <summary>
    /// Raised when an input event occurs.
    /// </summary>
    public event EventHandler<string?> OnInput
    {
        add => SubscribeInput(value);
        remove => UnsubscribeInput(value);
    }

    /// <summary>
    /// Initializes a new instance of <see cref="EditorService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    /// <param name="themeService">An instance of <see cref="ThemeService"/>.</param>
    public EditorService(IJSRuntime jsRuntime, ThemeService themeService)
    {
        _moduleTask = new(
            () => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-editor.js")
            .AsTask());
        _themeService = themeService;
        _themeService.OnThemeChange += SetCodeEditorTheme;
    }

    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'DisposeAsync(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    public async ValueTask FocusEditorAsync()
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "focusEditor",
            ElementId).ConfigureAwait(false);
    }

    [JSInvokable]
    public void OnChangeInvoked(string? value) => _onInput?.Invoke(this, value);

    public async ValueTask SetEditorMode(EditorMode value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setEditorMode",
            ElementId,
            value).ConfigureAwait(false);
    }

    public async ValueTask SetReadOnly(bool value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setReadOnly",
            ElementId,
            value).ConfigureAwait(false);
    }

    public async ValueTask SetSyntax(EditorSyntax value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setSyntax",
            ElementId,
            value.ToString()).ConfigureAwait(false);
    }

    public async ValueTask SetValue(string? value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setValue",
            ElementId,
            value).ConfigureAwait(false);
    }

    public async Task UpdateWysiwygEditorSelectedText(string? value)
    {
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "updateWysiwygEditorSelectedText",
            ElementId,
            value).ConfigureAwait(false);
    }

    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _themeService.OnThemeChange -= SetCodeEditorTheme;
                if (_moduleTask.IsValueCreated)
                {
                    var module = await _moduleTask.Value.ConfigureAwait(false);
                    await DisposeEditorAsync();
                    await module.DisposeAsync().ConfigureAwait(false);
                }
                _dotNetRef?.Dispose();
            }

            _disposedValue = true;
        }
    }

    private async ValueTask DisposeEditorAsync()
    {
        if (_dotNetRef is null
            || !_moduleTask.IsValueCreated
            || string.IsNullOrEmpty(ElementId))
        {
            return;
        }
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "disposeEditor",
            ElementId);
    }

    private async void SetCodeEditorTheme(object? sender, ThemePreference value)
    {
        if (_onInput is null)
        {
            return;
        }
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module
            .InvokeVoidAsync("setCodeEditorTheme", value)
            .ConfigureAwait(false);
    }

    private async void SubscribeInput(EventHandler<string?> value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        if (_onInput is null)
        {
            _dotNetRef ??= DotNetObjectReference.Create(this);
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "initializeEditor",
                ElementId,
                _dotNetRef,
                new
                {
                    AutoFocus,
                    InitialValue,
                    Mode = EditMode,
                    Placeholder,
                    ReadOnly,
                    Syntax = Syntax.ToString(),
                    Theme = EditMode == EditorMode.WYSIWYG
                        && (Syntax == EditorSyntax.HTML
                        || Syntax == EditorSyntax.Markdown)
                        ? ThemePreference.Auto
                        : await _themeService.GetPreferredColorScheme(),
                    UpdateOnInput,
                });
        }

        _onInput += value;
    }

    private async void UnsubscribeInput(EventHandler<string?> value)
    {
        _onInput -= value;
        if (_onInput is null)
        {
            await DisposeEditorAsync();
        }
    }
}
