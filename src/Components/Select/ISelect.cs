﻿namespace Tavenem.Blazor.Framework.Components.Forms;

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
    bool AllSelected { get; }

    /// <summary>
    /// Called internally.
    /// </summary>
    void Add(Option<TOption> option);

    /// <summary>
    /// Determine whether the given value is currently selected.
    /// </summary>
    /// <param name="option">The value to check for selection.</param>
    /// <returns>
    /// <see langword="true"/> if the given value is currently selected; otherwise <see
    /// langword="false"/>.
    /// </returns>
    bool IsSelected(TOption option);

    /// <summary>
    /// Called internally.
    /// </summary>
    void Remove(Option<TOption> option);

    /// <summary>
    /// <para>
    /// Selects all options.
    /// </para>
    /// <para>
    /// Has no effect on single-select components.
    /// </para>
    /// </summary>
    Task SelectAllAsync();

    /// <summary>
    /// Toggle the given option's selected state.
    /// </summary>
    /// <param name="option">The option to toggle.</param>
    Task ToggleValueAsync(Option<TOption> option);
}
