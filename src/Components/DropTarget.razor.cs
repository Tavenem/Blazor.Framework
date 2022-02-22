using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Invoked when a drag operation enters this element, to get the effect which will be performed.
/// </summary>
/// <typeparam name="TDropItem">
/// The type of item accepted by this drop target.
/// </typeparam>
/// <param name="types">
/// A list of the data types present in the drop.
/// </param>
/// <param name="item">
/// <para>
/// The item being dropped, if it is an internal transfer by reference.
/// </para>
/// <para>
/// Will be <see langword="null"/> for string data, including serialized JSON.
/// </para>
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
/// Note that not all drag operations permit all effects. If the effect returned is not among the
/// allowed effects, the agent will automatically choose a fallback effect.
/// </para>
/// </returns>
public delegate Task<DragEffect> GetDropEffectDelegate<TDropItem>(string[] types, TDropItem? item);

/// <summary>
/// A target for drag-drop operations.
/// </summary>
/// <typeparam name="TDropItem">The type of data dropped onto this target.</typeparam>
public partial class DropTarget<TDropItem> : IDisposable
{
    private protected bool _disposedValue;

    /// <summary>
    /// <para>
    /// This function can return a value which indicates whether a given item may be dropped onto
    /// this target via internal transfer.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/> if not provided.
    /// </para>
    /// <para>
    /// Note that this function is <strong>not</strong> invoked for dragged string data (including
    /// serialized JSON), only for items cached by reference in the <see cref="DragDropService"/>.
    /// For string data, only the type can be used to determine whether a drop should be permitted.
    /// </para>
    /// </summary>
    [Parameter] public virtual Func<TDropItem, bool>? CanDrop { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// <para>
    /// An optional CSS class to be added to this drop target when a valid item is dragged over it.
    /// </para>
    /// <para>
    /// Defaults to "can-drop" but can be overridden with <see langword="null"/> to have none at
    /// all.
    /// </para>
    /// </summary>
    [Parameter] public virtual string? DropClass { get; set; } = "can-drop";

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
    [Parameter]
    public virtual DragEffect DropEffect
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
    public virtual GetDropEffectDelegate<TDropItem>? GetDropEffect { get; set; }

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string? Id { get; set; }

    /// <summary>
    /// <para>
    /// Whether this drop target is accepting drops.
    /// </para>
    /// <para>
    /// Defaults to <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public virtual bool IsDropTarget { get; set; } = true;

    /// <summary>
    /// <para>
    /// An optional CSS class to be added to this drop target when an invalid item is dragged over
    /// it.
    /// </para>
    /// <para>
    /// Defaults to "no-drop" but can be overridden with <see langword="null"/> to have none at all.
    /// </para>
    /// </summary>
    [Parameter] public virtual string? NoDropClass { get; set; } = "no-drop";

    /// <summary>
    /// Invoked when an item is dropped on this target.
    /// </summary>
    [Parameter] public EventCallback<DropEventArgs<TDropItem>> OnDrop { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values.
    /// </summary>
    protected override string CssClass => new CssBuilder("border-transparent")
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    [Inject] private protected DragDropListener DragDropListener { get; set; } = default!;

    [Inject] private protected DragDropService DragDropService { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        if (AdditionalAttributes.TryGetValue("id", out var value)
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
        else if (string.IsNullOrWhiteSpace(Id))
        {
            Id = Guid.NewGuid().ToString();
        }
    }

    /// <summary>
    /// Method invoked after each time the component has been rendered.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see
    /// cref="ComponentBase.OnAfterRender(bool)" /> has been invoked on this
    /// component instance; otherwise <c>false</c>.
    /// </param>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are
    /// useful for performing interop, or interacting with values received from
    /// <c>@ref</c>. Use the <paramref name="firstRender" /> parameter to ensure
    /// that initialization work is only performed once.
    /// </remarks>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            DragDropListener.DropClass = DropClass;
            DragDropListener.ElementId = Id;
            DragDropListener.GetEffect = GetDropEffectAsync;
            DragDropListener.NoDropClass = NoDropClass;
            DragDropListener.OnDrop += OnDropAsync;
        }
    }

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
                DragDropListener.OnDrop -= OnDropAsync;
            }

            _disposedValue = true;
        }
    }

    private protected virtual async void OnDropAsync(object? sender, DropEventArgs e)
    {
        if (!IsDropTarget)
        {
            return;
        }

        var item = DragDropService.TryGetData<TDropItem>(e);
        await OnDrop.InvokeAsync(new()
        {
            Data = e.Data,
            Effect = e.Effect,
            Item = item,
        });
    }

    private Task<DragEffect> GetDropEffectAsync(string[] types)
    {
        if (!IsDropTarget || !OnDrop.HasDelegate)
        {
            return Task.FromResult(DragEffect.None);
        }

        TDropItem? item = default;
        var internalType = types.FirstOrDefault(x => x.StartsWith("tavenem/drop-data-", StringComparison.Ordinal));
        if (internalType is not null)
        {
            var id = internalType[18..];
            if (Guid.TryParse(id, out var guid))
            {
                if (DragDropService.GetInternalTransferData(id) is TDropItem internalItem)
                {
                    if (CanDrop?.Invoke(internalItem) == false)
                    {
                        return Task.FromResult(DragEffect.None);
                    }
                    item = internalItem;
                }
                else
                {
                    return Task.FromResult(DragEffect.None);
                }
            }
        }

        return GetDropEffect?.Invoke(types, item)
            ?? Task.FromResult(DragEffect.All);
    }
}