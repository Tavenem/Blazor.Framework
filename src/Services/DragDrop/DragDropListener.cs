using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace Tavenem.Blazor.Framework.Services;

/// <summary>
/// Invoked when a drag operation enters this element, to get the effect which will be
/// performed.
/// </summary>
/// <param name="types">
/// A list of the data types present in the drop.
/// </param>
/// <returns>
/// <para>
/// Return <see cref="DragEffect.None"/> to prevent dropping the item.
/// </para>
/// <para>
/// Return <see cref="DragEffect.All"/> to allow any action selected by the user.
/// </para>
/// <para>
/// Return <see cref="DragEffect.Copy"/>, <see cref="DragEffect.Link"/>, or <see
/// cref="DragEffect.Move"/> to specify the type of action which will be performed.
/// </para>
/// <para>
/// Other values of <see cref="DragEffect"/> are treated as <see cref="DragEffect.All"/>.
/// </para>
/// <para>
/// Note that not all drag operations permit all effects. If the effect returned is not among
/// the allowed effects, the agent will automatically choose a fallback effect.
/// </para>
/// </returns>
internal delegate DragEffect GetDropEffectDelegateInternal(string[] types);

internal class DragDropListener : IDisposable
{
    private readonly DragDropService _dragDropService;

    private bool _disposedValue;
    private DotNetObjectReference<DragDropListener>? _dotNetRef;
    private EventHandler<IEnumerable<KeyValuePair<string, string>>>? _onDrop;
    private EventHandler<DragEffect>? _onDropped;

    /// <summary>
    /// The id of the element which will be used to generate the ghost image during a drag
    /// operation.
    /// </summary>
    public string? DragElementId { get; set; }

    private DragEffect _dropEffect = DragEffect.All;
    /// <summary>
    /// <para>
    /// The drop effect allowed on this drop target.
    /// </para>
    /// <para>
    /// Defaults to <see cref="DragEffect.All"/>.
    /// </para>
    /// <para>
    /// Only <see cref="DragEffect.Copy"/>, <see cref="DragEffect.Link"/>, <see
    /// cref="DragEffect.Move"/>, and <see cref="DragEffect.All"/> are allowed. Setting any other
    /// value has no effect.
    /// </para>
    /// </summary>
    public DragEffect DropEffect
    {
        get => _dropEffect;
        set
        {
            if (value is DragEffect.Copy
                or DragEffect.Link
                or DragEffect.Move
                or DragEffect.All)
            {
                _dropEffect = value;
            }
        }
    }

    /// <summary>
    /// <para>
    /// Indicates whether a current drag operation is valid for this drop target.
    /// </para>
    /// <para>
    /// Will be <see langword="null"/> if no drag operation is currently taking place over this
    /// target.
    /// </para>
    /// </summary>
    public bool? DropValid { get; set; }

    /// <summary>
    /// The id of the element to which the event will be attached.
    /// </summary>
    public string? ElementId { get; set; }

    /// <summary>
    /// Raised when <see cref="DropValid"/> changes.
    /// </summary>
    public event EventHandler? DropValidChanged;

