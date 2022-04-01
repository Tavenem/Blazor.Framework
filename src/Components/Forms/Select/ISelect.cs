namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// An interface for select components.
/// </summary>
/// <typeparam name="TOption">
/// The type of option values.
/// </typeparam>
public interface ISelect<TOption>
{
    /// <summary>
    /// Whether all options are currently selected.
    /// </summary>
    public bool AllSelected { get; }

    /// <summary>
    /// Adds the given <paramref name="value"/> to the currect selection.
    /// </summary>
    /// <param name="value">The value to add to the selection.</param>
    public void SetValue(TOption? value);

    /// <summary>
    /// Called internally.
    /// </summary>
    public void Add(Option<TOption> option);

    /// <summary>
    /// Determine whether the given value is currently selected.
    /// </summary>
    /// <param name="option">The value to check for selection.</param>
    /// <returns>
    /// <see langword="true"/> if the given value is currently selected; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public bool IsSelected(TOption option);

    /// <summary>
    /// Called internally.
    /// </summary>
    public void Remove(Option<TOption> option);

    /// <summary>
    /// <para>
    /// Selects all options.
    /// </para>
    /// <para>
    /// Has no effect on single-select components.
    /// </para>
    /// </summary>
    public void SelectAll();
}
