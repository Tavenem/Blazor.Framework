using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A component which prevents the focus from moving outside itself via keyboard
/// navigation.
/// </summary>
public partial class FocusTrap : IAsyncDisposable
{
    /// <summary>
    /// The element to focus when this element is to receive the focus.
    /// </summary>
    protected ElementReference _fallback;

    /// <summary>
    /// The root element of the trap.
    /// </summary>
    protected ElementReference _root;

    private bool _disposedValue;
    private bool _initialized;
    private bool _shiftDown;
    private bool _shouldRender = true;

    /// <summary>
    /// <para>
    /// The element on which to set focus when the component is created or
    /// enabled.
    /// </para>
    /// <para>
    /// Set to <see cref="DefaultFocus.FirstChild"/> by default.
    /// </para>
    /// <para>
    /// When <see cref="DefaultFocus.Element"/> is used, the focus will be set
    /// to the <see cref="FocusTrap"/> itself. A user will need to switch focus
    /// (e.g. TAB) to focus the first focusable element.
    /// </para>
    /// </summary>
    [Parameter] public DefaultFocus DefaultFocus { get; set; } = DefaultFocus.FirstChild;

    /// <summary>
    /// When <see langword="true"/>, focus will <em>not</em> loop inside the
    /// component.
    /// </summary>
    [Parameter]
    public bool Disabled { get; set; }

    private string TrapTabIndex => Disabled ? "-1" : "0";

    /// <inheritdoc/>
    public override Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<bool>(nameof(Disabled), out var disabled)
            && disabled != Disabled)
        {
            _initialized = false;
        }

        return base.SetParametersAsync(parameters);
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await SaveFocusAsync();
        }
        if (!_initialized)
        {
            await InitializeFocusAsync();
        }
    }

    /// <summary>
    /// Returns a flag to indicate whether the component should render.
    /// </summary>
    /// <returns>
    /// A flag to indicate whether the component should render.
    /// </returns>
    protected override bool ShouldRender()
    {
        if (_shouldRender)
        {
            return true;
        }
        _shouldRender = true;
        return false;
    }

    /// <inheritdoc/>
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
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
            if (disposing && !Disabled)
            {
                try
                {
                    await RestoreFocusAsync();
                }
                catch { }
            }

            _disposedValue = true;
        }
    }

    private ValueTask InitializeFocusAsync()
    {
        _initialized = true;
        if (!Disabled)
        {
            return DefaultFocus switch
            {
                DefaultFocus.Element => FocusFallbackAsync(),
                DefaultFocus.FirstChild => FocusFirstAsync(),
                DefaultFocus.LastChild => FocusLastAsync(),
                _ => ValueTask.CompletedTask,
            };
        }
        return ValueTask.CompletedTask;
    }

    private ValueTask FocusFallbackAsync() => _fallback.FocusAsync();

    private ValueTask FocusFirstAsync() => _root.FocusFirstAsync(2, 4);

    private ValueTask FocusLastAsync() => _root.FocusLastAsync(2, 4);

    private void HandleKeyEvent(KeyboardEventArgs args)
    {
        _shouldRender = false;
        if (args.Key == "Tab")
        {
            _shiftDown = args.ShiftKey;
        }
    }

    private Task OnBottomFocusAsync() => FocusLastAsync().AsTask();

    private Task OnBumperFocusAsync() => _shiftDown
        ? FocusLastAsync().AsTask()
        : FocusFirstAsync().AsTask();

    private void OnRootKeyEvent(KeyboardEventArgs args) => HandleKeyEvent(args);

    private Task OnTopFocusAsync() => FocusFirstAsync().AsTask();

    private ValueTask RestoreFocusAsync() => _root.RestoreFocusAsync();

    private ValueTask SaveFocusAsync() => _root.SaveFocusAsync();
}