    /// <summary>
    /// <para>
    /// Invoked when a drag operation starts, to get the data to be dragged, and the allowed drop
    /// type.
    /// </para>
    /// <para>
    /// If not set, no dragging occurs.
    /// </para>
    /// </summary>
    public Func<DragStartData>? GetData { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when a drag operation enters this element, to get the effect which will be
    /// performed.
    /// </para>
    /// <para>
    /// The parameter is a list of the data types present in the drop.
    /// </para>
    /// <para>
    /// Return <see cref="DragEffect.None"/> to prevent dropping the item.
    /// </para>
    /// <para>
    /// Return <see cref="DragEffect.All"/> to allow any action selected by the user.
    /// </para>
    /// <para>
    /// Return <see cref="DragEffect.Copy"/>, <see cref="DragEffect.Link"/>, or <see
    /// cref="DragEffect.Move"/> to specify the type of action which will be performed.
    /// </para>
    /// <para>
    /// Other values of <see cref="DragEffect"/> are treated as <see cref="DragEffect.All"/>.
    /// </para>
    /// <para>
    /// If not set, no effect restriction occurs.
    /// </para>
    /// <para>
    /// Note that not all drag operations permit all effects. If the effect returned is not among
    /// the allowed effects, the agent will automatically choose a fallback effect.
    /// </para>
    /// </summary>
    public GetDropEffectDelegateInternal? GetEffect { get; set; }

    /// <summary>
    /// Raised when a drop operation completes with this element as the target drop zone.
    /// </summary>
    public event EventHandler<IEnumerable<KeyValuePair<string, string>>> OnDrop
    {
        add => SubscribeDrop(value);
        remove => UnsubscribeDrop(value);
    }

    /// <summary>
    /// <para>
    /// Raised when a drop operation completes with this element as the dropped item.
    /// </para>
    /// <para>
    /// The argument parameter indicates which drag effect was ultimately selected for the drag-drop
    /// operation.
    /// </para>
    /// </summary>
    public event EventHandler<DragEffect> OnDropped
    {
        add => SubscribeDropped(value);
        remove => UnsubscribeDropped(value);
    }

    public DragDropListener(DragDropService dragDropService)
        => _dragDropService = dragDropService;

    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "The potential breakage is accepted; it is up to implementers to enure that types participating in drag-drop are preserved.")]
    public DragStartData? GetDragData()
    {
        if (GetData is null)
        {
            return null;
        }

        var data = GetData.Invoke();
        if (data.Data is null)
        {
            return null;
        }

        var newData = new List<KeyValuePair<string, object>>();
        foreach (var (type, item) in data.Data)
        {
            if (item is string str)
            {
                newData.Add(new(type, str));
            }
            else if (item is IDraggable draggable)
            {
                var json = draggable.ToDraggedJson();
                if (string.IsNullOrEmpty(json))
                {
                    var draggedStr = draggable.ToDraggedString()
                        ?? item.ToString();
                    if (!string.IsNullOrEmpty(draggedStr))
                    {
                        newData.Add(new(type, draggedStr));
                    }
                }
                else
                {
                    newData.Add(new(type, json));
                }
            }
            else
            {
                string? json = null;
                try
                {
                    json = JsonSerializer.Serialize(item);
                }
                catch { }
                if (string.IsNullOrEmpty(json))
                {
                    var draggedStr = item.ToString();
                    if (!string.IsNullOrEmpty(draggedStr))
                    {
                        newData.Add(new(type, draggedStr));
                    }
                }
                else
                {
                    newData.Add(new(type, json));
                }
            }
        }

        return new()
        {
            Data = newData,
            EffectAllowed = data.EffectAllowed,
        };
    }

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    public string? GetDropEffect(string[] types)
    {
        if (GetEffect is null)
        {
            return null;
        }

        var effect = GetEffect.Invoke(types);
        return effect switch
        {
            DragEffect.None
                or DragEffect.Copy
                or DragEffect.Link
                or DragEffect.Move => effect.ToJsString(),
            _ => null,
        };
    }

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    public void DropHandled(IEnumerable<KeyValuePair<string, string>> e)
    {
        DropValid = null;
        DropValidChanged?.Invoke(this, EventArgs.Empty);
        _onDrop?.Invoke(this, e);
    }

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    public void DroppedHandled(DragEffect e) => _onDropped?.Invoke(this, e);

    /// <summary>
    /// Invoked by javascript interop.
    /// </summary>
    [JSInvokable]
    public void SetDropValid(bool? value)
    {
        DropValid = value;
        DropValidChanged?.Invoke(this, EventArgs.Empty);
    }

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

    private ValueTask CancelDragListener()
        => _dragDropService.CancelDragListener(ElementId);

    private ValueTask CancelDropListener()
        => _dragDropService.CancelDropListener(ElementId);

    private ValueTask StartDragListener()
    {
        _dotNetRef ??= DotNetObjectReference.Create(this);
        return _dragDropService.StartDragListener(_dotNetRef, ElementId, DragElementId);
    }

    private ValueTask StartDropListener()
    {
        _dotNetRef ??= DotNetObjectReference.Create(this);
        return _dragDropService.StartDropListener(
            _dotNetRef,
            ElementId,
            DropEffect == DragEffect.All
                ? null
                : DropEffect);
    }

    private async void SubscribeDrop(EventHandler<IEnumerable<KeyValuePair<string, string>>> value)
    {
        if (_onDrop is null)
        {
            await StartDropListener();
        }
        _onDrop += value;
    }

    private async void SubscribeDropped(EventHandler<DragEffect> value)
    {
        if (_onDropped is null)
        {
            await StartDragListener();
        }
        _onDropped += value;
    }

    private async void UnsubscribeDrop(EventHandler<IEnumerable<KeyValuePair<string, string>>> value)
    {
        _onDrop -= value;
        if (_onDrop is null)
        {
            await CancelDropListener().ConfigureAwait(false);
        }
    }

    private async void UnsubscribeDropped(EventHandler<DragEffect> value)
    {
        _onDropped -= value;
        if (_onDropped is null)
        {
            await CancelDragListener().ConfigureAwait(false);
        }
    }
}
