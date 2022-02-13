using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

public partial class FocusTrap : IDisposable
{
    /// <summary>
    /// The root element of the trap.
    /// </summary>
    protected ElementReference _root;

    private bool _disabled;
    private bool _disposedValue;

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                // TODO: dispose managed state (managed objects)
            }

            _disposedValue = true;
        }
    }

    private Task RestoreFocusAsync()
    {
        return _root.RestoreFocusAsync().AsTask();
    }
}