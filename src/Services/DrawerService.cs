namespace Tavenem.Blazor.Framework;

/// <summary>
/// Manages drawer toggles.
/// </summary>
public class DrawerService
{
    private readonly Dictionary<Side, Drawer> _drawers = new();

    internal event EventHandler<Side>? AddedDrawer;

    internal event EventHandler<Side>? RemovedDrawer;

    internal void Add(Drawer drawer)
    {
        _drawers[drawer.Side] = drawer;
        AddedDrawer?.Invoke(this, drawer.Side);
    }

    /// <summary>
    /// Gets the breakpoint at which the drawer on the given <paramref name="side"/> should be
    /// permanently hidden.
    /// </summary>
    /// <param name="side">The <see cref="Side"/> to check.</param>
    /// <returns>
    /// The breakpoint at which the drawer on the given <paramref name="side"/> should be
    /// permanently hidden; or <see cref="Breakpoint.None"/> if there is no drawer on the given
    /// <paramref name="side"/>.
    /// </returns>
    public Breakpoint GetHideAtBreakpoint(Side side) => _drawers.TryGetValue(side, out var drawer)
        ? drawer.HideAtBreakpoint
        : Breakpoint.None;

    /// <summary>
    /// Gets the breakpoint at which the drawer on the given <paramref name="side"/> should be
    /// permanently visible.
    /// </summary>
    /// <param name="side">The <see cref="Side"/> to check.</param>
    /// <returns>
    /// The breakpoint at which the drawer on the given <paramref name="side"/> should be
    /// permanently visible; or <see cref="Breakpoint.None"/> if there is no drawer on the given
    /// <paramref name="side"/>.
    /// </returns>
    public Breakpoint GetShowAtBreakpoint(Side side) => _drawers.TryGetValue(side, out var drawer)
        ? drawer.ShowAtBreakpoint
        : Breakpoint.None;

    internal bool HasDrawer(Side side) => _drawers.ContainsKey(side);

    internal void Remove(Drawer drawer)
    {
        if (_drawers.TryGetValue(drawer.Side, out var value)
            && value.Equals(drawer))
        {
            _drawers.Remove(drawer.Side);
            RemovedDrawer?.Invoke(this, drawer.Side);
        }
    }

    internal async Task ToggleAsync(Side side)
    {
        if (_drawers.TryGetValue(side, out var drawer))
        {
            await drawer.ToggleAsync();
        }
    }
}
