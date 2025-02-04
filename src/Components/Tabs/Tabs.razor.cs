using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization.Metadata;
using Tavenem.Blazor.Framework.Components.Tabs;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A tab control component.
/// </summary>
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ValueChangeEventArgs))]
public partial class Tabs<TTabItem>() : PersistentComponentBase
{
    private const string ActivePanelQueryParamName = "t";

    private readonly HashSet<string> _dropTargetElements = [];
    private readonly List<DynamicTabInfo<TTabItem>> _dynamicItems = [];
    private readonly List<TabPanel<TTabItem>> _panels = [];

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
    /// <para>
    /// Can be set to <see langword="true"/> to indicate that tabs all should have close buttons.
    /// </para>
    /// <para>
    /// Overrides <see cref="TabPanel{TTabItem}.CanClose"/> if <see langword="true"/>.
    /// </para>
    /// <para>
    /// Always <see langword="true"/> if <see cref="OnClose"/> is not <see langword="null"/>.
    /// </para>
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
    /// The <see cref="JsonTypeInfo{T}"/> for <typeparamref name="TTabItem"/>.
    /// </summary>
    /// <remarks>
    /// If omitted, reflection-based deserialization may be used during drag-drop operations, which
    /// is not trim safe or AOT compatible, and may cause runtime failures.
    /// </remarks>
    [Parameter] public JsonTypeInfo<TTabItem>? JsonTypeInfo { get; set; }

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

    internal bool CanClose => OnClose.HasDelegate ? IsInteractive : CanCloseTabs;

    internal bool IsInteractive { get; set; }

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

    private int InitialActivePanelIndex { get; set; } = -1;

