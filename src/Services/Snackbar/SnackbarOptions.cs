using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Options for a snackbar instance.
/// </summary>
public class SnackbarOptions : IEquatable<SnackbarOptions>
{
    /// <summary>
    /// <para>
    /// Whether the snackbar should display an icon appropriate to its theme.
    /// </para>
    /// <para>
    /// The default is <see langword="true"/>.
    /// </para>
    /// </summary>
    public bool AutoIcon { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether this snackbar should be closed when page navigation occurs.
    /// </para>
    /// <para>
    /// The default is <see langword="false"/>.
    /// </para>
    /// </summary>
    public bool CloseAfterNavigation { get; set; }

    private Corner _position = Corner.Bottom_Left;
    /// <summary>
    /// <para>
    /// The location of the snackbar.
    /// </para>
    /// <para>
    /// Defaults to <see cref="Corner.Bottom_Left"/>.
    /// </para>
    /// <para>
    /// <see cref="Corner.None"/> is not allowed, and results in the value being reset to <see
    /// cref="Corner.Bottom_Left"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: changes to this property after a snackbar has been displayed have no effect.
    /// </remarks>
    public Corner Position
    {
        get => _position;
        set => _position = value == Corner.None
            ? Corner.Bottom_Left
            : value;
    }

    /// <summary>
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// Defaults to "!" if unset.
    /// </para>
    /// </summary>
    public MarkupString Message { get; set; } = (MarkupString)"!";

    /// <summary>
    /// An action to take when this snackbar is clicked.
    /// </summary>
    public Func<Snackbar, Task>? OnClick { get; set; }

    /// <summary>
    /// <para>
    /// Whether the snackbar will persist indefinitely until clicked or explicitly closed.
    /// </para>
    /// <para>
    /// When <see langword="true"/> <see cref="CloseAfterNavigation"/> is ignored.
    /// </para>
    /// <para>
    /// The default is <see langword="false"/>.
    /// </para>
    /// </summary>
    public bool RequireInteraction { get; set; }

    /// <summary>
    /// <para>
    /// Whether to show a close button which the user can use to dismiss the snackbar immediately.
    /// </para>
    /// <para>
    /// The default is <see langword="true"/>.
    /// </para>
    /// </summary>
    public bool ShowCloseButton { get; set; } = true;

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// <para>
    /// The amount of time to display the snackbar.
    /// </para>
    /// <para>
    /// The default is 5 seconds.
    /// </para>
    /// </summary>
    public TimeSpan VisibleStateDuration { get; set; } = TimeSpan.FromSeconds(5);

    /// <summary>
    /// Indicates whether the current object is equal to another object of the same type.
    /// </summary>
    /// <param name="other">An object to compare with this object.</param>
    /// <returns>
    /// <see langword="true" /> if the current object is equal to the <paramref name="other" />
    /// parameter; otherwise, <see langword="false" />.
    /// </returns>
    public bool Equals(SnackbarOptions? other) => other is not null
        && other.AutoIcon == AutoIcon
        && other.RequireInteraction == RequireInteraction
        && other.ShowCloseButton == ShowCloseButton
        && other.ThemeColor == ThemeColor
        && other.VisibleStateDuration == VisibleStateDuration
        && other.Message.Value.Equals(Message.Value, StringComparison.Ordinal);

    /// <summary>
    /// Determines whether the specified object is equal to the current object.
    /// </summary>
    /// <param name="obj">The object to compare with the current object.</param>
    /// <returns>
    /// <see langword="true" /> if the specified object  is equal to the current object; otherwise,
    /// <see langword="false" />.
    /// </returns>
    public override bool Equals(object? obj) => obj is SnackbarOptions other
        && Equals(other);

    /// <summary>Serves as the default hash function.</summary>
    /// <returns>A hash code for the current object.</returns>
    public override int GetHashCode() => HashCode.Combine(
        AutoIcon,
        Message,
        RequireInteraction,
        ShowCloseButton,
        ThemeColor,
        VisibleStateDuration);

    /// <summary>
    /// Indicates whether <paramref name="left"/> is equal to <paramref name="right" />.
    /// </summary>
    /// <param name="left">An object to compare.</param>
    /// <param name="right">An object to compare.</param>
    /// <returns>
    /// <see langword="true" /> if <paramref name="left"/> is equal to <paramref name="right" />;
    /// otherwise, <see langword="false" />.
    /// </returns>
    public static bool operator ==(SnackbarOptions? left, SnackbarOptions? right)
        => EqualityComparer<SnackbarOptions>.Default.Equals(left, right);

    /// <summary>
    /// Indicates whether <paramref name="left"/> is not equal to <paramref name="right" />.
    /// </summary>
    /// <param name="left">An object to compare.</param>
    /// <param name="right">An object to compare.</param>
    /// <returns>
    /// <see langword="true" /> if <paramref name="left"/> is not equal to <paramref name="right"
    /// />; otherwise, <see langword="false" />.
    /// </returns>
    public static bool operator !=(SnackbarOptions? left, SnackbarOptions? right) => !(left == right);
}
