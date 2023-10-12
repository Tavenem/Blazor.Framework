namespace Tavenem.Blazor.Framework;

internal class AsyncAdjustableTimer : IDisposable
{
    private readonly Func<Task> _action;
    private readonly List<CancellationTokenSource> _cancelTokenSources = [];
    private readonly object _lock = new();

    private bool _disposedValue;
    private int _waitMilliseconds;

    /// <summary>
    /// Constructs a new instance of <see cref="AdjustableTimer"/>.
    /// </summary>
    /// <param name="action">The action to perform.</param>
    /// <param name="waitMilliseconds">
    /// The number of milliseconds to wait before performing the <paramref name="action"/>.
    /// </param>
    public AsyncAdjustableTimer(Func<Task> action, int waitMilliseconds)
    {
        _action = action;
        _waitMilliseconds = waitMilliseconds;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Cancels the task.
    /// </summary>
    public void Cancel()
    {
        if (_disposedValue)
        {
            return;
        }
        foreach (var tokenSource in _cancelTokenSources)
        {
            if (!tokenSource.IsCancellationRequested)
            {
                try
                {
                    tokenSource.Cancel();
                }
                catch (ObjectDisposedException) { }
            }
        }
    }

    /// <summary>
    /// Changes the delay.
    /// </summary>
    /// <param name="waitMilliseconds">
    /// The number of milliseconds to wait before performing the action.
    /// </param>
    /// <remarks>
    /// Cancels any currently waiting task, then restarts with the new delay.
    /// </remarks>
    public void Change(int waitMilliseconds)
    {
        if (_disposedValue)
        {
            return;
        }
        _waitMilliseconds = waitMilliseconds;
        Start();
    }

    /// <summary>
    /// <para>
    /// Starts the countdown.
    /// </para>
    /// <para>
    /// Also cancels any pending execution.
    /// </para>
    /// </summary>
    public void Start()
    {
        if (_disposedValue)
        {
            return;
        }

        Cancel();
        var tokenSource = new CancellationTokenSource();
        lock (_lock)
        {
            _cancelTokenSources.Add(tokenSource);
        }
        Task.Delay(_waitMilliseconds, tokenSource.Token)
            .ContinueWith(async task =>
            {
                if (tokenSource.IsCancellationRequested)
                {
                    return;
                }

                Cancel();
                foreach (var tokenSource in _cancelTokenSources)
                {
                    tokenSource.Dispose();
                }
                _cancelTokenSources.Clear();

                Task actionTask;
                lock (_lock)
                {
                    actionTask = _action();
                }
                await actionTask;
            },
            tokenSource.Token,
            TaskContinuationOptions.OnlyOnRanToCompletion,
            SynchronizationContext.Current is null
                ? TaskScheduler.Current
                : TaskScheduler.FromCurrentSynchronizationContext());
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
                foreach (var tokenSource in _cancelTokenSources)
                {
                    tokenSource.Dispose();
                }
            }
            _disposedValue = true;
        }
    }
}
