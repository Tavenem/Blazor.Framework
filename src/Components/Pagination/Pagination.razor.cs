using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays controls to navigate between pages.
/// </summary>
public partial class Pagination : PersistentComponentBase
{
    private const string CurrentPageQueryParamName = "p";
    private const string PageCountQueryParamName = "c";

    /// <summary>
    /// <para>
    /// The zero-based index of the current page.
    /// </para>
    /// <para>
    /// Cannot be set to a value greater than <see cref="PageCount"/> if <see cref="PageCount"/> is
    /// non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter] public ulong CurrentPage { get; set; }

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
    /// Custom CSS class(es) for the page button elements.
    /// </summary>
    [Parameter] public string? PageClass { get; set; }

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
    /// Custom CSS style(s) for the page button elements.
    /// </summary>
    [Parameter] public string? PageStyle { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("pagination")
        .Add(Class)
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private ElementReference ElementReference { get; set; }

    private ulong FirstPage
    {
        get
        {
            if (MaxPagesDisplayed.HasValue)
            {
                var half = (ulong)Math.Truncate(MaxPagesDisplayed.Value / 2.0);
                var start = half >= CurrentPage
                    ? 0
                    : CurrentPage - half - 1;

                if (start > 0
                    && PageCount.HasValue
                    && CurrentPage + half >= PageCount.Value)
                {
                    start -= CurrentPage + half - PageCount.Value;
                }

                return Math.Max(start, 0);
            }

            return 0;
        }
    }

    private int FocusSkipFirst => CurrentPage == 0 ? 0 : 1;

    private int FocusSkipFirstPrev => CurrentPage == 0 ? 0 : 2;

    private bool IsInteractive { get; set; }

    private ulong LastPage
    {
        get
        {
            if (MaxPagesDisplayed.HasValue)
            {
                if (PageCount.HasValue)
                {
                    return Math.Min(
                        FirstPage + (ulong)MaxPagesDisplayed.Value - 1,
                        PageCount.Value - 1);
                }

                return CurrentPage;
            }

            return PageCount ?? CurrentPage;
        }
    }

    private ElementReference LastPageElement { get; set; }

    private string? PageCssClass => new CssBuilder("btn btn-text")
        .Add(PageClass)
        .ToString();

    private string? PageCssClassControl => new CssBuilder("btn btn-icon")
        .Add(PageClass)
        .ToString();

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
            && CurrentPage >= PageCount.Value)
        {
            CurrentPage = PageCount.Value - 1;
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

        var currentPages = QueryStateService.RegisterProperty(
            Id,
            CurrentPageQueryParamName,
            OnCurrentPageQueryChangedAsync,
            CurrentPage + 1);
        if (currentPages?.Count > 0
            && ulong.TryParse(currentPages[0], out var currentPage))
        {
            CurrentPage = PageCount.HasValue
                ? Math.Min(PageCount.Value - 1, Math.Max(0, currentPage - 1))
                : Math.Max(0, currentPage - 1);
        }
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

    private string GetFirstPageUrl()
        => QueryStateService.GetUriWithPropertyValue(Id, CurrentPageQueryParamName, 1);

    private string GetLastPageUrl() => QueryStateService.GetUriWithPropertyValue(
        Id,
        CurrentPageQueryParamName,
        PageCount ?? CurrentPage + 2);

    private string GetNextPageUrl() => QueryStateService.GetUriWithPropertyValue(
        Id,
        CurrentPageQueryParamName,
        PageCount.HasValue
            ? Math.Min(PageCount.Value, CurrentPage + 2)
            : CurrentPage + 2);

    private string GetPageUrl(ulong value) => QueryStateService.GetUriWithPropertyValue(
        Id,
        CurrentPageQueryParamName,
        value + 1);

    private string GetPreviousPageUrl() => QueryStateService.GetUriWithPropertyValue(
        Id,
        CurrentPageQueryParamName,
        Math.Max(1, CurrentPage));

    private Task OnCurrentPageQueryChangedAsync(QueryChangeEventArgs args)
    {
        if (ulong.TryParse(args.Value, out var currentPage))
        {
            CurrentPage = PageCount.HasValue
                ? Math.Min(PageCount.Value - 1, Math.Max(0, currentPage - 1))
                : Math.Max(0, currentPage - 1);
        }
        return Task.CompletedTask;
    }

    private async Task OnFirstAsync()
    {
        if (CurrentPage > 0)
        {
            CurrentPage = 0;
            await ElementReference.FocusFirstAsync(FocusSkipFirstPrev);
            await CurrentPageChanged.InvokeAsync(CurrentPage);
            SetCurrentPage();
        }
    }

    private async Task OnNextAsync()
    {
        if (PageCount.HasValue)
        {
            CurrentPage++;
            await CurrentPageChanged.InvokeAsync(CurrentPage);
        }
        else
        {
            await NextRequested.InvokeAsync();
        }
        if (CurrentPage == PageCount - 1)
        {
            await ElementReference.FocusFirstAsync(1);
        }
        SetCurrentPage();
    }

    private async Task OnLastAsync()
    {
        if (PageCount.HasValue)
        {
            CurrentPage = PageCount.Value - 1;
        }
        else
        {
            await LastRequested.InvokeAsync();
        }
        await ElementReference.FocusFirstAsync(FocusSkipFirst);
        if (PageCount.HasValue)
        {
            await CurrentPageChanged.InvokeAsync(CurrentPage);
        }
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

    private async Task OnPreviousAsync()
    {
        if (CurrentPage == 0)
        {
            return;
        }
        CurrentPage--;
        if (CurrentPage == 0)
        {
            await ElementReference.FocusLastAsync(1);
        }
        await CurrentPageChanged.InvokeAsync(CurrentPage);
        SetCurrentPage();
    }

    private async Task OnSetPageAsync(ulong value)
    {
        CurrentPage = value;
        await ElementReference.FocusFirstAsync(FocusSkipFirstPrev + (int)(CurrentPage - FirstPage));
        await CurrentPageChanged.InvokeAsync(CurrentPage);
        SetCurrentPage();
    }

    private void SetCurrentPage()
    {
        if (PersistState)
        {
            QueryStateService.SetPropertyValue(
                Id,
                CurrentPageQueryParamName,
                CurrentPage + 1);
            QueryStateService.SetPropertyValue(
                Id,
                PageCountQueryParamName,
                PageCount);
        }
    }
}