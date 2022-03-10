using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Globalization;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A tab control component.
/// </summary>
public partial class Tabs<TTabItem> : IAsyncDisposable
{
    private readonly HashSet<string> _dropTargetElements = new();
    private readonly List<DynamicTabInfo<TTabItem>> _dynamicItems = new();
    private readonly List<TabPanel<TTabItem>> _panels = new();

    private double _allTabsSize;
    private bool _backButtonDisabled;
    private bool _disposedValue;
    private bool _forwardButtonDisabled;
    private bool _isRendered;
    private double _position;
    private double _scrollPosition;
    private double _size;
    private ElementReference _tabsContent;
    private double _toolbarContentSize;

    /// <summary>
    /// The currently active item, if any. Includes bound items from static panels.
    /// </summary>
    public TTabItem? ActiveItem { get; private set; }

    private int _activePanelIndex = 0;
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
    [Parameter]
    public int ActivePanelIndex
    {
        get => _activePanelIndex;
        set => _ = ActivatePanelAsync(value, true);
    }

    /// <summary>
    /// Raised when <see cref="ActivePanelIndex"/> changes.
    /// </summary>
    [Parameter] public EventCallback<int?> ActivePanelIndexChanged { get; set; }

    /// <summary>
    /// The icon to use for the "new tab" button.
    /// </summary>
    [Parameter] public string AddIcon { get; set; } = "add";

    /// <summary>
    /// The icon to use for scrolling back through the tabs.
    /// </summary>
    [Parameter] public string BackIcon { get; set; } = "chevron_left";

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
    [Parameter] public string ForwardIcon { get; set; } = "chevron_right";

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
    [Parameter] public EventCallback<DropEventArgs<TTabItem>> OnDrop { get; set; }

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

    private Side _tabSide = Side.Top;
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
    [Parameter]
    public Side TabSide
    {
        get => _tabSide;
        set => _tabSide = value == Side.None
            ? Side.Top
            : value;
    }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("tabs")
        .Add(Class)
        .Add(ThemeColor.ToCSS())
        .Add(TabSide.ToCSS())
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    [Inject] private protected DragDropListener DragDropListener { get; set; } = default!;

    private protected bool NoDropTargetChildren => _dropTargetElements.Count == 0;

    [Inject] private IResizeObserver ResizeObserver { get; set; } = default!;

    private string ScrollStyle => new CssBuilder()
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

    private string SliderStyle => new CssBuilder()
        .AddStyle(
            TabSide is Side.Top or Side.Bottom ? "width" : "height",
            $"{_size.ToString("F2").Trim('0').TrimEnd('.')}px")
        .AddStyle(
            TabSide is Side.Top or Side.Bottom ? "left" : "top",
            $"{_position.ToString("F2").Trim('0').TrimEnd('.')}px",
            TabSide is Side.Top or Side.Bottom)
        .AddStyle(
            "transition",
            $"{(TabSide is Side.Top or Side.Bottom ? "left" : "top")} .3s cubic-bezier(.64,.09,.08,1)")
        .ToString();

    private string ToolbarCssClass => new CssBuilder("tabs-toolbar")
        .Add(CanDropClass, DragDropListener.DropValid)
        .Add(NoDropClass, DragDropListener.DropValid == false)
        .ToString();

