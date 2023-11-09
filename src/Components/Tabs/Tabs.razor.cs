using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A tab control component.
/// </summary>
public partial class Tabs<TTabItem> : PersistentComponentBase, IAsyncDisposable
{
    private const string ActivePanelQueryParamName = "t";

    private readonly HashSet<string> _dropTargetElements = [];
    private readonly List<DynamicTabInfo<TTabItem>> _dynamicItems = [];
    private readonly List<TabPanel<TTabItem>> _panels = [];

    private double _allTabsSize;
    private bool _backButtonDisabled;
    private bool _asyncDisposedValue;
    private bool _forwardButtonDisabled;
    private double _position;
    private CancellationTokenSource? _renderCancellationTokenSource;
    private double _scrollPosition;
    private double _size;
    private ElementReference _tabsContent;
    private double _toolbarContentSize;

    /// <summary>
    /// The currently active item, if any. Includes bound items from static panels.
    /// </summary>
    public TTabItem? ActiveItem { get; private set; }

    /// <summary>
    /// <para>
    /// The index of the currently active panel.
    /// </para>
    /// <para>
    /// Static panels always come before templated panels bound to <see cref="Items"/>.
    /// </para>
    /// <para>
    /// Supports binding.
    /// </para>
    /// <para>
    /// Always zero when there are no panels at all.
    /// </para>
    /// </summary>
    [Parameter] public int ActivePanelIndex { get; set; }

    /// <summary>
    /// Raised when <see cref="ActivePanelIndex"/> changes.
    /// </summary>
    [Parameter] public EventCallback<int?> ActivePanelIndexChanged { get; set; }

    /// <summary>
    /// The icon to use for the "new tab" button.
    /// </summary>
    [Parameter] public string AddIcon { get; set; } = DefaultIcons.Add;

    /// <summary>
    /// The icon to use for scrolling back through the tabs.
    /// </summary>
    [Parameter] public string BackIcon { get; set; } = DefaultIcons.Back;

    /// <summary>
    /// Can be set to <see langword="true"/> to indicate that non-staic tabs (i.e. those generated
    /// from <see cref="Items"/>) should have close buttons, even if <see cref="OnClose"/> has not
    /// been configured.
    /// </summary>
    [Parameter] public bool CanCloseTabs { get; set; }

    /// <summary>
    /// <para>
    /// A CSS class added to the tab list when a valid item is dragged over it.
    /// </para>
    /// <para>
    /// Defaults to "can-drop" but can be overridden with <see langword="null"/> to disable.
    /// </para>
    /// </summary>
    [Parameter] public virtual string? CanDropClass { get; set; } = "can-drop";

    /// <summary>
    /// <para>
    /// Sets the allowed drag effects for drag operations with tabs.
    /// </para>
    /// <para>
    /// Defaults to <see cref="DragEffect.CopyMove"/>.
    /// </para>
    /// </summary>
    [Parameter] public DragEffect DragEffectAllowed { get; set; }

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
    [Parameter] public virtual DragEffect DropEffect { get; set; } = DragEffect.All;

    /// <summary>
    /// <para>
    /// A CSS class applied to the placeholder tab displayed at the position in the list where a
    /// drop will occur.
    /// </para>
    /// <para>
    /// Defaults to "drop-placeholder".
    /// </para>
    /// </summary>
    [Parameter] public string? DropPlaceholderClass { get; set; } = "drop-placeholder";

    /// <summary>
    /// <para>
    /// Whether the tabs are draggable, and items of type <typeparamref name="TTabItem"/> can be
    /// dropped onto the tab control to generate a new tab.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool EnableDragDrop { get; set; }

    /// <summary>
    /// The icon to use for scrolling forward through the tabs.
    /// </summary>
    [Parameter] public string ForwardIcon { get; set; } = DefaultIcons.Forward;

    /// <summary>
    /// <para>
    /// Invoked when a drag operation enters the tab list, to get the effect which will be
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
    public GetDropEffectDelegate<TTabItem>? GetDropEffect { get; set; }

    /// <summary>
    /// Indicates whether this item currently has a valid dragged item over it.
    /// </summary>
    public bool HasValidDrop => DragDropListener.DropValid == true;

