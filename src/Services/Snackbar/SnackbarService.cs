using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Supports displaying snackbar messages.
/// </summary>
public class SnackbarService : IDisposable
{
    private readonly ReaderWriterLockSlim _lock = new();
    private readonly NavigationManager _navigationManager;
    private readonly Dictionary<Corner, List<Snackbar>> _snackbars = new();

    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// The total number of displayed snackbars will not exceed this value. Older snackbars are
    /// hidden in favor of newer ones when there are more than the limit allows.
    /// </para>
    /// <para>
    /// One snackbar beyond the maximum will be displayed with a reduced opacity, to provide the
    /// user with a visual cue that additional messages are available, but hidden.
    /// </para>
    /// <para>
    /// Default is 5.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Snackbars beyond the maximum <em>are</em> retained in the internal list. If the total number
    /// falls below the maximum (because the user dismisses some, for example), the hidden snackbars
    /// will reappear.
    /// </remarks>
    public int MaxSnackbars { get; set; } = 5;

    /// <summary>
    /// Raised when the snackbar list changes.
    /// </summary>
    public event Action? OnSnackbarsUpdated;

    /// <summary>
    /// <para>
    /// When <see langword="true"/> new snackbars with the same options (including the message) as a
    /// currently displayed snackbar will not be displayed, but will instead reset the duration of
    /// the existing snackbar.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    public bool PreventDuplicates { get; set; } = true;

    /// <summary>
    /// <para>
    /// When <see langword="true"/> duplicated snackbars will display a counter indicating the
    /// number of duplicate messages that have been received.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// <para>
    /// Ignored if <see cref="PreventDuplicates"/> is <see langword="false"/>.
    /// </para>
    /// </summary>
    public bool ShowDuplicateCounter { get; set; } = true;

    /// <summary>
    /// Initializes a new instance of <see cref="SnackbarService"/>.
    /// </summary>
    /// <param name="navigationManager">
    /// An instance of <see cref="NavigationManager"/>.
    /// </param>
    public SnackbarService(NavigationManager navigationManager)
    {
        _navigationManager = navigationManager;
        _navigationManager.LocationChanged += OnLocationChanged;
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

    /// <summary>
    /// Adds a new snackbar message.
    /// </summary>
    /// <param name="options">Any options.</param>
    /// <returns>
    /// The newly added snackbar. Or, an existing snackbar if <see cref="PreventDuplicates"/> is
    /// <see langword="true"/> and there was a duplicate.
    /// </returns>
    public Snackbar Add(SnackbarOptions options)
    {
        if (string.IsNullOrEmpty(options.Message.Value))
        {
            options.Message = (MarkupString)"!";
        }
        options.Message = (MarkupString)options.Message.Value.Trim();

        Snackbar snackbar;

        _lock.EnterWriteLock();
        try
        {
            if (_snackbars.TryGetValue(options.Position, out var value)
                && PreventDuplicates)
            {
                var duplicate = value.FirstOrDefault(x =>
                    x.Properties.Options.Equals(options));
                if (duplicate is not null)
                {
                    duplicate.Reset();
                    return duplicate;
                }
            }

            snackbar = new Snackbar(options);
            snackbar.OnClose += Remove;
            if (value is not null)
            {
                value.Insert(0, snackbar);
            }
            else
            {
                _snackbars[options.Position] = new List<Snackbar> { snackbar };
            }
        }
        finally
        {
            _lock.ExitWriteLock();
        }

        OnSnackbarsUpdated?.Invoke();

        return snackbar;
    }

    /// <summary>
    /// Adds a new snackbar message.
    /// </summary>
    /// <param name="message">The message to add.</param>
    /// <param name="color">The theme color.</param>
    /// <returns>The newly added snackbar.</returns>
    public Snackbar Add(MarkupString message, ThemeColor color = ThemeColor.None) => Add(new SnackbarOptions
    {
        Message = message,
        ThemeColor = color,
    });

    /// <summary>
    /// Adds a new snackbar message.
    /// </summary>
    /// <param name="message">The message to add.</param>
    /// <param name="color">The theme color.</param>
    /// <returns>The newly added snackbar.</returns>
    public Snackbar Add(string message, ThemeColor color = ThemeColor.None) => Add(new SnackbarOptions
    {
        Message = (MarkupString)message,
        ThemeColor = color,
    });

    /// <summary>
    /// Removes all snackbars.
    /// </summary>
    public void Clear()
    {
        _lock.EnterWriteLock();
        try
        {
            RemoveAllSnackbars();
        }
        finally
        {
            _lock.ExitWriteLock();
        }

        OnSnackbarsUpdated?.Invoke();
    }

    /// <summary>
    /// Removes the given <see cref="Snackbar"/>.
    /// </summary>
    /// <param name="snackbar">A <see cref="Snackbar"/> to remove.</param>
    public void Remove(Snackbar snackbar)
    {
        snackbar.Dispose();
        snackbar.OnClose -= Remove;

        _lock.EnterWriteLock();
        try
        {
            if (_snackbars.TryGetValue(snackbar.Properties.Options.Position, out var value))
            {
                value.Remove(snackbar);
                if (_snackbars[snackbar.Properties.Options.Position].Count == 0)
                {
                    _snackbars.Remove(snackbar.Properties.Options.Position);
                }
            }
        }
        finally
        {
            _lock.ExitWriteLock();
        }

        OnSnackbarsUpdated?.Invoke();
    }

    internal IEnumerable<Snackbar> GetDisplayedSnackbars(Corner corner)
    {
        _lock.EnterReadLock();
        try
        {
            return _snackbars.TryGetValue(corner, out var snackbars)
                ? snackbars.Take(MaxSnackbars)
                : Enumerable.Empty<Snackbar>();
        }
        finally
        {
            _lock.ExitReadLock();
        }
    }

    internal Snackbar? GetExtraSnackbar(Corner corner)
    {
        _lock.EnterReadLock();
        try
        {
            if (!_snackbars.TryGetValue(corner, out var snackbars))
            {
                return null;
            }
            return snackbars.Count > MaxSnackbars
                ? snackbars[MaxSnackbars]
                : null;
        }
        finally
        {
            _lock.ExitReadLock();
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
                _navigationManager.LocationChanged -= OnLocationChanged;
                RemoveAllSnackbars();
            }

            _disposedValue = true;
        }
    }

    private void OnLocationChanged(object? sender, LocationChangedEventArgs e)
    {
        _lock.EnterWriteLock();
        try
        {
            foreach (var key in _snackbars.Keys.ToList())
            {
                var snackbars = _snackbars[key];
                var clearable = snackbars.Where(x =>
                    !x.Properties.Options.RequireInteraction
                    && x.Properties.Options.CloseAfterNavigation)
                    .ToList();
                clearable.ForEach(x =>
                {
                    x.Dispose();
                    x.OnClose -= Remove;
                    snackbars.Remove(x);
                });
            }
        }
        finally
        {
            _lock.ExitWriteLock();
        }
    }

    private void RemoveAllSnackbars()
    {
        if (_snackbars.Count == 0)
        {
            return;
        }
        foreach (var key in _snackbars.Keys.ToList())
        {
            foreach (var snackbar in _snackbars[key])
            {
                snackbar.Dispose();
                snackbar.OnClose -= Remove;
            }
            _snackbars.Remove(key);
        }

        _snackbars.Clear();
    }
}
