using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays controls to navigate between pages.
/// </summary>
public partial class Pagination
{
    private ulong _currentPage;
    /// <summary>
    /// <para>
    /// The zero-based index of the current page.
    /// </para>
    /// <para>
    /// Cannot be set to a value greater than <see cref="PageCount"/> if <see cref="PageCount"/> is
    /// non-<see langword="null"/>.
    /// </para>
    /// </summary>
    [Parameter]
    public ulong CurrentPage
    {
        get => _currentPage;
        set
        {
            if (_currentPage == value)
            {
                return;
            }

            if (_pageCount.HasValue)
            {
                if (value > _pageCount.Value)
                {
                    _currentPage = _pageCount.Value;
                    CurrentPageChanged.InvokeAsync(_currentPage);
                }
            }
            else
            {
                _currentPage = value;
                CurrentPageChanged.InvokeAsync(_currentPage);
            }
        }
    }

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
    /// The name of the icon displayed for the "first page" control.
    /// </para>
    /// <para>
    /// Defaults to "first_page".
    /// </para>
    /// </summary>
    [Parameter] public string FirstPageIcon { get; set; } = "first_page";

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
    /// The name of the icon displayed for the "last page" control.
    /// </para>
    /// <para>
    /// Defaults to "last_page".
    /// </para>
    /// </summary>
    [Parameter] public string LastPageIcon { get; set; } = "last_page";

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
    /// The name of the icon displayed for the "next page" control.
    /// </para>
    /// <para>
    /// Defaults to "navigate_next".
    /// </para>
    /// </summary>
    [Parameter] public string NextPageIcon { get; set; } = "navigate_next";

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

    private ulong? _pageCount;
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
    [Parameter]
    public ulong? PageCount
    {
        get => _pageCount;
        set
        {
            if (_pageCount == value)
            {
                return;
            }

            _pageCount = value;

            if (value.HasValue && _currentPage >= value)
            {
                _currentPage = value.Value - 1;
                CurrentPageChanged.InvokeAsync(_currentPage);
            }
        }
    }

    /// <summary>
    /// <para>
    /// The name of the icon displayed for the "previous page" control.
    /// </para>
    /// <para>
    /// Defaults to "navigate_before".
    /// </para>
    /// </summary>
    [Parameter] public string PreviousPageIcon { get; set; } = "navigate_before";

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
    protected override string CssClass => new CssBuilder("pagination")
        .Add(Class)
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    private ulong FirstPage
    {
        get
        {
            if (MaxPagesDisplayed.HasValue)
            {
                var half = (ulong)Math.Truncate(MaxPagesDisplayed.Value / 2.0);
                var start = CurrentPage - half;

                if (PageCount.HasValue && CurrentPage + half >= PageCount.Value)
                {
                    start -= CurrentPage + half + 1 - PageCount.Value;
                }

                return Math.Max(start, 0);
            }

            return 0;
        }
    }

    private ulong LastPage
    {
        get
        {
            if (MaxPagesDisplayed.HasValue)
            {
                if (PageCount.HasValue)
                {
                    return Math.Min(
                        FirstPage + (ulong)MaxPagesDisplayed.Value,
                        PageCount.Value - 1);
                }

                return CurrentPage;
            }

            return PageCount ?? CurrentPage;
        }
    }

    private string PageCssClass => new CssBuilder("btn btn-text")
        .Add(PageClass)
        .ToString();

    private string PageCssClassControl => new CssBuilder("btn btn-icon")
        .Add(PageClass)
        .ToString();

    private void OnFirst()
    {
        if (CurrentPage > 0)
        {
            CurrentPage = 0;
        }
    }

    private async Task OnNextAsync()
    {
        if (PageCount.HasValue)
        {
            CurrentPage--;
        }
        else
        {
            await NextRequested.InvokeAsync();
        }
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
    }

    private void OnPrevious()
    {
        if (CurrentPage > 0)
        {
            CurrentPage--;
        }
    }
}