    /// <summary>
    /// <para>
    /// Displayed above the tab panel (and below the tabs, when the tabs are on top).
    /// </para>
    /// <para>
    /// The active tab's bound item (if any) is provided as the parameter.
    /// </para>
    /// </summary>
    [Parameter] public RenderFragment<TTabItem?>? HeaderContent { get; set; }

    /// <summary>
    /// <para>
    /// A collection of items for which tabs should be automatically generated.
    /// </para>
    /// <para>
    /// The <see cref="PanelTemplate"/> and either the <see cref="TabTemplate"/> or <see
    /// cref="TabTitle"/> properties should be provided.
    /// </para>
    /// </summary>
    [Parameter] public List<TTabItem?>? Items { get; set; }

    /// <summary>
    /// Raised when the items list changes.
    /// </summary>
    [Parameter] public EventCallback<List<TTabItem?>?> ItemsChanged { get; set; }

    /// <summary>
    /// <para>
    /// A CSS class added to the tab list when an invalid item is dragged over it.
    /// </para>
    /// <para>
    /// Defaults to "no-drop" but can be overridden with <see langword="null"/> to disable.
    /// </para>
    /// </summary>
    [Parameter] public virtual string? NoDropClass { get; set; } = "no-drop";

    /// <summary>
    /// <para>
    /// Invoked before each tab is activated.
    /// </para>
    /// <para>
    /// The tab switch is not performed until the handler completes, providing the opportunity to
    /// perform any necessary async loading operations.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<TTabItem?> OnActivate { get; set; }

