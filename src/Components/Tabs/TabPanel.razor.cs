using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// <para>
/// An individual tab panel within a <see cref="Tabs{TTabItem}"/> component.
/// </para>
/// <para>
/// Not intended for use in any other context.
/// </para>
/// </summary>
public partial class TabPanel<TTabItem> : IAsyncDisposable
{
    private bool _asyncDisposedValue;

    /// <summary>
    /// <para>
    /// Whether this tab is disabled.
    /// </para>
    /// <para>
    /// A disabled tab cannot be activated by the user, and its panel is hidden if it was already
    /// active when this property becomes <see langword="true"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// <para>
    /// Invoked before the tab is activated.
    /// </para>
    /// <para>
    /// The tab switch is not performed until the handler completes, providing the opportunity to
    /// perform any necessary async loading operations.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<TTabItem?> OnActivate { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when the tab is removed from its <see cref="Parent"/>.
    /// </para>
    /// <para>
    /// If a callback is provided, the tab will have a close button.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<TTabItem?> OnClose { get; set; }

    /// <summary>
    /// <para>
    /// The HTML to display in the tab.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TabContent"/> or <see cref="TitleMarkup"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? Title { get; set; }

    /// <summary>
    /// <para>
    /// HTML to display in the tab.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TabContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public MarkupString? TitleMarkup { get; set; }

    /// <summary>
    /// Content to display inside the tab.
    /// </summary>
    [Parameter] public RenderFragment? TabContent { get; set; }

    /// <summary>
    /// The id of the panel element.
    /// </summary>
    public string PanelId => $"panel-{Id}";

    /// <summary>
    /// The parent <see cref="Tabs{TTabItem}"/> component.
    /// </summary>
    [CascadingParameter] protected Tabs<TTabItem>? Parent { get; set; }

    internal int Index { get; set; } = -1;

    internal ElementReference PanelReference { get; set; }

    internal override DragEffect GetDragEffectAllowed() => Parent?.DragEffectAllowed ?? DragEffectAllowed;

    internal override bool GetIsDraggable() => IsDraggable
        && Item is not null
        && Parent?.EnableDragDrop == true;

    internal override bool GetIsDropTarget() => Parent?.EnableDragDrop == true;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// Override this method if you will perform an asynchronous operation and
    /// want the component to refresh when that operation is completed.
    /// </summary>
    /// <returns>A <see cref="Task" /> representing any asynchronous operation.</returns>
    protected override async Task OnInitializedAsync()
    {
        if (Parent is not null)
        {
            Index = await Parent.AddPanelAsync(this);
        }
    }

    /// <summary>
    /// Method invoked after each time the component has been rendered. Note that the component does
    /// not automatically re-render after the completion of any returned <see cref="Task" />,
    /// because that would cause an infinite render loop.
    /// </summary>
    /// <param name="firstRender">
    /// Set to <c>true</c> if this is the first time <see cref="ComponentBase.OnAfterRender(bool)"
    /// /> has been invoked on this component instance; otherwise <c>false</c>.
    /// </param>
    /// <returns>A <see cref="Task" /> representing any asynchronous operation.</returns>
    /// <remarks>
    /// The <see cref="ComponentBase.OnAfterRender(bool)" /> and <see
    /// cref="ComponentBase.OnAfterRenderAsync(bool)" /> lifecycle methods are useful for performing
    /// interop, or interacting with values received from <c>@ref</c>. Use the <paramref
    /// name="firstRender" /> parameter to ensure that initialization work is only performed once.
    /// </remarks>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && Parent is not null)
        {
            await Parent.SetPanelReferenceAsync(PanelReference);
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
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
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous dispose operation.
    /// </returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_asyncDisposedValue)
        {
            if (disposing && Parent is not null)
            {
                await Parent.RemovePanelAsync(this);
                Index = -1;
            }

            _asyncDisposedValue = true;
        }
    }

    private protected override DragEffect GetDropEffectInternal(string[] types)
        => Parent?.GetDropEffectShared(types)
        ?? DragEffect.None;

    private protected override async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!GetIsDropTarget()
            || Parent is null)
        {
            return;
        }

        var item = DragDropService.TryGetData<TTabItem>(e);
        if (item?.Equals(Item) == true)
        {
            return;
        }

        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(new(e));
        }
        else if (item is not null
            && Parent is not null)
        {
            await Parent.InsertItemAsync(
                item,
                0);
        }
    }

    private protected override async void OnDroppedAsync(object? sender, DragEffect e)
    {
        if (!GetIsDraggable())
        {
            return;
        }

        Parent?.DragEnded(Id);

        if (OnDropped.HasDelegate)
        {
            await OnDropped.InvokeAsync(e);
        }
        else if (Parent?.OnDropped.HasDelegate == true)
        {
            await Parent.OnDropped.InvokeAsync(e);
        }
        else if (e == DragEffect.Move
            && Item is not null
            && Parent is not null)
        {
            await Parent.RemovePanelAsync(this);
        }
    }

    private protected override void OnDropValidChanged(object? sender, EventArgs e)
    {
        if (Parent is not null
            && !string.IsNullOrEmpty(Id))
        {
            if (DragDropListener.DropValid == true)
            {
                Parent.AddDropTarget(Id);
            }
            else
            {
                Parent.ClearDropTarget(Id);
            }
        }
        StateHasChanged();
    }
}