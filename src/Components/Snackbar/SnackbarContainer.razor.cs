using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides support for displaying <see cref="Snackbar"/>s when not using the <see
/// cref="FrameworkLayout"/> component.
/// </summary>
public partial class SnackbarContainer : IDisposable
{
    private bool _disposedValue;

    private Snackbar? ExtraSnackbarBottomLeft => SnackbarService.GetExtraSnackbar(Corner.Bottom_Left);

    private Snackbar? ExtraSnackbarBottomRight => SnackbarService.GetExtraSnackbar(Corner.Bottom_Right);

    private Snackbar? ExtraSnackbarTopLeft => SnackbarService.GetExtraSnackbar(Corner.Top_Left);

    private Snackbar? ExtraSnackbarTopRight => SnackbarService.GetExtraSnackbar(Corner.Top_Right);

    private IEnumerable<Snackbar> SnackbarsBottomLeft => SnackbarService.GetDisplayedSnackbars(Corner.Bottom_Left).Reverse();

    private IEnumerable<Snackbar> SnackbarsBottomRight => SnackbarService.GetDisplayedSnackbars(Corner.Bottom_Right).Reverse();

    [Inject, NotNull] private SnackbarService? SnackbarService { get; set; }

    private IEnumerable<Snackbar> SnackbarsTopLeft => SnackbarService.GetDisplayedSnackbars(Corner.Top_Left);

    private IEnumerable<Snackbar> SnackbarsTopRight => SnackbarService.GetDisplayedSnackbars(Corner.Top_Right);

    /// <inheritdoc />
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            SnackbarService.OnSnackbarsUpdated += OnSnackbarsUpdated;
        }
    }

    /// <inheritdoc />
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
                SnackbarService.OnSnackbarsUpdated -= OnSnackbarsUpdated;
            }

            _disposedValue = true;
        }
    }

    private void OnSnackbarsUpdated() => InvokeAsync(StateHasChanged);
}