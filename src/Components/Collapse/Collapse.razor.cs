using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collapsible panel.
/// </summary>
public partial class Collapse : PersistentComponentBase
{
    private const string ExpansionQueryParamName = "o";

    private string? _hrefAbsolute;
    private bool _isActiveNav;

    /// <summary>
    /// Any CSS class(es) to be applies to the collapse body (the part that is hidden when
    /// collapsed).
    /// </summary>
    [Parameter] public string? BodyClass { get; set; }

    /// <summary>
    /// <para>
    /// Set to <see langword="true"/> to prevent opening or closing by the user.
    /// </para>
    /// <para>
    /// Note that open state can still be set programmatically.
    /// </para>
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// Any CSS class(es) to be applies to the collapse footer (the part that is not hidden when
    /// collapsed).
    /// </summary>
    [Parameter] public string? FooterClass { get; set; }

    /// <summary>
    /// The footer content of this component.
    /// </summary>
    [Parameter] public RenderFragment? FooterContent { get; set; }

    /// <summary>
    /// Will be <see langword="true"/> during opening, after <see cref="OnOpening"/> is invoked and
    /// before it completes.
    /// </summary>
    public bool IsLoading { get; private set; }

    /// <summary>
    /// Whether the collapsed content is currently displayed.
    /// </summary>
    [Parameter] public bool IsOpen { get; set; }

    /// <summary>
    /// Invoked when <see cref="IsOpen"/> changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsOpenChanged { get; set; }

    /// <summary>
    /// Indicates how this collapse opens based on the current URL.
    /// </summary>
    /// <remarks>
    /// Ignored unless <see cref="NavUrl"/> is set.
    /// </remarks>
    [Parameter] public NavLinkMatch NavLinkMatch { get; set; }

    /// <summary>
    /// If the current route matches this URL, this collapse will be initially open.
    /// </summary>
    [Parameter] public string? NavUrl { get; set; }

    /// <summary>
    /// Invoked before opening. Can be used to load content.
    /// </summary>
    [Parameter] public EventCallback<Collapse> OnOpening { get; set; }

    /// <summary>
    /// Raised when <see cref="IsOpen"/> changes.
    /// </summary>
    public event EventHandler<bool>? OnIsOpenChanged;

    /// <summary>
    /// <para>
    /// A simple header for the component.
    /// </para>
    /// <para>
    /// Ignored if <see cref="TitleContent"/> is non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public string? Title { get; set; }

    /// <summary>
    /// Complex header content.
    /// </summary>
    [Parameter] public RenderFragment? TitleContent { get; set; }

    /// <summary>
    /// <para>
    /// Whether the entire title should toggle the collapse.
    /// </para>
    /// <para>
    /// Always <see langword="true"/> when <see cref="TitleContent"/> is <see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool TitleIsToggle { get; set; }

    /// <summary>
    /// The group to which this component belongs, if any.
    /// </summary>
    [CascadingParameter] protected Accordion? Accordion { get; set; }

    /// <summary>
    /// The final value assigned to the body's class attribute.
    /// </summary>
    protected string? BodyCssClass => new CssBuilder("body")
        .Add(BodyClass)
        .ToString();

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("collapse")
        .Add("closed", IsClosed || !IsOpen)
        .Add("disabled", Disabled || Accordion?.Disabled == true)
        .Add("loading", IsLoading)
        .ToString();

    /// <summary>
    /// The expansion icon displayed in the header.
    /// </summary>
    protected string IconName => IsLoading ? DefaultIcons.Loading : DefaultIcons.Expand;

    /// <summary>
    /// Whether the collapse has been explicitly closed.
    /// </summary>
    protected bool IsClosed { get; set; }

    /// <summary>
    /// The final value assigned to the footer's class attribute.
    /// </summary>
    protected string? FooterCssClass => new CssBuilder("footer")
        .Add(FooterClass)
        .ToString();

    internal bool ActiveLink { get; set; }

    internal bool IsExpanded => IsOpen && !IsClosed;

    private bool DefaultIsExpanded { get; set; }

    private bool IsInteractive { get; set; }

    [Inject, NotNull] private NavigationManager? NavigationManager { get; set; }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (QueryStateService.IsInitialized
            && parameters.TryGetValue<bool>(nameof(IsOpen), out var isOpen)
            && isOpen != IsOpen)
        {
            await SetOpenAsync(isOpen);
        }

