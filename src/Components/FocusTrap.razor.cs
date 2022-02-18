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

    private bool _disabled;
    private bool _disposedValue;
    private bool _initialized;
    private bool _shiftDown;
    private bool _shouldRender = true;

    /// <summary>
    /// Child content of the component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

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
    public bool Disabled
    {
        get => _disabled;
        set
        {
            if (_disabled != value)
            {
                _disabled = value;
                _initialized = false;
            }
        }
    }

    private string TrapTabIndex => Disabled ? "-1" : "0";

    /// <summary>
    /// Method invoked after each time the component has been rendered. Note
    /// that the component does not automatically re-render after the completion
    /// of any returned <see cref="Task" />, because that would cause an
    /// infinite render loop.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <returns>A <see cref="Task" /> representing any asynchronous
    /// operation.</returns>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
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

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
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
            if (disposing && !_disabled)
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
        if (!_disabled)
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

    private Task OnRootFocusAsync() => FocusFallbackAsync().AsTask();

    private void OnRootKeyEvent(KeyboardEventArgs args) => HandleKeyEvent(args);

    private Task OnTopFocusAsync() => FocusFirstAsync().AsTask();

    private ValueTask RestoreFocusAsync() => _root.RestoreFocusAsync();

    private ValueTask SaveFocusAsync() => _root.SaveFocusAsync();
}