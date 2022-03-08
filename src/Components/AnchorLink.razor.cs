using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using System.Diagnostics;
using System.Globalization;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A link element which supports local fragments, and auto-expands containing
/// <see cref="Framework.Collapse"/> components when active.
/// </summary>
public partial class AnchorLink : IDisposable
{
    private const string DefaultActiveClass = "active";

    private static readonly string[] _DisabledKeys = new[] { "href", "target" };

    private string? _currentLocation;
    private bool _disposedValue;
    private string? _hrefAbsolute;

    /// <summary>
    /// Gets or sets the CSS class name applied to the component when the current
    /// route matches the href.
    /// </summary>
    [Parameter] public string? ActiveClass { get; set; }

    /// <summary>
    /// If <see langword="true"/>, the link will be disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// Indicates whether this link is currently active.
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Gets or sets a value representing the URL matching behavior.
    /// </summary>
    [Parameter] public NavLinkMatch Match { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder()
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .Add(Class)
        .Add(ActiveClass ?? DefaultActiveClass, IsActive)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private protected Dictionary<string, object> Attributes
    {
        get
        {
            var attributes = AdditionalAttributes;
            if (!string.IsNullOrEmpty(LocalLink))
            {
                var fragmentIndex = NavigationManager.Uri.IndexOf('#');
                var url = fragmentIndex == -1
                    ? NavigationManager.Uri
                    : NavigationManager.Uri[..fragmentIndex];
                attributes["href"] = $"{url}#{LocalLink}";
            }
            if (Disabled)
            {
                attributes = attributes.Without(_DisabledKeys);
            }
            if (IsActive)
            {
                attributes = attributes.With(new KeyValuePair<string, object>("aria-current", "true"));
            }
            return attributes;
        }
    }

    [CascadingParameter] private Collapse? Collapse { get; set; }

    [Inject] private ScrollService ScrollService { get; set; } = default!;

    private protected string? LocalLink { get; set; }

    [Inject] private NavigationManager NavigationManager { get; set; } = default!;

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized()
    {
        NavigationManager.LocationChanged += OnLocationChanged;
        Collapse?.Add(this);
    }

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in
    /// the render tree, and the incoming values have been assigned to properties.
    /// </summary>
    protected override void OnParametersSet()
    {
        string? href = null;
        if (AdditionalAttributes is not null
            && AdditionalAttributes.TryGetValue("href", out var obj))
        {
            href = Convert.ToString(obj, CultureInfo.InvariantCulture);
        }
        LocalLink = href?.StartsWith('#') == true
            ? href[1..]
            : null;
        _hrefAbsolute = href is null || !string.IsNullOrEmpty(LocalLink)
            ? null
            : NavigationManager.ToAbsoluteUri(href).AbsoluteUri;

        IsActive = string.IsNullOrEmpty(LocalLink)
            && ShouldMatch(NavigationManager.Uri);
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
                Collapse?.Remove(this);
            }

            _disposedValue = true;
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

    internal void UpdateState(LocationChangedEventArgs args)
    {
        if (_currentLocation == args.Location
            || !string.IsNullOrEmpty(LocalLink))
        {
            return;
        }
        _currentLocation = args.Location;
        var shouldBeActiveNow = ShouldMatch(args.Location);
        if (shouldBeActiveNow != IsActive)
        {
            IsActive = shouldBeActiveNow;
            StateHasChanged();
        }
    }

    private static bool IsStrictlyPrefixWithSeparator(string value, string prefix)
    {
        var prefixLength = prefix.Length;
        if (value.Length > prefixLength)
        {
            return value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                && (prefixLength == 0
                || !char.IsLetterOrDigit(prefix[prefixLength - 1])
                || !char.IsLetterOrDigit(value[prefixLength]));
        }
        else
        {
            return false;
        }
    }

    private protected async Task OnClickLocalLinkAsync()
    {
        if (!string.IsNullOrEmpty(LocalLink))
        {
            await ScrollService.ScrollToId(LocalLink);
        }
    }

    private void OnLocationChanged(object? sender, LocationChangedEventArgs args)
        => UpdateState(args);

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

        if (Match == NavLinkMatch.Prefix
            && IsStrictlyPrefixWithSeparator(currentUriAbsolute, _hrefAbsolute))
        {
            return true;
        }

        return false;
    }

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
}