        await base.SetParametersAsync(parameters);
    }

    /// <inheritdoc/>
    protected override async Task OnInitializedAsync()
    {
        NavigationManager.LocationChanged += OnLocationChanged;
        if (Accordion is not null)
        {
            await Accordion.AddAsync(this);
        }

        DefaultIsExpanded = IsExpanded;

        var currentOpenStates = QueryStateService.RegisterProperty(
            Id,
            ExpansionQueryParamName,
            OnQueryChangedAsync,
            DefaultIsExpanded);
        if (currentOpenStates?.Count > 0
            && bool.TryParse(currentOpenStates[0], out var isOpen))
        {
            await SetOpenAsync(isOpen);
        }
        else
        {
            _hrefAbsolute = NavUrl is null
                ? null
                : NavigationManager.ToAbsoluteUri(NavUrl).AbsoluteUri;
            _isActiveNav = ShouldMatch(NavigationManager.Uri);
            if (_isActiveNav)
            {
                await SetOpenAsync(true);
            }
        }
    }

    /// <inheritdoc />
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            IsInteractive = true;
            StateHasChanged();
        }
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue && disposing)
        {
            NavigationManager.LocationChanged -= OnLocationChanged;
            Accordion?.Remove(this);
        }
        base.Dispose(disposing);
    }

    /// <summary>
    /// Set the open state of this collapse.
    /// </summary>
    /// <param name="value">The open state.</param>
    public Task SetOpenAsync(bool value) => SetOpenAsync(value, false);

    /// <summary>
    /// Toggle the open state of this collapse.
    /// </summary>
    public Task ToggleAsync() => SetOpenAsync(IsClosed || !IsOpen, true);

    internal void ForceRedraw() => StateHasChanged();

    private protected async Task OnToggleAsync()
    {
        if (!Disabled && Accordion?.Disabled != true)
        {
            await SetOpenAsync(IsClosed || !IsOpen, true);
        }
    }

    private string GetToggleUrl() => QueryStateService
        .GetUriWithPropertyValue(
        Id,
        ExpansionQueryParamName,
        IsClosed || !IsOpen ? true : null);

    private static bool IsStrictlyPrefixWithSeparator(string value, string prefix)
    {
        var prefixLength = prefix.Length;
        if (value.Length > prefixLength)
        {
            return value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                && (prefixLength == 0
                || !IsUnreservedCharacter(prefix[prefixLength - 1])
                || !IsUnreservedCharacter(value[prefixLength]));
        }
        else
        {
            return false;
        }
    }

    private static bool IsUnreservedCharacter(char c)
        // Checks whether it is an unreserved character according to 
        // https://datatracker.ietf.org/doc/html/rfc3986#section-2.3
        // Those are characters that are allowed in a URI but do not have a reserved
        // purpose (e.g. they do not separate the components of the URI)
        => char.IsLetterOrDigit(c)
        || c == '-'
        || c == '.'
        || c == '_'
        || c == '~';

    private bool EqualsHrefExactlyOrIfTrailingSlashAdded(string currentUriAbsolute)
    {
        Debug.Assert(_hrefAbsolute is not null);

        if (string.Equals(currentUriAbsolute, _hrefAbsolute, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (currentUriAbsolute.Length == _hrefAbsolute.Length - 1
            && _hrefAbsolute[^1] == '/'
            && _hrefAbsolute.StartsWith(currentUriAbsolute, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private async void OnLocationChanged(object? sender, LocationChangedEventArgs args)
    {
        if (!IsOpen)
        {
            var shouldBeActiveNow = ShouldMatch(args.Location);
            if (shouldBeActiveNow != _isActiveNav)
            {
                _isActiveNav = shouldBeActiveNow;
                if (_isActiveNav)
                {
                    await SetOpenAsync(true);
                }
            }
        }
    }

    private async Task OnQueryChangedAsync(QueryChangeEventArgs args)
    {
        if (bool.TryParse(args.Value, out var value))
        {
            await SetOpenAsync(value);
        }
    }

    private async Task SetOpenAsync(bool value, bool manual)
    {
        if (IsOpen == value
            && (!manual
            || IsClosed == !value))
        {
            return;
        }

        if (manual)
        {
            IsClosed = !value;
        }
        if (IsOpen != value)
        {
            if (value && !IsClosed && OnOpening.HasDelegate)
            {
                IsLoading = true;
                StateHasChanged();
                await OnOpening.InvokeAsync(this);
                IsLoading = false;
            }
            IsOpen = value;
            if (!value || !IsClosed)
            {
                OnIsOpenChanged?.Invoke(this, IsOpen);
                await IsOpenChanged.InvokeAsync(IsOpen);
            }
            StateHasChanged();
        }

        if (PersistState)
        {
            QueryStateService.SetPropertyValue(
                Id,
                ExpansionQueryParamName,
                IsOpen && !IsClosed,
                defaultValue: _isActiveNav || DefaultIsExpanded);
        }
    }

    private bool ShouldMatch(string currentUriAbsolute)
    {
        if (_hrefAbsolute is null)
        {
            return false;
        }

        if (EqualsHrefExactlyOrIfTrailingSlashAdded(currentUriAbsolute))
        {
            return true;
        }

        if (NavLinkMatch == NavLinkMatch.Prefix
            && IsStrictlyPrefixWithSeparator(currentUriAbsolute, _hrefAbsolute))
        {
            return true;
        }

        return false;
    }
}