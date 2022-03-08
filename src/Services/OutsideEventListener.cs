using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Monitors for click events outside a given element.
/// </summary>
internal class OutsideEventListener : IDisposable
{
    private readonly UtilityService _utilityService;

    private bool _disposedValue;
    private DotNetObjectReference<OutsideEventListener>? _dotNetRef;
    private EventHandler? _onOutsideEvent;

    /// <summary>
    /// The element to which the event will be attached.
    /// </summary>
    public string? ElementId { get; set; }

    /// <summary>
    /// Raised when a click operation occurs outside the element with the id <see
    /// cref="ElementId"/>.
    /// </summary>
    public event EventHandler OnOutsideEvent
    {
        add => SubscribeEvent(value);
        remove => UnsubscribeEvent(value);
    }

    public OutsideEventListener(UtilityService utilityService)
        => _utilityService = utilityService;

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    [JSInvokable]
    public void OutsideEventNotice() => _onOutsideEvent?.Invoke(this, EventArgs.Empty);

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _dotNetRef?.Dispose();
            }

            _disposedValue = true;
        }
    }

    private ValueTask CancelOutsideEventListener()
        => _utilityService.CancelOutsideEventListener();

    private ValueTask StartOutsideEventListener()
    {
        if (string.IsNullOrEmpty(ElementId))
        {
            return ValueTask.CompletedTask;
        }
        _dotNetRef ??= DotNetObjectReference.Create(this);
        return _utilityService.StartOutsideEventListener(_dotNetRef, ElementId);
    }

    private async void SubscribeEvent(EventHandler value)
    {
        if (string.IsNullOrEmpty(ElementId)
            || _onOutsideEvent?.GetInvocationList().Contains(value) == true)
        {
            return;
        }
        if (_onOutsideEvent is null)
        {
            await StartOutsideEventListener();
        }
        _onOutsideEvent += value;
    }

    private async void UnsubscribeEvent(EventHandler value)
    {
        _onOutsideEvent -= value;
        if (_onOutsideEvent is null)
        {
            await CancelOutsideEventListener().ConfigureAwait(false);
        }
    }
}