    private protected bool NoDropTargetChildren => _dropTargetElements.Count == 0;

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
            if (items is null)
            {
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
        if (ActiveItem is null
            || Items?.Contains(ActiveItem) == true)
        {
            return;
        }

        ActiveItem = default;
        if (ActivePanelIndex <= 0)
        {
            return;
        }

        var index = ActivePanelIndex;
        bool success;
        do
        {
            index = Math.Min(index - 1, PanelCount - 1);
            success = await ActivatePanelAsync(index);
        } while (!success && index > 0);
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
    protected override async Task OnInitializedAsync()
    {
        if (InitialActivePanelIndex >= _panels.Count
            && InitialActivePanelIndex < _panels.Count + _dynamicItems.Count)
        {
            await ActivatePanelAsync(InitialActivePanelIndex);
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
            IsInteractive = true;
            StateHasChanged();
        }
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
    /// <returns>
    /// <see langword="true"/> if the panel with the given <paramref name="item"/> was activated;
    /// <see langword="false"/> if it was not (e.g. because the tab collection does not contain that
    /// index, or the tab at that index is disabled).
    /// </returns>
    public async Task<bool> ActivatePanelAsync(TTabItem? item)
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
        return index != -1 && await ActivatePanelAsync(index);
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
    /// <returns>
    /// <see langword="true"/> if the panel at the given <paramref name="index"/> was activated;
    /// <see langword="false"/> if it was not (e.g. because the tab collection does not contain that
    /// index, or the tab at that index is disabled).
    /// </returns>
    public async Task<bool> ActivatePanelAsync(int index)
    {
        if (index < 0
            || index >= PanelCount)
        {
            if (ActivePanelIndex != 0 && PanelCount <= 1)
            {
                ActivePanelIndex = 0;
            }
            return false;
        }

        if (index < _panels.Count)
        {
            var panel = _panels[index];

            if (panel.Disabled)
            {
                if (ActivePanelIndex != 0 && PanelCount <= 1)
                {
                    ActivePanelIndex = 0;
                }
                return false;
            }

            await panel.OnActivate.InvokeAsync(panel.Item);
            await OnActivate.InvokeAsync(panel.Item);
        }
        else if (Items is null)
        {
            if (ActivePanelIndex != 0 && PanelCount <= 1)
            {
                ActivePanelIndex = 0;
            }
            return false;
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

        StateHasChanged();

        if (PersistState)
        {
            QueryStateService.SetPropertyValue(
                Id,
                ActivePanelQueryParamName,
                ActivePanelIndex + 1);
        }

        return true;
    }

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
        StateHasChanged();
        if (_panels.Count == 1)
        {
            await ActivatePanelAsync(0);
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

    internal string? GetDynamicPanelUrl(DynamicTabInfo<TTabItem>? info) => PersistState && info is not null
        ? QueryStateService.GetUriWithPropertyValue(
            Id,
            ActivePanelQueryParamName,
            _dynamicItems.IndexOf(info) + _panels.Count + 1)
        : null;

    internal string? GetPanelUrl(int index) => PersistState
        ? QueryStateService.GetUriWithPropertyValue(
            Id,
            ActivePanelQueryParamName,
            index + 1)
        : null;

    internal async Task InsertItemAsync(TTabItem item, int? index)
    {
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

    internal void RemovePanel(TabPanel<TTabItem> panel)
    {
        if (!_disposedValue)
        {
            _panels.Remove(panel);
            StateHasChanged();
        }
    }

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue && disposing)
        {
            DragDropListener.DropValidChanged -= OnDropValidChanged;
            DragDropListener.OnDrop -= OnDropAsync;
        }
        base.Dispose(disposing);
    }

    private DragEffect GetDropEffectInternal(string[] types)
        => GetDropEffectShared(types);

    private string? GetTabClass(int index) => new CssBuilder()
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
        StateHasChanged();
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
            _dynamicItems.RemoveAt(index - _panels.Count);
            Items?.RemoveAt(index - _panels.Count);
            await ItemsChanged.InvokeAsync(Items);
        }

        if (index == ActivePanelIndex)
        {
            var newIndex = index + 1;
            bool success;
            do
            {
                newIndex = Math.Min(newIndex - 1, PanelCount - 1);
                success = await ActivatePanelAsync(newIndex);
            } while (!success && newIndex > 0);
        }
        else if (ActivePanelIndex > index)
        {
            var newIndex = ActivePanelIndex;
            bool success;
            do
            {
                newIndex = Math.Min(newIndex - 1, PanelCount - 1);
                success = await ActivatePanelAsync(newIndex);
            } while (!success && newIndex > 0);
        }
        else
        {
            StateHasChanged();
        }
    }

    private async Task OnDeleteAsync(ValueChangeEventArgs e)
    {
        if (PanelCount <= 0)
        {
            return;
        }

        if (string.IsNullOrEmpty(e.Value))
        {
            await OnCloseTabAsync(ActivePanelIndex);
        }
        else
        {
            var index = _panels.FindIndex(x => string.CompareOrdinal(x.Id, e.Value) == 0);
            if (index == -1)
            {
                index = _dynamicItems.FindIndex(x => string.CompareOrdinal(x.Id, e.Value) == 0);
            }
            if (index != -1)
            {
                await OnCloseTabAsync(index);
            }
        }
    }

    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Only causes dynamic access when JsonTypeInfo is missing, and a warning is provided on that member")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Only causes dynamic access when JsonTypeInfo is missing, and a warning is provided on that member")]
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

        var item = JsonTypeInfo is null
            ? DragDropService.TryGetData<TTabItem>(e)
            : DragDropService.TryGetData(e, JsonTypeInfo);
        if (item is not null)
        {
            (Items ??= []).Add(item);
            await ItemsChanged.InvokeAsync(Items);

            var newIndex = Items.Count + _panels.Count;
            bool success;
            do
            {
                success = await ActivatePanelAsync(--newIndex);
            } while (!success && newIndex > 0);
        }
    }

    [UnconditionalSuppressMessage(
        "Trimming",
        "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code",
        Justification = "Only causes dynamic access when JsonTypeInfo is missing, and a warning is provided on that member")]
    [UnconditionalSuppressMessage(
        "AOT",
        "IL3050:Calling members annotated with 'RequiresDynamicCodeAttribute' may break functionality when AOT compiling.",
        Justification = "Only causes dynamic access when JsonTypeInfo is missing, and a warning is provided on that member")]
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

        var item = JsonTypeInfo is null
            ? DragDropService.TryGetData<TTabItem>(e.Data)
            : DragDropService.TryGetData(e.Data, JsonTypeInfo);
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

    private async Task OnValueChangeAsync(ValueChangeEventArgs args)
    {
        if (!string.IsNullOrEmpty(args.Value)
            && int.TryParse(args.Value, out var index)
            && index < PanelCount)
        {
            await ActivatePanelAsync(index);
        }
    }
}
