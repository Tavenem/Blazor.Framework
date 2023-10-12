using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A collapsible panel.
/// </summary>
public partial class Collapse : IDisposable
{
    private const string ExpansionQueryParamName = "tfc_ex";

    private protected bool _disposedValue;
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
    /// Any collapse expansions currently set.
    /// </summary>
    [SupplyParameterFromQuery(Name = ExpansionQueryParamName), Parameter]
    public string[]? ExpansionQuery { get; set; }

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
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A generated id will be assigned if none is supplied (including through splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

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
        .Add("closed", !IsOpen)
        .Add("disabled", Disabled || Accordion?.Disabled == true)
        .Add("loading", IsLoading)
        .ToString();

    /// <summary>
    /// The expansion icon displayed in the header.
    /// </summary>
    protected string IconName => IsLoading ? DefaultIcons.Loading : DefaultIcons.Expand;

    /// <summary>
    /// The final value assigned to the footer's class attribute.
    /// </summary>
    protected string? FooterCssClass => new CssBuilder("footer")
        .Add(FooterClass)
        .ToString();

    internal bool ActiveLink { get; set; }

    private bool Interactive { get; set; }

    [Inject, NotNull] private NavigationManager? NavigationManager { get; set; }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<bool>(nameof(IsOpen), out var isOpen)
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

        Interactive = true;
        StateHasChanged();
    }

    /// <inheritdoc />
    protected override async Task OnParametersSetAsync()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }

        var key = Accordion is null
            ? Id
            : $"{Accordion.Id}:{Id}";
        if (ExpansionQuery?
            .Any(x => x.Equals(key, StringComparison.Ordinal))
            == true)
        {
            await SetOpenAsync(true);
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

    /// <inheritdoc/>
    public void Dispose()
    {
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
                NavigationManager.LocationChanged -= OnLocationChanged;
                Accordion?.Remove(this);
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Set the open state of this collapse.
    /// </summary>
    /// <param name="value">The open state.</param>
    public async Task SetOpenAsync(bool value)
    {
        if (IsOpen == value)
        {
            return;
        }

        if (value && OnOpening.HasDelegate)
        {
            IsLoading = true;
            StateHasChanged();
            await OnOpening.InvokeAsync(this);
            IsLoading = false;
        }
        IsOpen = value;
        OnIsOpenChanged?.Invoke(this, IsOpen);
        await IsOpenChanged.InvokeAsync(IsOpen);
        StateHasChanged();

        var expansionQueries = ExpansionQuery?.ToList();
        var key = Accordion is null
            ? Id
            : Accordion.Id;
        expansionQueries?.RemoveAll(x => x.StartsWith(key));
        if (IsOpen)
        {
            if (Accordion is not null)
            {
                key = $"{Accordion.Id}:{Id}";
            }
            (expansionQueries ??= [])?.Add(key);
        }

        NavigationManager.NavigateTo(
            NavigationManager.GetUriWithQueryParameters(
                new Dictionary<string, object?> { [ExpansionQueryParamName] = expansionQueries }),
            false,
            true);
    }

    /// <summary>
    /// Toggle the open state of this collapse.
    /// </summary>
    public Task ToggleAsync() => SetOpenAsync(!IsOpen);

    internal void ForceRedraw() => StateHasChanged();

    private protected async Task OnToggleAsync()
    {
        if (!Disabled && Accordion?.Disabled != true)
        {
            await SetOpenAsync(!IsOpen);
        }
    }

    private string GetToggleUrl()
    {
        var value = !IsOpen;

        var expansionQueries = ExpansionQuery?.ToList();
        var key = Accordion is null
            ? Id
            : Accordion.Id;
        expansionQueries?.RemoveAll(x => x.StartsWith(key));
        if (value)
        {
            if (Accordion is not null)
            {
                key = $"{Accordion.Id}:{Id}";
            }
            (expansionQueries ??= [])?.Add(key);
        }

        return NavigationManager.GetUriWithQueryParameters(
            new Dictionary<string, object?> { [ExpansionQueryParamName] = expansionQueries });
    }

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
        if (IsOpen)
        {
            return;
        }
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