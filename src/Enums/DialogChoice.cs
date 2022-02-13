namespace Tavenem.Blazor.Framework;

/// <summary>
/// The button a user pressed to close a dialog.
/// </summary>
public enum DialogChoice
{
    /// <summary>
    /// <para>
    /// No option was selected.
    /// </para>
    /// <para>
    /// May indicate programmatic closure, or a default option.
    /// </para>
    /// </summary>
    None = 0,

    /// <summary>
    /// The affirmative choice was selected.
    /// </summary>
    Ok = 1,

    /// <summary>
    /// The negative choice was selected.
    /// </summary>
    Cancel = 2,

    /// <summary>
    /// An alternative choice was selected.
    /// </summary>
    Alt = 3,
}
