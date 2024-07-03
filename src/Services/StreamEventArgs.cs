using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

/// <summary>
/// Conveys information about an <see cref="IJSStreamReference"/> event.
/// </summary>
public class StreamEventArgs : EventArgs
{
    /// <summary>
    /// The stream reference (possibly <see langword="null"/>).
    /// </summary>
    public IJSStreamReference? Value { get; set; }
}