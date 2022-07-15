using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Allows getting and setting the preferred color scheme (light vs. dark).
/// </summary>
public class ThemeService : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    private bool _disposedValue;
    private DotNetObjectReference<ThemeService>? _dotNetRef;
    private EventHandler<ThemePreference>? _onThemeChange;

    /// <summary>
    /// Raised when the theme changes, either manually or due to a user preference change.
    /// </summary>
    public event EventHandler<ThemePreference> OnThemeChange
    {
        add => Subscribe(value);
        remove => Unsubscribe(value);
    }

    /// <summary>
    /// Initializes a new instance of <see cref="ThemeService"/>.
    /// </summary>
    /// <param name="jsRuntime">An instance of <see cref="IJSRuntime"/>.</param>
    public ThemeService(IJSRuntime jsRuntime) => _moduleTask = new(
        () => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-theme.js")
        .AsTask());

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'DisposeAsync(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Detect the current preferred color scheme (light vs dark mode).
    /// </summary>
    /// <returns>A <see cref="ThemePreference"/> value.</returns>
    public async ValueTask<ThemePreference> GetPreferredColorScheme()
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            return await module
                .InvokeAsync<ThemePreference>("getPreferredColorScheme")
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        return ThemePreference.Light;
    }

    /// <summary>
    /// Invoked by javascript.
    /// </summary>
    [JSInvokable]
    public void NotifyThemeChanged(ThemePreference theme)
        => _onThemeChange?.Invoke(this, theme);

    /// <summary>
    /// Sets the current preferred color scheme (light vs dark mode).
    /// </summary>
    /// <param name="theme">A <see cref="ThemePreference"/> value.</param>
    public async ValueTask SetColorScheme(ThemePreference theme)
    {
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module
                .InvokeVoidAsync("setColorScheme", theme, true)
                .ConfigureAwait(false);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                await CancelListener();
                if (_moduleTask.IsValueCreated)
                {
                    try
                    {
                        var module = await _moduleTask.Value.ConfigureAwait(false);
                        await module.DisposeAsync().ConfigureAwait(false);
                    }
                    catch { }
                }
                _dotNetRef?.Dispose();
            }

            _disposedValue = true;
        }
    }

    private async ValueTask CancelListener()
    {
        if (_moduleTask.IsValueCreated
            && _dotNetRef is not null)
        {
            try
            {
                var module = await _moduleTask.Value.ConfigureAwait(false);
                await module.InvokeVoidAsync("cancelListener", _dotNetRef);
            }
            catch { }
        }
    }

    private async ValueTask Initialize()
    {
        _dotNetRef ??= DotNetObjectReference.Create(this);
        try
        {
            var module = await _moduleTask.Value.ConfigureAwait(false);
            await module.InvokeVoidAsync("listenForThemeChange", _dotNetRef);
        }
        catch (JSException) { }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        catch (ObjectDisposedException) { }
    }

    private async void Subscribe(EventHandler<ThemePreference> value)
    {
        if (_onThemeChange is null)
        {
            await Initialize();
        }
        _onThemeChange += value;
    }

    private async void Unsubscribe(EventHandler<ThemePreference> value)
    {
        _onThemeChange -= value;
        if (_onThemeChange is null)
        {
            await CancelListener();
        }
    }
}
