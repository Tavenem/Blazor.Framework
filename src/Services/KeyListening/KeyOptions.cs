namespace Tavenem.Blazor.Framework;

/// <summary>
/// Options for handling keyboard events for a particular key.
/// </summary>
public class KeyOptions
{
    /// <summary>
    /// <para>
    /// The key to listen for.
    /// </para>
    /// <para>
    /// See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
    /// </para>
    /// <para>
    /// Allows regular expressions in the form /[a-z]/ or /a|b/.
    /// </para>
    /// <para>
    /// Regular expressions with options (e.g. /[a-z]/g or /[a-z]/i) are
    /// <em>not</em> permitted.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If no key is explicitly set, this defaults to "Enter"
    /// </remarks>
    public string Key { get; set; } = "Enter";

    /// <summary>
    /// Subscribe to keydown events.
    /// </summary>
    public bool SubscribeDown { get; set; }

    /// <summary>
    /// Subscribe to keyup events.
    /// </summary>
    public bool SubscribeUp { get; set; }

    /// <summary>
    /// <para>
    /// Invoke preventDefault on handled keydown events.
    /// </para>
    /// <para>
    /// Leaving this <see langword="null"/> or setting it to "none" does not
    /// invoke preventDefault.
    /// </para>
    /// <para>
    /// Set to "key+none" to invoke preventDefault.
    /// </para>
    /// <para>
    /// Set to "key+shift" to invoke preventDefault when the Shift modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+ctrl" to invoke preventDefault when the Ctrl modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+alt" to invoke preventDefault when the Alt modifier is also
    /// pressed.
    /// </para>
    /// <para>
    /// Set to "key+meta" to invoke preventDefault when the Meta modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Multiple modifiers may be combined: e.g. "key+shift+ctrl", but they must
    /// be combined in the following order: shift+ctrl+alt+meta
    /// </para>
    /// <para>
    /// Sets of options may be combined with a pipe character to invoke
    /// preventDefault for different combinations: e.g. "key+shift|key+ctrl" to
    /// invoke preventDefault when <em>either</em> the Shift key <em>or</em>
    /// the Ctrl key is also pressed, but not both together.
    /// </para>
    /// </summary>
    public string? PreventDown { get; set; }

    /// <summary>
    /// <para>
    /// Invoke preventDefault on handled keyup events.
    /// </para>
    /// <para>
    /// Leaving this <see langword="null"/> or setting it to "none" does not
    /// invoke preventDefault.
    /// </para>
    /// <para>
    /// Set to "key+none" to invoke preventDefault.
    /// </para>
    /// <para>
    /// Set to "key+shift" to invoke preventDefault when the Shift modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+ctrl" to invoke preventDefault when the Ctrl modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+alt" to invoke preventDefault when the Alt modifier is also
    /// pressed.
    /// </para>
    /// <para>
    /// Set to "key+meta" to invoke preventDefault when the Meta modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Multiple modifiers may be combined: e.g. "key+shift+ctrl", but they must
    /// be combined in the following order: shift+ctrl+alt+meta
    /// </para>
    /// <para>
    /// Sets of options may be combined with a pipe character to invoke
    /// preventDefault for different combinations: e.g. "key+shift|key+ctrl" to
    /// invoke preventDefault when <em>either</em> the Shift key <em>or</em>
    /// the Ctrl key is also pressed, but not both together.
    /// </para>
    /// </summary>
    public string? PreventUp { get; set; }

    /// <summary>
    /// <para>
    /// Invoke stopPropagation on handled keydown events.
    /// </para>
    /// <para>
    /// Leaving this <see langword="null"/> or setting it to "none" does not
    /// invoke stopPropagation.
    /// </para>
    /// <para>
    /// Set to "key+none" to invoke stopPropagation.
    /// </para>
    /// <para>
    /// Set to "key+shift" to invoke stopPropagation when the Shift modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+ctrl" to invoke stopPropagation when the Ctrl modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+alt" to invoke stopPropagation when the Alt modifier is also
    /// pressed.
    /// </para>
    /// <para>
    /// Set to "key+meta" to invoke stopPropagation when the Meta modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Multiple modifiers may be combined: e.g. "key+shift+ctrl", but they must
    /// be combined in the following order: shift+ctrl+alt+meta
    /// </para>
    /// <para>
    /// Sets of options may be combined with a pipe character to invoke
    /// stopPropagation for different combinations: e.g. "key+shift|key+ctrl" to
    /// invoke stopPropagation when <em>either</em> the Shift key <em>or</em>
    /// the Ctrl key is also pressed, but not both together.
    /// </para>
    /// </summary>
    public string? StopDown { get; set; }

    /// <summary>
    /// <para>
    /// Invoke stopPropagation on handled keyup events.
    /// </para>
    /// <para>
    /// Leaving this <see langword="null"/> or setting it to "none" does not
    /// invoke stopPropagation.
    /// </para>
    /// <para>
    /// Set to "key+none" to invoke stopPropagation.
    /// </para>
    /// <para>
    /// Set to "key+shift" to invoke stopPropagation when the Shift modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+ctrl" to invoke stopPropagation when the Ctrl modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Set to "key+alt" to invoke stopPropagation when the Alt modifier is also
    /// pressed.
    /// </para>
    /// <para>
    /// Set to "key+meta" to invoke stopPropagation when the Meta modifier is
    /// also pressed.
    /// </para>
    /// <para>
    /// Multiple modifiers may be combined: e.g. "key+shift+ctrl", but they must
    /// be combined in the following order: shift+ctrl+alt+meta
    /// </para>
    /// <para>
    /// Sets of options may be combined with a pipe character to invoke
    /// stopPropagation for different combinations: e.g. "key+shift|key+ctrl" to
    /// invoke stopPropagation when <em>either</em> the Shift key <em>or</em>
    /// the Ctrl key is also pressed, but not both together.
    /// </para>
    /// </summary>
    public string? StopUp { get; set; }
}
