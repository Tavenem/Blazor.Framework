using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A snackbar message.
/// </summary>
public class Snackbar : IDisposable
{
    private readonly Timer _timer;

    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// The number of identical messages received.
    /// </para>
    /// <para>
    /// Starts at 1, and increments each time a duplicate message is prevented.
    /// </para>
    /// <para>
    /// Resets if the snackbar is dismissed or fades; not a lifetime counter.
    /// </para>
    /// </summary>
    public int DuplicateCounter { get; internal set; } = 1;

    /// <summary>
    /// Raised when the snackbar is about to be removed.
    /// </summary>
    public event Action<Snackbar>? OnClose;

    /// <summary>
    /// Raised when the snackbar's state has changed.
    /// </summary>
    public event Action? OnUpdate;

    internal SnackbarProperties Properties { get; }

    internal Snackbar(SnackbarOptions options)
    {
        Properties = new(options);
        _timer = new(TimerElapsed, null, Timeout.Infinite, Timeout.Infinite);
    }

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

    internal void Initialize() => TransitionTo(SnackbarState.Showing);

    internal void OnClick(bool close = false)
    {
        if (!close)
        {
            if (Properties.Options.OnClick is null)
            {
                return;
            }

            Properties.Options.OnClick.Invoke(this);
        }

        Properties.UserInteracted = true;
        TransitionTo(SnackbarState.Hiding, true);
    }

    internal void Reset()
    {
        DuplicateCounter++;
        if (Properties.State is SnackbarState.Hiding
            or SnackbarState.Visible)
        {
            TransitionTo(SnackbarState.Visible);
        }
    }

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
                StopTimer();
                _timer.Dispose();
            }

            _disposedValue = true;
        }
    }

    private void StartTimer(TimeSpan duration)
    {
        Properties.Stopwatch.Restart();
        _timer.Change(duration, Timeout.InfiniteTimeSpan);
    }

    private void StopTimer()
    {
        Properties.Stopwatch.Stop();
        _timer.Change(Timeout.Infinite, Timeout.Infinite);
    }

    private void TimerElapsed(object? state)
    {
        switch (Properties.State)
        {
            case SnackbarState.Showing:
                TransitionTo(SnackbarState.Visible);
                break;
            case SnackbarState.Hiding:
                OnClose?.Invoke(this);
                break;
            case SnackbarState.Visible:
                TransitionTo(SnackbarState.Hiding);
                break;
        }
    }

    private void TransitionTo(SnackbarState state, bool immediate = false)
    {
        StopTimer();

        Properties.State = state;

        switch (state)
        {
            case SnackbarState.Showing:
                if (immediate)
                {
                    TransitionTo(SnackbarState.Visible);
                }
                else
                {
                    StartTimer(SnackbarProperties.ShowDuration);
                }
                break;
            case SnackbarState.Hiding:
                if (immediate)
                {
                    OnClose?.Invoke(this);
                }
                else
                {
                    StartTimer(SnackbarProperties.HideDuration);
                }
                break;
            case SnackbarState.Visible:
                if (!Properties.Options.RequireInteraction)
                {
                    if (immediate
                        || Properties.Options.VisibleStateDuration <= TimeSpan.Zero)
                    {
                        TransitionTo(SnackbarState.Hiding);
                    }
                    else
                    {
                        StartTimer(Properties.Options.VisibleStateDuration);
                    }
                }
                break;
        }

        OnUpdate?.Invoke();
    }
}
