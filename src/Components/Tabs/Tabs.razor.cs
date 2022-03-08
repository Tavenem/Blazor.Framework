using Microsoft.AspNetCore.Components;
using System.Globalization;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A tab control component.
/// </summary>
public partial class Tabs<TTabItem> : IAsyncDisposable
{
    private readonly List<TabPanel<TTabItem>> _panels = new();

    private double _allTabsSize;
    private bool _backButtonDisabled;
    private bool _disposedValue;
    private bool _forwardButtonDisabled;
    private bool _isRendered;
    private double _position;
    private ElementReference[] _references = Array.Empty<ElementReference>();
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
    /// The icon to use for scrolling back through the tabs.
    /// </summary>
    [Parameter] public string BackIcon { get; set; } = "chevron_left";

    /// <summary>
    /// The icon to use for scrolling forward through the tabs.
    /// </summary>
    [Parameter] public string ForwardIcon { get; set; } = "chevron_right";

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
    [Parameter] public List<TTabItem>? Items { get; set; }

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
    /// The total number of panels, including static panels and templated panels included via <see
    /// cref="Items"/>.
    /// </summary>
    public int PanelCount => _panels.Count + (Items?.Count ?? 0);

    /// <summary>
    /// A template used to generate panels for <see cref="Items"/>.
    /// </summary>
    [Parameter] public RenderFragment<TTabItem>? PanelTemplate { get; set; }

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
    [Parameter] public RenderFragment<TTabItem>? TabTemplate { get; set; }

    /// <summary>
    /// <para>
    /// A function used to generate tab titles for <see cref="Items"/>.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TabTemplate"/> is on-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public Func<TTabItem, MarkupString>? TabTitle { get; set; }

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
            $"{_size.ToString("F2").Trim('0')}px")
        .AddStyle(
            TabSide is Side.Top or Side.Bottom ? "left" : "top",
            $"{_position.ToString("F2").Trim('0')}px",
            TabSide is Side.Top or Side.Bottom)
        .AddStyle(
            "transition",
            $"{(TabSide is Side.Top or Side.Bottom ? "left" : "top")} .3s cubic-bezier(.64,.09,.08,1)")
        .ToString();

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in
    /// the render tree, and the incoming values have been assigned to properties.
    /// </summary>
    protected override void OnParametersSet() => Rerender();

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
        var oldItems = Items?.ToList();

        await base.SetParametersAsync(parameters);

        if ((oldItems is null
            && Items is null)
            || (oldItems is not null
            && Items is not null
            && oldItems.SequenceEqual(Items)))
        {
            return;
        }

        foreach (var reference in _references)
        {
            await ResizeObserver.Unobserve(reference);
        }

        _references = Items is null || Items.Count == 0
            ? Array.Empty<ElementReference>()
            : new ElementReference[Items.Count];
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
        foreach (var reference in _references)
        {
            if (!string.IsNullOrEmpty(reference.Id))
            {
                await ResizeObserver.Observe(reference);
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
        => ActivatePanelAsync(index, true);

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
                await ActivatePanelAsync(index - 1);
            }
        }
        else if (_activePanelIndex > index)
        {
            await ActivatePanelAsync(_activePanelIndex - 1);
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

    private double GetLengthOfPanelItems(int index)
    {
        var total = 0.0;
        var i = 0;
        for (; i < index && i < _panels.Count; i++)
        {
            total += GetReferenceSize(_panels[i].PanelReference);
        }
        for (; i < index && i - _panels.Count < _references.Length; i++)
        {
            total += GetReferenceSize(_references[i - _panels.Count]);
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
        else if (index - _panels.Count < _references.Length)
        {
            return GetReferenceSize(_references[index - _panels.Count]);
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
        .ToString();

    private async void OnCloseTabAsync(int index)
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

        if (index == _activePanelIndex)
        {
            if (index == _panels.Count - 1
                && index > 0)
            {
                await ActivatePanelAsync(index - 1);
            }
        }
        else if (_activePanelIndex > index)
        {
            await ActivatePanelAsync(_activePanelIndex - 1);
        }

        if (index < _panels.Count)
        {
            await ResizeObserver.Unobserve(_panels[index].PanelReference);
            _panels.RemoveAt(index);
        }
        else
        {
            await ResizeObserver.Unobserve(_references[index - _panels.Count]);
            Items?.RemoveAt(index - _panels.Count);
            _references = _references
                .Take(index - _panels.Count)
                .Skip(1)
                .ToArray();
        }

        Rerender();
        StateHasChanged();
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
