using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

internal class EditorService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    private bool _disposedValue;
    private DotNetObjectReference<EditorService>? _dotNetRef;
    private EventHandler<string?>? _onInput;

    public bool AutoFocus { get; set; }

    public EditorContentType ContentType { get; set; }

    public EditorMode EditMode { get; set; }

    /// <summary>
    /// The id of the editor element.
    /// </summary>
    public string? ElementId { get; set; }

    public bool LockEditMode { get; set; }

    public List<MarkdownEditorButton>? MarkdownEditorButtons { get; set; }

    public string? Placeholder { get; set; }

    public MarkdownPreviewStyle PreviewStyle { get; set; }

    public bool ReadOnly { get; set; }

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
    /// Initializes a new instance of <see cref="ScrollService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public EditorService(IJSRuntime jsRuntime) => _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-editor.js")
        .AsTask());

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
            ContentType switch
            {
                EditorContentType.HTML => "?",
                EditorContentType.Markdown => "focusMarkdownEditor",
                _ => "focusCodeEditor",
            },
            ElementId).ConfigureAwait(false);
    }

    [JSInvokable]
    public async Task InvokeCustomButton(string id, string? text)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var button = MarkdownEditorButtons?.Find(x => x.Id == id);
        if (button is null
            || (button.Action is null
            && button.AsyncAction is null))
        {
            return;
        }

        string? newText;
        if (button.Action is null)
        {
            newText = await button.AsyncAction!.Invoke(text);
        }
        else if (button.AsyncAction is null)
        {
            newText = button.Action(text);
        }
        else
        {
            newText = await button.AsyncAction(button.Action(text));
        }

        if (!string.Equals(newText, text, StringComparison.Ordinal))
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "updateMarkdownEditorSelectedText",
                ElementId,
                newText).ConfigureAwait(false);
        }
    }

    [JSInvokable]
    public void OnChangeInvoked(string? value) => _onInput?.Invoke(this, value);

    public async ValueTask SetCodeEditorLanguage(string value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setCodeEditorLanguage",
            ElementId,
            value).ConfigureAwait(false);
    }

    public async ValueTask SetCodeEditorTheme(ThemePreference value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setCodeEditorTheme",
            ElementId,
            value).ConfigureAwait(false);
    }

    public async ValueTask SetMarkdownEditorMode(EditorMode value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setMarkdownEditorMode",
            ElementId,
            value).ConfigureAwait(false);
    }

    public async ValueTask SetMarkdownEditorPreviewStyle(MarkdownPreviewStyle value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "setMarkdownPreviewStyle",
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
            ContentType switch
            {
                EditorContentType.HTML => "?",
                EditorContentType.Markdown => "setMarkdownReadOnly",
                _ => "setCodeEditorReadOnly",
            },
            ElementId,
            value).ConfigureAwait(false);
    }

    public async ValueTask SetValue(string? value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            ContentType switch
            {
                EditorContentType.HTML => "?",
                EditorContentType.Markdown => "setMarkdownValue",
                _ => "setCodeEditorValue",
            },
            ElementId,
            value).ConfigureAwait(false);
    }

    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
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
            ContentType switch
            {
                EditorContentType.HTML => "?",
                EditorContentType.Markdown => "disposeMarkdownEditor",
                _ => "disposeCodeEditor",
            },
            ElementId);
    }

    private async ValueTask<bool> InitializeCodeEditor()
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return false;
        }
        _dotNetRef ??= DotNetObjectReference.Create(this);
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "initializeCodeEditor",
            ElementId,
            _dotNetRef,
            new
            {
                AutoFocus,
                Placeholder,
                ReadOnly,
                UpdateOnInput,
            });
        return true;
    }

    private async ValueTask<bool> InitializeMarkdownEditor()
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return false;
        }
        _dotNetRef ??= DotNetObjectReference.Create(this);
        var module = await _moduleTask.Value.ConfigureAwait(false);
        await module.InvokeVoidAsync(
            "initializeMarkdownEditor",
            ElementId,
            _dotNetRef,
            new
            {
                AutoFocus,
                EditMode,
                LockEditMode,
                Placeholder,
                PreviewStyle,
                ReadOnly,
                UpdateOnInput,
            },
            MarkdownEditorButtons?.Select(x => new CustomMarkdownEditorButton()
            {
                Id = x.Id,
                Name = x.Text ?? x.Id,
                Tooltip = x.Tooltip,
            }));
        return true;
    }

    private async void SubscribeInput(EventHandler<string?> value)
    {
        if (_onInput is null)
        {
            switch (ContentType)
            {
                case EditorContentType.HTML:
                    break;
                case EditorContentType.Markdown:
                    if (!await InitializeMarkdownEditor())
                    {
                        return;
                    }
                    break;
                default:
                    if (!await InitializeCodeEditor())
                    {
                        return;
                    }
                    break;
            }
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
