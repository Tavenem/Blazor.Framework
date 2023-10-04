using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A toggle button for a <see cref="Drawer"/> component.
/// </summary>
public partial class DrawerToggle : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// The drawer side controlled by this toggle.
    /// </summary>
    [Parameter] public Side Side { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("btn btn-icon d-print-none")
        .Add(DrawerService.GetShowAtBreakpoint(Side) switch
        {
            Breakpoint.None => null,
            var v => $"drawer-toggle-{v.ToCSS()}",
        })
        .Add(DrawerService.GetHideAtBreakpoint(Side) switch
        {
            Breakpoint.None => null,
            var v => $"drawer-toggle-hidden-{v.ToCSS()}",
        })
        .ToString();

    [Inject, NotNull] private DrawerService? DrawerService { get; set; }

    private bool HasDrawer => IsInteractive && DrawerService.HasDrawer(Side);

    private bool IsInteractive { get; set; }

    /// <inheritdoc />
    protected override void OnInitialized()
    {
        DrawerService.AddedDrawer += AddedDrawer;
        DrawerService.RemovedDrawer += RemovedDrawer;
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
                DrawerService.AddedDrawer -= AddedDrawer;
                DrawerService.RemovedDrawer -= RemovedDrawer;
            }

            _disposedValue = true;
        }
    }

    private void AddedDrawer(object? sender, Side e)
    {
        if (e == Side)
        {
            StateHasChanged();
        }
    }

    private Task OnDrawerToggleAsync() => DrawerService.ToggleAsync(Side);

    private void RemovedDrawer(object? sender, Side e)
    {
        if (e == Side)
        {
            StateHasChanged();
        }
    }
}