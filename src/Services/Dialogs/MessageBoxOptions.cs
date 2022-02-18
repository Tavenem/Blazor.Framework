using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Options for displaying a message box.
/// </summary>
public class MessageBoxOptions : DialogOptions
{
    internal const string DefaultOk = "OK";

    private const string DefaultCancel = "Cancel";
    private const string DefaultNo = "No";
    private const string DefaultYes = "Yes";

    /// <summary>
    /// The text to display on the alternative choice button.
    /// </summary>
    public string? AltText { get; set; }

    /// <summary>
    /// The text to display on the negative choice button.
    /// </summary>
    public string? CancelText { get; set; }

    /// <summary>
    /// The message to display.
    /// </summary>
    public MarkupString Message { get; set; }

    /// <summary>
    /// The text to display on the affirmative choice button.
    /// </summary>
    public string OkText { get; set; } = DefaultOk;

    /// <summary>
    /// Initializes a new instance of <see cref="MessageBoxOptions"/>.
    /// </summary>
    public MessageBoxOptions() => Message = (MarkupString)$"{OkText}?";

    /// <summary>
    /// Initializes a new instance of <see cref="MessageBoxOptions"/>.
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    /// <param name="okText">
    /// <para>
    /// The text to display on the affirmative choice button.
    /// </para>
    /// <para>
    /// Defaults to "OK" if not provided.
    /// </para>
    /// </param>
    /// <param name="cancelText">
    /// The text to display on the negative choice button.
    /// </param>
    /// <param name="altText">
    /// The text to display on the alternative choice button.
    /// </param>
    public MessageBoxOptions(MarkupString message, string? okText = null, string? cancelText = null, string? altText = null)
    {
        Message = message;
        OkText = okText ?? DefaultOk;
        CancelText = cancelText;
        AltText = altText;
    }

    /// <summary>
    /// Initializes a new instance of <see cref="MessageBoxOptions"/>.
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    /// <param name="okText">
    /// <para>
    /// The text to display on the affirmative choice button.
    /// </para>
    /// <para>
    /// Defaults to "OK" if not provided.
    /// </para>
    /// </param>
    /// <param name="cancelText">
    /// The text to display on the negative choice button.
    /// </param>
    /// <param name="altText">
    /// The text to display on the alternative choice button.
    /// </param>
    public MessageBoxOptions(string message, string? okText = null, string? cancelText = null, string? altText = null)
        : this((MarkupString)message, okText, cancelText, altText) { }

    /// <summary>
    /// <para>
    /// Gets an options instance for a single-button message box with an "OK"
    /// button.
    /// </para>
    /// <para>
    /// The dialog will always return <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions Ok(MarkupString message)
        => new(message, DefaultOk);

    /// <summary>
    /// <para>
    /// Gets an options instance for a single-button message box with an "OK"
    /// button.
    /// </para>
    /// <para>
    /// The dialog will always return <see langword="true"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions Ok(string message)
        => new(message, DefaultOk);

    /// <summary>
    /// <para>
    /// Gets an options instance for a two-button message box with an "OK" and a
    /// "Cancel" button.
    /// </para>
    /// <para>
    /// "OK" will map to <see langword="true"/>, and "Cancel" to <see
    /// langword="null"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions OkCancel(MarkupString message)
        => new(message, DefaultOk, DefaultCancel);

    /// <summary>
    /// <para>
    /// Gets an options instance for a two-button message box with an "OK" and a
    /// "Cancel" button.
    /// </para>
    /// <para>
    /// "OK" will map to <see langword="true"/>, and "Cancel" to <see
    /// langword="null"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions OkCancel(string message)
        => new(message, DefaultOk, DefaultCancel);

    /// <summary>
    /// <para>
    /// Gets an options instance for a two-button message box with a "Yes"
    /// button and a "No" button.
    /// </para>
    /// <para>
    /// "Yes" will map to <see langword="true"/>, and "No" to <see
    /// langword="false"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions YesNo(MarkupString message)
        => new(message, DefaultYes, DefaultNo);

    /// <summary>
    /// <para>
    /// Gets an options instance for a two-button message box with a "Yes"
    /// button and a "No" button.
    /// </para>
    /// <para>
    /// "Yes" will map to <see langword="true"/>, and "No" to <see
    /// langword="false"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions YesNo(string message)
        => new(message, DefaultYes, DefaultNo);

    /// <summary>
    /// <para>
    /// Gets an options instance for a three-button message box with a "Yes"
    /// button, a "No" button, and a "Cancel" button.
    /// </para>
    /// <para>
    /// "Yes" will map to <see langword="true"/>, "No" to <see
    /// langword="false"/>, and "Cancel" to <see langword="null"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions YesNoCancel(MarkupString message)
        => new(message, DefaultYes, DefaultCancel, DefaultNo);

    /// <summary>
    /// <para>
    /// Gets an options instance for a three-button message box with a "Yes"
    /// button, a "No" button, and a "Cancel" button.
    /// </para>
    /// <para>
    /// "Yes" will map to <see langword="true"/>, "No" to <see
    /// langword="false"/>, and "Cancel" to <see langword="null"/>.
    /// </para>
    /// </summary>
    /// <param name="message">
    /// <para>
    /// The message to display.
    /// </para>
    /// <para>
    /// May contain HTML.
    /// </para>
    /// </param>
    public static MessageBoxOptions YesNoCancel(string message)
        => new(message, DefaultYes, DefaultCancel, DefaultNo);
}
