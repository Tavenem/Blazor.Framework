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
    private bool _disposedValue;

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
    /// The item to which this tab is bound.
    /// </summary>
    [Parameter] public TTabItem? Item { get; set; }

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
    /// Ignored if <see cref="TabContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public MarkupString? Title { get; set; }

    /// <summary>
    /// Content to display inside the tab.
    /// </summary>
    [Parameter] public RenderFragment? TabContent { get; set; }

    /// <summary>
    /// The parent <see cref="Tabs{TTabItem}"/> component.
    /// </summary>
    [CascadingParameter] protected Tabs<TTabItem>? Parent { get; set; }

    internal int Index { get; set; } = -1;

    internal ElementReference PanelReference { get; set; }

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
        if (!_disposedValue)
        {
            if (disposing && Parent is not null)
            {
                await Parent.RemovePanelAsync(this);
                Index = -1;
            }

            _disposedValue = true;
        }
    }
}