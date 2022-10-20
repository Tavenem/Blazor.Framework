using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Components.ImageEditor;

internal class ImageEditorInterop : IDisposable
{
    private bool _disposedValue;

    private DotNetObjectReference<ImageEditorInterop>? _dotNetObjectReference;

    public DotNetObjectReference<ImageEditorInterop> Reference
        => _dotNetObjectReference ??= DotNetObjectReference.Create(this);

    /// <summary>
    /// Notify that any ongoing operation has been cancelled.
    /// </summary>
    public event EventHandler? Cancel;

    /// <summary>
    /// Notify that the canvas redo history has changed.
    /// </summary>
    public event EventHandler<bool>? RedoHistoryChanged;

    /// <summary>
    /// Notify that a text element is being updated.
    /// </summary>
    public event EventHandler<string>? TextEdit;

    /// <summary>
    /// Notify that the canvas undo history has changed.
    /// </summary>
    public event EventHandler<bool>? UndoHistoryChanged;

    /// <inheritdoc />
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// <para>
    /// Notify that any ongoing operation has been cancelled.
    /// </para>
    /// <para>
    /// Invoked internally by javascript.
    /// </para>
    /// </summary>
    [JSInvokable]
    public void NotifyCancel()
        => Cancel?.Invoke(this, EventArgs.Empty);

    /// <summary>
    /// <para>
    /// Notify that a text element is being updated.
    /// </para>
    /// <para>
    /// Invoked internally by javascript.
    /// </para>
    /// </summary>
    [JSInvokable]
    public void NotifyEditText(string text)
        => TextEdit?.Invoke(this, text);

    /// <summary>
    /// <para>
    /// Notify that the canvas redo history has changed.
    /// </para>
    /// <para>
    /// Invoked internally by javascript.
    /// </para>
    /// </summary>
    [JSInvokable]
    public void NotifyRedoHistory(bool hasContent)
        => RedoHistoryChanged?.Invoke(this, hasContent);

    /// <summary>
    /// <para>
    /// Notify that the canvas undo history has changed.
    /// </para>
    /// <para>
    /// Invoked internally by javascript.
    /// </para>
    /// </summary>
    [JSInvokable]
    public void NotifyUndoHistory(bool hasContent)
        => UndoHistoryChanged?.Invoke(this, hasContent);

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
                _dotNetObjectReference?.Dispose();
            }

            _disposedValue = true;
        }
    }
}