    /// <summary>
    /// <para>
    /// Provides a mechanism for adding new tabs.
    /// </para>
    /// <para>
    /// Should return an object of type <typeparamref name="TTabItem"/>.
    /// </para>
    /// <para>
    /// When this is non-<see langword="null"/>, an "add tab" button will appear after the last tab.
    /// </para>
    /// </summary>
    /// <remarks>
    /// A new tab is always generated, even if the result of the function is the <c>default</c>
    /// value for <typeparamref name="TTabItem"/> (such as <see langword="null"/>).
    /// </remarks>
    [Parameter] public Func<TTabItem?>? OnAdd { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when a tab is removed.
    /// </para>
    /// <para>
    /// If a callback is provided, each tab will have a close button.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<TTabItem?> OnClose { get; set; }

    /// <summary>
    /// Invoked when an item is dropped on the tab list.
    /// </summary>
    [Parameter] public EventCallback<DropEventArgs> OnDrop { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when a drop operation completes with a tab as the dropped item (including by
    /// cancellation).
    /// </para>
    /// <para>
    /// The argument parameter indicates which drag effect was ultimately selected for the drag-drop
    /// operation.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<DragEffect> OnDropped { get; set; }

    /// <summary>
    /// The total number of panels, including static panels and templated panels included via <see
    /// cref="Items"/>.
    /// </summary>
    public int PanelCount => _panels.Count + (Items?.Count ?? 0);

    /// <summary>
    /// A template used to generate panels for <see cref="Items"/>.
    /// </summary>
    [Parameter] public RenderFragment<TTabItem?>? PanelTemplate { get; set; }

    /// <summary>
    /// Displayed after the last tab (and after the "add tab" button, if adding is supported).
    /// </summary>
    [Parameter] public RenderFragment? PostTabContent { get; set; }

    /// <summary>
    /// Displayed before the first tab.
    /// </summary>
    [Parameter] public RenderFragment? PreTabContent { get; set; }

    /// <summary>
    /// A template used to generate tabs for <see cref="Items"/>.
    /// </summary>
    [Parameter] public RenderFragment<TTabItem?>? TabTemplate { get; set; }

    /// <summary>
    /// <para>
    /// A function used to generate tab titles for <see cref="Items"/>.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TabTemplate"/> is on-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TTabItem?, MarkupString>? TabTitle { get; set; }

    /// <summary>
    /// <para>
    /// The side of the component on which the tabs appear.
    /// </para>
    /// <para>
    /// Default is <see cref="Side.Top"/>.
    /// </para>
    /// <para>
    /// Setting to <see cref="Side.None"/> results in the default value.
    /// </para>
    /// </summary>
    [Parameter] public Side TabSide { get; set; } = Side.Top;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("tabs")
        .Add(Class)
        .Add(ThemeColor.ToCSS())
        .Add(TabSide.ToCSS())
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    [Inject, NotNull] private protected DragDropListener? DragDropListener { get; set; }

    private protected bool NoDropTargetChildren => _dropTargetElements.Count == 0;

    internal int InitialActivePanelIndex { get; set; } = -1;

    internal bool IsInteractive { get; set; }

    [Inject, NotNull] private IResizeObserver? ResizeObserver { get; set; }

    private string? ScrollStyle => new CssBuilder()
        .AddStyle(
            "transform",
            $"translateX({(-1 * _scrollPosition).ToString(CultureInfo.InvariantCulture)}px)",
            TabSide is Side.Top or Side.Bottom)
        .AddStyle(
            "transform",
            $"translateY({(-1 * _scrollPosition).ToString(CultureInfo.InvariantCulture)}px)",
            TabSide is Side.Left or Side.Right)
        .ToString();

    private bool ShowScrollButtons => _allTabsSize > _toolbarContentSize;

    private string? SliderStyle => new CssBuilder()
        .AddStyle(
            TabSide is Side.Top or Side.Bottom ? "width" : "height",
            _size.ToPixels())
        .AddStyle(
            TabSide is Side.Top or Side.Bottom ? "left" : "top",
            _position.ToPixels())
        .AddStyle(
            "transition",
            $"{(TabSide is Side.Top or Side.Bottom ? "left" : "top")} .3s cubic-bezier(.64,.09,.08,1)")
        .ToString();

    private string? ToolbarCssClass => new CssBuilder("tabs-toolbar")
        .Add(CanDropClass, DragDropListener.DropValid)
        .Add(NoDropClass, DragDropListener.DropValid == false)
        .ToString();

    private string ToolbarId { get; } = Guid.NewGuid().ToHtmlId();

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var oldActivePanelIndex = ActivePanelIndex;

        if (parameters.TryGetValue(nameof(Items), out List<TTabItem?>? items)
            && ((items is null) != (Items is null)
            || (Items is not null && items?.SequenceEqual(Items) != true)))
        {
            _renderCancellationTokenSource?.Cancel();
            if (items is null)
            {
                for (var i = 0; i < _dynamicItems.Count; i++)
                {
                    await ResizeObserver.UnobserveAsync(_dynamicItems[i].ElementReference);
                }
                _dynamicItems.Clear();
            }
            else
            {
                for (var i = _dynamicItems.Count; i < items.Count; i++)
                {
                    _dynamicItems.Add(new());
                }

                while (_dynamicItems.Count > items.Count)
                {
                    await ResizeObserver.UnobserveAsync(_dynamicItems[items.Count].ElementReference);
                    _dynamicItems.RemoveAt(items.Count);
                }
            }
        }

        await base.SetParametersAsync(parameters);

        if (DropEffect is not DragEffect.Copy
            and not DragEffect.Link
            and not DragEffect.Move
            and not DragEffect.All)
        {
            DropEffect = DragEffect.All;
        }

        if (TabSide == Side.None)
        {
            TabSide = Side.Top;
        }

        if (QueryStateService.IsInitialized
            && ActivePanelIndex != oldActivePanelIndex)
        {
            await ActivatePanelAsync(ActivePanelIndex);
        }
    }

    /// <inheritdoc/>
    protected override async Task OnParametersSetAsync()
    {
        if (ActiveItem is not null
            && Items?.Contains(ActiveItem) != true)
        {
            ActiveItem = default;
            if (ActivePanelIndex > 0)
            {
                await ActivatePanelAsync(ActivePanelIndex - 1, true);
            }
        }

        await RerenderAsync();
    }

    /// <inheritdoc/>
    protected override void OnInitialized()
    {
        var activePanels = QueryStateService.RegisterProperty(
            Id,
            ActivePanelQueryParamName,
            OnQueryChangedAsync,
            ActivePanelIndex + 1);
        if (activePanels?.Count > 0
            && int.TryParse(activePanels[0], out var activePanel))
        {
            InitialActivePanelIndex = activePanel - 1;
        }
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            DragDropListener.DropValidChanged += OnDropValidChanged;
            DragDropListener.ElementId = ToolbarId;
            DragDropListener.GetEffect = GetDropEffectInternal;
            DragDropListener.OnDrop += OnDropAsync;
        }
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        for (var i = 0; i < _dynamicItems.Count; i++)
        {
            if (!_dynamicItems[i].Observed
                && _dynamicItems[i].DragDropComponent is not null)
            {
                await ResizeObserver.ObserveAsync(_dynamicItems[i].ElementReference);
                _dynamicItems[i].Observed = true;
            }
        }

        if (!firstRender)
        {
            return;
        }

        var references = _panels.Select(x => x.PanelReference).ToList();
        references.Add(_tabsContent);

        await ResizeObserver.ObserveAsync(references);
        ResizeObserver.OnResized += OnResized;

        IsInteractive = true;
        await RerenderAsync();
    }

    /// <inheritdoc/>
    public async ValueTask DisposeAsync()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// <para>
    /// Activates the panel with the given bound item.
    /// </para>
    /// <para>
    /// Has no effect if no such panel is among this component's child collection.
    /// </para>
    /// <para>
    /// If more than one panel has the same bound item, the first is activated.
    /// </para>
    /// </summary>
    /// <param name="item">The item to activate.</param>
    public async Task ActivatePanelAsync(TTabItem? item)
    {
        var index = -1;
        if (item is null)
        {
            index = _panels.FindIndex(x => x.Item is null);
            if (index == -1)
            {
                index = Items?.FindIndex(x => x is null) ?? -1;
            }
        }
        else
        {
            index = _panels.FindIndex(x => x.Item?.Equals(item) == true);
            if (index == -1)
            {
                index = Items?.IndexOf(item) ?? -1;
            }
        }
        await ActivatePanelAsync(index, true);
    }

    /// <summary>
    /// <para>
    /// Activates the panel with the given index.
    /// </para>
    /// <para>
    /// Has no effect if the index is out of range.
    /// </para>
    /// </summary>
    /// <param name="index">The index of the panel to activate.</param>
    public Task ActivatePanelAsync(int index)
        => ActivatePanelAsync(index, false);

    internal void AddDropTarget(string id)
    {
        _dropTargetElements.Add(id);
        StateHasChanged();
    }

    internal async Task<int> AddPanelAsync(TabPanel<TTabItem> panel)
    {
        if (_disposedValue)
        {
            return -1;
        }

        _renderCancellationTokenSource?.Cancel();
        _panels.Add(panel);
        if (_panels.Count == 1)
        {
            await ActivatePanelAsync(0, true);
        }
        else
        {
            await RerenderAsync();
        }
        return _panels.Count - 1;
    }

    internal void ClearDropTarget(string id)
    {
        _dropTargetElements.Remove(id);
        StateHasChanged();
    }

    internal void DragEnded(string? id)
    {
        if (!string.IsNullOrEmpty(id))
        {
            _dropTargetElements.Remove(id);
        }
        StateHasChanged();
    }

    internal DragEffect GetDropEffectShared(string[] types)
    {
        if (!EnableDragDrop)
        {
            return DragEffect.None;
        }

        var hasTabItem = types.Contains($"application/json-{typeof(TTabItem).Name}");
        if (!hasTabItem
            && types.Any(x => x.StartsWith("application/json-")))
        {
            return DragEffect.None;
        }

        return GetDropEffect?.Invoke(types)
            ?? (OnDrop.HasDelegate
            || hasTabItem
            || typeof(TTabItem) == typeof(string)
            ? DragEffect.All
            : DragEffect.None);
    }

    internal int? IndexOfItem(TTabItem? item) => item is null ? null : Items?.IndexOf(item);

    internal async Task InsertItemAsync(TTabItem item, int? index)
    {
        _renderCancellationTokenSource?.Cancel();
        if (index.HasValue)
        {
            (Items ??= []).Insert(index.Value, item);
            _dynamicItems.Insert(index.Value, new());
        }
        else
        {
            (Items ??= []).Add(item);
            _dynamicItems.Add(new());
        }
        await ItemsChanged.InvokeAsync(Items);
        StateHasChanged();
    }

    internal async Task RemovePanelAsync(TabPanel<TTabItem> panel)
    {
        if (_disposedValue)
        {
            return;
        }

        var index = _panels.IndexOf(panel);
        if (index == -1)
        {
            return;
        }
        else if (index == ActivePanelIndex)
        {
            if (index == _panels.Count - 1
                && index > 0)
            {
                await ActivatePanelAsync(index - 1, true);
            }
        }
        else if (ActivePanelIndex > index)
        {
            await ActivatePanelAsync(ActivePanelIndex - 1, true);
        }
        _renderCancellationTokenSource?.Cancel();
        _panels.RemoveAt(index);
        await ResizeObserver.UnobserveAsync(panel.PanelReference);
        await RerenderAsync();
    }

    internal async Task SetPanelReferenceAsync(ElementReference reference)
    {
        if (_disposedValue
            || !IsInteractive
            || ResizeObserver.IsElementObserved(reference))
        {
            return;
        }

        await ResizeObserver.ObserveAsync(reference);
        await RerenderAsync();
    }

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue && disposing)
        {
            _renderCancellationTokenSource?.Cancel();
            _renderCancellationTokenSource?.Dispose();
            ResizeObserver.OnResized -= OnResized;
            DragDropListener.DropValidChanged -= OnDropValidChanged;
            DragDropListener.OnDrop -= OnDropAsync;
        }
        base.Dispose(disposing);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous dispose operation.</returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_asyncDisposedValue)
        {
            if (disposing)
            {
                await ResizeObserver.DisposeAsync();
            }

            _asyncDisposedValue = true;
        }
    }

    private async Task ActivatePanelAsync(int index, bool ignoreDisabledState = false)
    {
        if (index < 0
            || index >= PanelCount)
        {
            return;
        }

        if (index < _panels.Count)
        {
            var panel = _panels[index];

            if (panel.Disabled && !ignoreDisabledState)
            {
                return;
            }

            await panel.OnActivate.InvokeAsync(panel.Item);
            await OnActivate.InvokeAsync(panel.Item);
        }
        else if (Items is null)
        {
            return;
        }
        else
        {
            await OnActivate.InvokeAsync(Items[index - _panels.Count]);
        }

        ActivePanelIndex = index;
        if (PanelCount == 0)
        {
            ActiveItem = default;
        }
        else if (_panels.Count > ActivePanelIndex)
        {
            ActiveItem = _panels[ActivePanelIndex].Item;
        }
        else if (Items is null)
        {
            ActiveItem = default;
        }
        else
        {
            ActiveItem = Items[ActivePanelIndex - _panels.Count];
        }
        await ActivePanelIndexChanged.InvokeAsync(index);

        await RerenderAsync();

        if (PersistState)
        {
            QueryStateService.SetPropertyValue(
                Id,
                ActivePanelQueryParamName,
                ActivePanelIndex + 1);
        }
    }

    private async Task CenterScrollPositionAroundSelectedItemAsync()
    {
        var panelToStart = ActivePanelIndex;
        var length = await GetPanelLengthAsync(panelToStart);
        if (length >= _toolbarContentSize)
        {
            await ScrollToPanelAsync(panelToStart);
            return;
        }

        var indexCorrection = 1;
        while (true)
        {
            var panelAfterIndex = ActivePanelIndex + indexCorrection;
            if (panelAfterIndex < _panels.Count + _dynamicItems.Count)
            {
                length += await GetPanelLengthAsync(panelAfterIndex);
            }

            if (length >= _toolbarContentSize)
            {
                await ScrollToPanelAsync(panelToStart);
                break;
            }

            length = _toolbarContentSize - length;

            var panelBeforeIndex = ActivePanelIndex - indexCorrection;
            if (panelBeforeIndex >= 0)
            {
                length -= await GetPanelLengthAsync(panelBeforeIndex);
            }
            else
            {
                break;
            }

            if (length < 0)
            {
                await ScrollToPanelAsync(panelToStart);
                break;
            }

            length = _toolbarContentSize - length;
            panelToStart = ActivePanelIndex - indexCorrection;
            indexCorrection++;
        }

        await ScrollToPanelAsync(panelToStart);
    }

    private DragEffect GetDropEffectInternal(string[] types)
        => GetDropEffectShared(types);

    private async Task<double> GetLengthOfPanelItemsAsync(int index)
    {
        var total = 0.0;
        var i = 0;
        for (; i < index && i < _panels.Count; i++)
        {
            total += await GetReferenceSizeAsync(_panels[i].PanelReference);
        }
        for (; i < index && i - _panels.Count < _dynamicItems.Count; i++)
        {
            total += await GetReferenceSizeAsync(_dynamicItems[i - _panels.Count].ElementReference);
        }
        return total;
    }

    private async Task<double> GetPanelLengthAsync(int index)
    {
        if (index < 0)
        {
            return 0;
        }
        if (index < _panels.Count)
        {
            return await GetReferenceSizeAsync(_panels[index].PanelReference);
        }
        else if (index - _panels.Count < _dynamicItems.Count)
        {
            return await GetReferenceSizeAsync(_dynamicItems[index - _panels.Count].ElementReference) + 2;
        }
        else
        {
            return 0.0;
        }
    }

    private string GetPanelUrl(int index) => QueryStateService.GetUriWithPropertyValue(
        Id,
        ActivePanelQueryParamName,
        index + 1);

    private async Task<double> GetReferenceSizeAsync(ElementReference reference, bool forceRefresh = false) => TabSide switch
    {
        Side.Top or Side.Bottom => (await ResizeObserver.GetSizeInfoAsync(reference, forceRefresh))?.Width ?? 0,
        _ => (await ResizeObserver.GetSizeInfoAsync(reference))?.Height ?? 0,
    };

    private string? GetTabClass(int index) => new CssBuilder("tab")
        .Add("active", index == ActivePanelIndex)
        .Add("disabled", index != ActivePanelIndex && index < _panels.Count && _panels[index].Disabled)
        .Add("no-drag", EnableDragDrop && index < _panels.Count && !_panels[index].GetIsDraggable())
        .ToString();

    private async Task OnAddTabAsync()
    {
        if (OnAdd is null)
        {
            return;
        }

        var item = OnAdd.Invoke();
        (Items ??= []).Add(item);
        _dynamicItems.Add(new());
        await ItemsChanged.InvokeAsync(Items);
        await RerenderAsync();
    }

    private async Task OnCloseTabAsync(int index, bool suppressClose = false)
    {
        if (!suppressClose)
        {
            if (index < _panels.Count)
            {
                await _panels[index].OnClose.InvokeAsync(_panels[index].Item);
                await OnClose.InvokeAsync(_panels[index].Item);
            }
            else if (Items is not null
                && index - _panels.Count < Items.Count)
            {
                await OnClose.InvokeAsync(Items[index - _panels.Count]);
            }
        }

        if (index >= _panels.Count)
        {
            _renderCancellationTokenSource?.Cancel();
            await ResizeObserver.UnobserveAsync(_dynamicItems[index - _panels.Count].ElementReference);
            _dynamicItems.RemoveAt(index - _panels.Count);
            Items?.RemoveAt(index - _panels.Count);
            await ItemsChanged.InvokeAsync(Items);
        }

        if (index == ActivePanelIndex)
        {
            await ActivatePanelAsync(index, true);
        }
        else if (ActivePanelIndex > index)
        {
            await ActivatePanelAsync(ActivePanelIndex - 1, true);
        }
        else
        {
            await RerenderAsync();
        }
    }

    private async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!EnableDragDrop)
        {
            return;
        }

        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(new(e));
            return;
        }

        var item = DragDropService.TryGetData<TTabItem>(e);
        if (item is not null)
        {
            (Items ??= []).Add(item);
            await ItemsChanged.InvokeAsync(Items);
            await ActivatePanelAsync(Items.Count - 1 + _panels.Count, true);
        }
    }

    private async Task OnDropOnItemAsync(int index, DropEventArgs e)
    {
        if (!EnableDragDrop
            || index < 0
            || Items is null
            || index >= Items.Count
            || e.Data is null)
        {
            return;
        }

        var item = DragDropService.TryGetData<TTabItem>(e.Data);
        if (item?.Equals(Items[index]) == true)
        {
            return;
        }

        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(e);
        }
        else if (item is not null)
        {
            await InsertItemAsync(
                item,
                index);
        }
    }

    private async Task OnDroppedItemAsync(int index, DragEffect e)
    {
        if (!EnableDragDrop)
        {
            return;
        }

        DragEnded(_dynamicItems[index].Id);

        if (OnDropped.HasDelegate)
        {
            await OnDropped.InvokeAsync(e);
        }
        else if (e == DragEffect.Move)
        {
            await OnCloseTabAsync(index);
        }
    }

    private void OnDropValidChanged(object? sender, EventArgs e) => StateHasChanged();

    private async Task OnKeyDownAsync(KeyboardEventArgs e)
    {
        switch (e.Key)
        {
            case "ArrowLeft":
                if (ActivePanelIndex == 0)
                {
                    if (PanelCount > 0)
                    {
                        var index = PanelCount - 1;
                        while (index > ActivePanelIndex
                            && index < _panels.Count
                            && _panels[index].Disabled)
                        {
                            index--;
                        }
                        if (index != ActivePanelIndex)
                        {
                            await ActivatePanelAsync(index, true);
                        }
                    }
                }
                else
                {
                    var index = ActivePanelIndex - 1;
                    while (index >= 0
                        && index < _panels.Count
                        && _panels[index].Disabled)
                    {
                        index--;
                    }
                    if (index >= 0)
                    {
                        await ActivatePanelAsync(index, true);
                    }
                }
                break;
            case "ArrowRight":
                if (ActivePanelIndex == PanelCount - 1)
                {
                    var index = 0;
                    while (index < ActivePanelIndex
                        && index < _panels.Count
                        && _panels[index].Disabled)
                    {
                        index++;
                    }
                    if (index < ActivePanelIndex)
                    {
                        await ActivatePanelAsync(index, true);
                    }
                }
                else if (PanelCount > 0)
                {
                    var index = ActivePanelIndex + 1;
                    while (index < _panels.Count
                        && _panels[index].Disabled)
                    {
                        index++;
                    }
                    if (index < PanelCount)
                    {
                        await ActivatePanelAsync(index, true);
                    }
                }
                break;
            case "Delete":
                if (PanelCount > 0)
                {
                    await OnCloseTabAsync(ActivePanelIndex);
                }
                break;
        }
    }

    private Task OnQueryChangedAsync(QueryChangeEventArgs args)
    {
        if (int.TryParse(args.Value, out var activePanelIndex)
            && _panels.Count >= activePanelIndex
            && !_panels[activePanelIndex - 1].Disabled)
        {
            ActivePanelIndex = activePanelIndex - 1;
        }
        return Task.CompletedTask;
    }

    private async void OnResized(IDictionary<ElementReference, BoundingClientRect> changes) => await RerenderAsync();

    private async Task RerenderAsync()
    {
        if (!IsInteractive)
        {
            return;
        }

        _renderCancellationTokenSource?.Cancel();
        _renderCancellationTokenSource?.Dispose();
        _renderCancellationTokenSource = new CancellationTokenSource();

        await InvokeAsync(StateHasChanged);
        await Task.Delay(1);

        _toolbarContentSize = await GetReferenceSizeAsync(_tabsContent, true);

        if (_renderCancellationTokenSource.IsCancellationRequested)
        {
            return;
        }

        var total = 0.0;
        for (var i = 0; i < _panels.Count; i++)
        {
            total += await GetReferenceSizeAsync(_panels[i].PanelReference, true);
            if (_renderCancellationTokenSource.IsCancellationRequested)
            {
                return;
            }
        }
        for (var i = 0; i < _dynamicItems.Count; i++)
        {
            total += await GetReferenceSizeAsync(_dynamicItems[i].ElementReference, true);
            if (_renderCancellationTokenSource.IsCancellationRequested)
            {
                return;
            }
        }
        _allTabsSize = total;

        await CenterScrollPositionAroundSelectedItemAsync();
        await SetSliderStateAsync();
        SetScrollabilityStates();
        await InvokeAsync(StateHasChanged);
    }

    private void ScrollBack()
    {
        _scrollPosition = Math.Max(0, _scrollPosition - _toolbarContentSize);
        SetScrollabilityStates();
    }

    private void ScrollForward()
    {
        _scrollPosition = Math.Min(_allTabsSize - _toolbarContentSize, _scrollPosition + _toolbarContentSize);
        SetScrollabilityStates();
    }

    private async Task ScrollToPanelAsync(int index)
    {
        _scrollPosition = await GetLengthOfPanelItemsAsync(index);
        SetScrollabilityStates();
    }

    private void SetScrollabilityStates()
    {
        if (_allTabsSize <= _toolbarContentSize)
        {
            _forwardButtonDisabled = true;
            _backButtonDisabled = true;
        }
        else
        {
            _forwardButtonDisabled = _scrollPosition + _toolbarContentSize >= _allTabsSize;
            _backButtonDisabled = _scrollPosition <= 0;
        }
    }

    private async Task SetSliderStateAsync()
    {
        _position = await GetLengthOfPanelItemsAsync(ActivePanelIndex);
        _size = await GetPanelLengthAsync(ActivePanelIndex);
    }
}