    private string ToolbarId { get; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
        => DragDropListener.DropValidChanged += OnDropValidChanged;

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in
    /// the render tree, and the incoming values have been assigned to properties.
    /// </summary>
    protected override void OnParametersSet() => Rerender();

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in the render
    /// tree, and the incoming values have been assigned to properties.
    /// </summary>
    /// <returns>A <see cref="Task" /> representing any asynchronous operation.</returns>
    protected override async Task OnParametersSetAsync()
    {
        if (ActiveItem is not null
            && Items?.Contains(ActiveItem) != true)
        {
            ActiveItem = default;
            if (_activePanelIndex > 0)
            {
                await ActivatePanelAsync(_activePanelIndex - 1, true);
            }
        }
    }

    /// <summary>
    /// Sets parameters supplied by the component's parent in the render tree.
    /// </summary>
    /// <param name="parameters">The parameters.</param>
    /// <returns>
    /// A <see cref="Task" /> that completes when the component has finished updating and rendering
    /// itself.
    /// </returns>
    /// <remarks>
    /// <para>
    /// Parameters are passed when <see cref="ComponentBase.SetParametersAsync(ParameterView)" /> is
    /// called. It is not required that the caller supply a parameter value for all of the
    /// parameters that are logically understood by the component.
    /// </para>
    /// <para>
    /// The default implementation of <see cref="ComponentBase.SetParametersAsync(ParameterView)" />
    /// will set the value of each property decorated with <see cref="ParameterAttribute" /> or <see
    /// cref="CascadingParameterAttribute" /> that has a corresponding value in the <see
    /// cref="ParameterView" />. Parameters that do not have a corresponding value will be
    /// unchanged.
    /// </para>
    /// </remarks>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (Items is not null
            && parameters.TryGetValue(nameof(Items), out List<TTabItem>? items))
        {
            if (items is null)
            {
                for (var i = 0; i < _dynamicItems.Count; i++)
                {
                    await ResizeObserver.Unobserve(_dynamicItems[i].ElementReference);
                }
                _dynamicItems.Clear();
            }
            else
            {
                for (var i = 0; i < items.Count && i < _dynamicItems.Count; i++)
                {
                    if (_dynamicItems[i].Item is null
                        && items[i] is null)
                    {
                        continue;
                    }
                    if (items[i] is not null
                        && _dynamicItems[i].Item?
                        .Equals(items[i]) == true)
                    {
                        continue;
                    }

                    await ResizeObserver.Unobserve(_dynamicItems[i].ElementReference);
                    _dynamicItems[i] = new() { Item = items[i] };
                }

                for (var i = _dynamicItems.Count; i < items.Count; i++)
                {
                    _dynamicItems.Add(new() { Item = items[i] });
                }

                while (_dynamicItems.Count > items.Count)
                {
                    await ResizeObserver.Unobserve(_dynamicItems[items.Count].ElementReference);
                    _dynamicItems.RemoveAt(items.Count);
                }
            }
        }

        await base.SetParametersAsync(parameters);
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
            DragDropListener.ElementId = ToolbarId;
            DragDropListener.GetEffect = GetDropEffectInternal;
            DragDropListener.OnDrop += OnDropAsync;
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
        for (var i = 0; i < _dynamicItems.Count; i++)
        {
            if (!_dynamicItems[i].Observed
                && _dynamicItems[i].DragDropComponent is not null)
            {
                await ResizeObserver.Observe(_dynamicItems[i].ElementReference);
                _dynamicItems[i].Observed = true;
            }
        }

        if (!firstRender)
        {
            return;
        }

        var references = _panels.Select(x => x.PanelReference).ToList();
        references.Add(_tabsContent);

        if (_panels.Count > 0)
        {
            ActiveItem = _panels[_activePanelIndex].Item;
        }

        await ResizeObserver.Observe(references);
        ResizeObserver.OnResized += OnResized;

        Rerender();
        StateHasChanged();

        _isRendered = true;
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous dispose operation.</returns>
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

