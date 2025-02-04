using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.WebUtilities;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays controls to navigate between pages.
/// </summary>
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ValueChangeEventArgs))]
public partial class Pagination() : PersistentComponentBase
{
    private const string CurrentPageQueryParamName = "p";
    private const string PageCountQueryParamName = "c";

    /// <summary>
    /// <para>
    /// The 1-based index of the current page.
    /// </para>
    /// <para>
    /// Cannot be set to a value greater than <see cref="PageCount"/> if <see cref="PageCount"/> is
    /// non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public ulong CurrentPage { get; set; } = 1;

    /// <summary>
    /// Invoked when <see cref="CurrentPage"/> has changed.
    /// </summary>
    [Parameter] public EventCallback<ulong> CurrentPageChanged { get; set; }

    /// <summary>
    /// If <see langword="true"/>, the links will all be disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// <para>
    /// The maximum number of pages displayed at a time.
    /// </para>
    /// <para>
    /// Default is 5.
    /// </para>
    /// <para>
    /// When the actual number of known pages (either <see cref="PageCount"/>, or <see
    /// cref="CurrentPage"/> + 1 if <see cref="PageCount"/> is unknown) is greater than this value,
    /// any excess pages are hidden and replaced by an ellipsis.
    /// </para>
    /// <para>
    /// If set to <see langword="null"/> there is no maximum: all pages are displayed.
    /// </para>
    /// </summary>
    [Parameter] public int? MaxPagesDisplayed { get; set; } = 5;

    /// <summary>
    /// <para>
    /// Invoked when the last page is requested if <see cref="PageCount"/> is <see
    /// langword="null"/>.
    /// </para>
    /// <para>
    /// Since the number of pages is unknown, the "last page" control is always available, but it is
    /// unknown whether activation will actually result in advancement to another page. Therefore,
    /// rather than updating <see cref="CurrentPage"/> directly, this callback is invoked. Your
    /// paging logic should determine whether there are additional pages to load, and if so, update
    /// <see cref="CurrentPage"/> accordingly.
    /// </para>
    /// <para>
    /// If no additional pages are available, it is recommended that you also set <see
    /// cref="PageCount"/> to the value of <see cref="CurrentPage"/>, so that the "next page" and
    /// "last page" controls will be disabled, indicating to the user that they are already on the
    /// last page, and so that further navigation will reflect the now-known number of total pages.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback LastRequested { get; set; }

    /// <summary>
    /// <para>
    /// Invoked when the next page is requested if <see cref="PageCount"/> is <see
    /// langword="null"/>.
    /// </para>
    /// <para>
    /// Since the number of pages is unknown, the "next page" control is always available, but it is
    /// unknown whether activation will actually result in advancement to another page. Therefore,
    /// rather than updating <see cref="CurrentPage"/> directly, this callback is invoked. Your
    /// paging logic should determine whether there are additional pages to load, and if so, update
    /// <see cref="CurrentPage"/> accordingly.
    /// </para>
    /// <para>
    /// If no additional pages are available, it is recommended that you also set <see
    /// cref="PageCount"/> to the value of <see cref="CurrentPage"/>, so that the "next page" and
    /// "last page" controls will be disabled, indicating to the user that they are already on the
    /// last page, and so that further navigation will reflect the now-known number of total pages.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback NextRequested { get; set; }

    /// <summary>
    /// <para>
    /// The total number of pages.
    /// </para>
    /// <para>
    /// May be <see langword="null"/> (the default) to indicate that the total number of pages is
    /// unknown.
    /// </para>
    /// <para>
    /// If set to a value less than <see cref="CurrentPage"/>, <see cref="CurrentPage"/> will be set
    /// to the new value.
    /// </para>
    /// </summary>
    [Parameter] public ulong? PageCount { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add(ThemeColor.ToCSS())
        .ToString();

    private ulong DefaultCurrentPage { get; set; }

    private bool IsInteractive { get; set; }

    [Inject, NotNull] NavigationManager? NavigationManager { get; set; }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var currentChanged = false;
        var oldCurrent = CurrentPage;

        await base.SetParametersAsync(parameters);

        if (!QueryStateService.IsInitialized)
        {
            return;
        }

        if (MaxPagesDisplayed < 1)
        {
            MaxPagesDisplayed = 1;
        }

        if (PageCount.HasValue
            && CurrentPage > PageCount.Value)
        {
            CurrentPage = PageCount.Value;
            currentChanged = true;
        }
        else if (CurrentPage != oldCurrent)
        {
            currentChanged = true;
        }

        if (currentChanged)
        {
            await CurrentPageChanged.InvokeAsync(CurrentPage);
        }
    }

    /// <inheritdoc/>
    protected override void OnInitialized()
    {
        var pageCounts = QueryStateService.RegisterProperty(
            Id,
            PageCountQueryParamName,
            OnPageCountQueryChangedAsync,
            PageCount);
        if (pageCounts?.Count > 0
            && ulong.TryParse(pageCounts[0], out var pageCount))
        {
            PageCount = pageCount;
        }

        DefaultCurrentPage = CurrentPage;
        SetCurrentPageFromQuery();

        NavigationManager.LocationChanged += OnLocationChanged;
    }

    /// <inheritdoc/>
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            IsInteractive = true;
            StateHasChanged();
        }
    }

    private void SetCurrentPageFromQuery()
    {
        if (Uri.TryCreate(NavigationManager.Uri, UriKind.Absolute, out var uri)
            && QueryHelpers
            .ParseQuery(uri.Query)
            .TryGetValue($"{Id}-p", out var queryValues)
            && queryValues.Last(x => !string.IsNullOrEmpty(x)) is string value
            && ulong.TryParse(value, out var currentPage))
        {
            CurrentPage = PageCount.HasValue
                ? Math.Min(PageCount.Value, Math.Max(0, currentPage))
                : Math.Max(0, currentPage);
        }
    }

    private async Task OnLastAsync()
    {
        await LastRequested.InvokeAsync();
        SetCurrentPage();
    }

    private void OnLocationChanged(object? sender, LocationChangedEventArgs e)
        => SetCurrentPageFromQuery();

    private async Task OnNextAsync()
    {
        await NextRequested.InvokeAsync();
        SetCurrentPage();
    }

    private Task OnPageCountQueryChangedAsync(QueryChangeEventArgs args)
    {
        if (ulong.TryParse(args.Value, out var pageCount))
        {
            PageCount = pageCount;
        }
        return Task.CompletedTask;
    }

    private async Task OnSetPageAsync(ValueChangeEventArgs e)
    {
        if (ulong.TryParse(e.Value, out var value))
        {
            CurrentPage = value;
            await CurrentPageChanged.InvokeAsync(CurrentPage);
            SetCurrentPage();
        }
    }

    private void SetCurrentPage()
    {
        if (PersistState)
        {
            NavigationManager.NavigateTo(
                NavigationManager.GetUriWithQueryParameter(
                    $"{Id}-p",
                    CurrentPage == DefaultCurrentPage
                        ? null
                        : CurrentPage.ToString(CultureInfo.InvariantCulture)),
                false,
                true);
            QueryStateService.SetPropertyValue(
                Id,
                PageCountQueryParamName,
                PageCount);
        }
    }
}