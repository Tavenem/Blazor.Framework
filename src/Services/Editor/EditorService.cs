using Microsoft.JSInterop;
using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Services.Editor;

namespace Tavenem.Blazor.Framework.Services;

internal class EditorService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    private readonly Dictionary<EditorCommandType, bool> _commandsActive = [];
    private readonly Dictionary<EditorCommandType, bool> _commandsEnabled = [];
    private bool _disposedValue;
    private DotNetObjectReference<EditorService>? _dotNetRef;
    private EventHandler<string?>? _onInput;

    public bool AutoFocus { get; set; }

    public IReadOnlyDictionary<EditorCommandType, bool> CommandsActive { get; }

    public IReadOnlyDictionary<EditorCommandType, bool> CommandsEnabled { get; }

    public string? CurrentNode { get; private set; }

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

    public event EventHandler? CommandsUpdated;

    /// <summary>
    /// Initializes a new instance of <see cref="EditorService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public EditorService(IJSRuntime jsRuntime)
    {
        CommandsActive = new ReadOnlyDictionary<EditorCommandType, bool>(_commandsActive);
        CommandsEnabled = new ReadOnlyDictionary<EditorCommandType, bool>(_commandsEnabled);
        _moduleTask = new(
            () => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-editor.js")
            .AsTask());
    }

    public async ValueTask ActivateCommandAsync(EditorCommandType type, params object?[] parameters)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        if (_commandsEnabled.TryGetValue(type, out var enabled)
            && !enabled)
        {
            return;
        }

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "activateCommand",
                ElementId,
                type,
                parameters).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
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

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "focusEditor",
                ElementId).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    public async ValueTask<string?> GetSelectedText()
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            return await module.InvokeAsync<string?>(
                "getSelectedText",
                ElementId).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
        return null;
    }

    [JSInvokable]
    public void OnChangeInvoked(string? value) => _onInput?.Invoke(this, value);

    public async ValueTask SetEditorMode(EditorMode value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        _commandsActive.Clear();
        _commandsEnabled.Clear();

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "setEditorMode",
                ElementId,
                value).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    public async ValueTask SetReadOnly(bool value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "setReadOnly",
                ElementId,
                value).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    public async ValueTask SetSyntax(EditorSyntax value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        _commandsActive.Clear();
        _commandsEnabled.Clear();

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "setSyntax",
                ElementId,
                value.ToString()).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    public async ValueTask SetValue(string? value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "setValue",
                ElementId,
                value).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    [JSInvokable]
    public void UpdateCommands(EditorCommandUpdate update)
    {
        CurrentNode = update.CurrentNode;

        if (update.Commands is null)
        {
            return;
        }

        foreach (var (type, command) in update.Commands)
        {
            _commandsActive[type] = command.Active;
            _commandsEnabled[type] = command.Enabled;
        }

        CommandsUpdated?.Invoke(this, EventArgs.Empty);
    }

    public async ValueTask UpdateSelectedText(string? value)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "updateSelectedText",
                ElementId,
                value).ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                if (_moduleTask.IsValueCreated)
                {
                    try
                    {
                        var module = await _moduleTask.Value.ConfigureAwait(false);
                        await DisposeEditorAsync();
                        await module.DisposeAsync().ConfigureAwait(false);
                    }
                    catch { }
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
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync(
                "disposeEditor",
                ElementId);
        }
        catch { }
    }

    [DynamicDependency(
        DynamicallyAccessedMemberTypes.PublicConstructors | DynamicallyAccessedMemberTypes.PublicFields | DynamicallyAccessedMemberTypes.PublicProperties,
        typeof(EditorInitializationOptions))]
    private async void SubscribeInput(EventHandler<string?> value)
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return;
        }

        if (_onInput is null)
        {
            _dotNetRef ??= DotNetObjectReference.Create(this);
            try
            {
                var module = await _moduleTask.Value;
                await module.InvokeVoidAsync(
                    "initializeEditor",
                    ElementId,
                    _dotNetRef,
                    new EditorInitializationOptions
                    {
                        AutoFocus = AutoFocus,
                        InitialValue = InitialValue,
                        Mode = EditMode,
                        Placeholder = Placeholder,
                        ReadOnly = ReadOnly,
                        Syntax = Syntax.ToString(),
                        UpdateOnInput = UpdateOnInput,
                    });
            }
            catch (JSException) { }
            catch (JSDisconnectedException) { }
            catch (TaskCanceledException) { }
            catch (ObjectDisposedException) { }
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