        _panels.Add(panel);
        if (_panels.Count == 1)
        {
            await ActivatePanelAsync(0, true);
        }
        else
        {
            StateHasChanged();
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
        if (index.HasValue)
        {
            (Items ??= new()).Insert(index.Value, item);
            _dynamicItems.Insert(index.Value, new() { Item = item });
        }
        else
        {
            (Items ??= new()).Add(item);
            _dynamicItems.Add(new() { Item = item });
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
        else if (index == _activePanelIndex)
        {
            if (index == _panels.Count - 1
                && index > 0)
            {
                await ActivatePanelAsync(index - 1, true);
            }
        }
        else if (_activePanelIndex > index)
        {
            await ActivatePanelAsync(_activePanelIndex - 1, true);
        }
        _panels.RemoveAt(index);
        await ResizeObserver.Unobserve(panel.PanelReference);
        Rerender();
        StateHasChanged();
    }

    internal async Task SetPanelReferenceAsync(ElementReference reference)
    {
        if (_disposedValue
            || !_isRendered
            || ResizeObserver.IsElementObserved(reference))
        {
            return;
        }

        await ResizeObserver.Observe(reference);
        Rerender();
        StateHasChanged();
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources asynchronously.
    /// </summary>
    /// <returns>A task that represents the asynchronous dispose operation.</returns>
    protected virtual async ValueTask DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                ResizeObserver.OnResized -= OnResized;
                DragDropListener.DropValidChanged -= OnDropValidChanged;
                DragDropListener.OnDrop -= OnDropAsync;
                await ResizeObserver.DisposeAsync();
            }

            _disposedValue = true;
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

        _activePanelIndex = index;
        if (_isRendered)
        {
            if (PanelCount == 0)
            {
                ActiveItem = default;
            }
            else if (_panels.Count > _activePanelIndex)
            {
                ActiveItem = _panels[_activePanelIndex].Item;
            }
            else if (Items is null)
            {
                ActiveItem = default;
            }
            else
            {
                ActiveItem = Items[_activePanelIndex - _panels.Count];
            }
        }

        CenterScrollPositionAroundSelectedItem();
        SetSliderState();
        SetScrollabilityStates();
        StateHasChanged();
    }

    private void CenterScrollPositionAroundSelectedItem()
    {
        var panelToStart = ActivePanelIndex;
        var length = GetPanelLength(panelToStart);
        if (length >= _toolbarContentSize)
        {
            ScrollToPanel(panelToStart);
            return;
        }

        var indexCorrection = 1;
        while (true)
        {
            var panelAfterIndex = _activePanelIndex + indexCorrection;
            if (panelAfterIndex < _panels.Count)
            {
                length += GetPanelLength(panelAfterIndex);
            }

            if (length >= _toolbarContentSize)
            {
                ScrollToPanel(panelToStart);
                break;
            }

            length = _toolbarContentSize - length;

            var panelBeforeIndex = _activePanelIndex - indexCorrection;
            if (panelBeforeIndex >= 0)
            {
                length -= GetPanelLength(panelBeforeIndex);
            }
            else
            {
                break;
            }

            if (length < 0)
            {
                ScrollToPanel(panelToStart);
                break;
            }

            length = _toolbarContentSize - length;
            panelToStart = _activePanelIndex + indexCorrection;
            indexCorrection++;
        }

        ScrollToPanel(panelToStart);
        SetScrollabilityStates();
    }

    private DragEffect GetDropEffectInternal(string[] types)
        => GetDropEffectShared(types);

    private double GetLengthOfPanelItems(int index)
    {
        var total = 0.0;
        var i = 0;
        for (; i < index && i < _panels.Count; i++)
        {
            total += GetReferenceSize(_panels[i].PanelReference);
        }
        for (; i < index && i - _panels.Count < _dynamicItems.Count; i++)
        {
            total += GetReferenceSize(_dynamicItems[i - _panels.Count].ElementReference);
        }
        return total;
    }

    private double GetPanelLength(int index)
    {
        if (index < 0)
        {
            return 0;
        }
        if (index < _panels.Count)
        {
            return GetReferenceSize(_panels[index].PanelReference);
        }
        else if (index - _panels.Count < _dynamicItems.Count)
        {
            return GetReferenceSize(_dynamicItems[index - _panels.Count].ElementReference);
        }
        else
        {
            return 0.0;
        }
    }

    private double GetReferenceSize(ElementReference reference) => TabSide switch
    {
        Side.Top or Side.Bottom => ResizeObserver.GetSizeInfo(reference)?.Width ?? 0,
        _ => ResizeObserver.GetSizeInfo(reference)?.Height ?? 0,
    };

    private string GetTabClass(int index) => new CssBuilder("tab")
        .Add("active", index == ActivePanelIndex)
        .Add("disabled", index < _panels.Count && _panels[index].Disabled)
        .Add("no-drag", EnableDragDrop && !_panels[index].IsDraggable)
        .ToString();

    private async Task OnAddTabAsync()
    {
        if (OnAdd is null)
        {
            return;
        }

        var item = OnAdd.Invoke();
        (Items ??= new()).Add(item);
        _dynamicItems.Add(new() { Item = item });
        await ItemsChanged.InvokeAsync(Items);
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

        if (index == _activePanelIndex)
        {
            if (index == _panels.Count - 1
                && index > 0)
            {
                await ActivatePanelAsync(index - 1, true);
            }
        }
        else if (_activePanelIndex > index)
        {
            await ActivatePanelAsync(_activePanelIndex - 1, true);
        }

        if (index >= _panels.Count)
        {
            await ResizeObserver.Unobserve(_dynamicItems[index - _panels.Count].ElementReference);
            _dynamicItems.RemoveAt(index - _panels.Count);
            Items?.RemoveAt(index - _panels.Count);
            await ItemsChanged.InvokeAsync(Items);
            Rerender();
            StateHasChanged();
        }
    }

    private async void OnDropAsync(object? sender, IEnumerable<KeyValuePair<string, string>> e)
    {
        if (!EnableDragDrop)
        {
            return;
        }

        var item = DragDropService.TryGetData<TTabItem>(e);
        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(new()
            {
                Data = e,
                Item = item,
            });
        }
        else if (item is not null)
        {
            (Items ??= new()).Add(item);
            await ItemsChanged.InvokeAsync(Items);
            await ActivatePanelAsync(Items.Count - 1 + _panels.Count, true);
        }
    }

    private async Task OnDropOnItemAsync(int index, DropEventArgs<TTabItem> e)
    {
        if (!EnableDragDrop
            || index < 0
            || Items is null
            || index >= Items.Count
            || e.Data is null)
        {
            return;
        }

        if (e.Item?.Equals(Items[index]) == true)
        {
            return;
        }

        if (OnDrop.HasDelegate)
        {
            await OnDrop.InvokeAsync(e);
        }
        else if (e.Item is not null)
        {
            await InsertItemAsync(
                e.Item,
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
                if (_activePanelIndex == 0)
                {
                    if (PanelCount > 0)
                    {
                        var index = PanelCount - 1;
                        while (index > _activePanelIndex
                            && index < _panels.Count
                            && _panels[index].Disabled)
                        {
                            index--;
                        }
                        if (index != _activePanelIndex)
                        {
                            await ActivatePanelAsync(index, true);
                        }
                    }
                }
                else
                {
                    var index = _activePanelIndex - 1;
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
                if (_activePanelIndex == PanelCount - 1)
                {
                    var index = 0;
                    while (index < _activePanelIndex
                        && index < _panels.Count
                        && _panels[index].Disabled)
                    {
                        index++;
                    }
                    if (index < _activePanelIndex)
                    {
                        await ActivatePanelAsync(index, true);
                    }
                }
                else if (PanelCount > 0)
                {
                    var index = _activePanelIndex + 1;
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
                    await OnCloseTabAsync(_activePanelIndex);
                }
                break;
        }
    }

    private async void OnResized(IDictionary<ElementReference, BoundingClientRect> changes)
    {
        Rerender();
        await InvokeAsync(StateHasChanged);
    }

    private void Rerender()
    {
        _toolbarContentSize = GetReferenceSize(_tabsContent);

        var total = 0.0;
        foreach (var panel in _panels)
        {
            total += GetReferenceSize(panel.PanelReference);
        }
        _allTabsSize = total;

        CenterScrollPositionAroundSelectedItem();
        SetSliderState();
        SetScrollabilityStates();
    }

    private void ScrollBack()
    {
        _scrollPosition = Math.Max(0, _scrollPosition - _toolbarContentSize);
        SetScrollabilityStates();
    }

    private void ScrollForward()
    {
        _scrollPosition = Math.Min(_allTabsSize - _toolbarContentSize - 96, _scrollPosition + _toolbarContentSize);
        SetScrollabilityStates();
    }

    private void ScrollToPanel(int index)
        => _scrollPosition = GetLengthOfPanelItems(index);

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

    private void SetSliderState()
    {
        _position = GetLengthOfPanelItems(ActivePanelIndex);
        _size = GetPanelLength(ActivePanelIndex);
    }
}
