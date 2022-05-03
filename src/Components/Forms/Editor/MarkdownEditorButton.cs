namespace Tavenem.Blazor.Framework;

/// <summary>
/// A custom button to display on the markdown editor toolbar.
/// </summary>
public class MarkdownEditorButton
{
    /// <summary>
    /// <para>
    /// The action taken when the button is clicked.
    /// </para>
    /// <para>
    /// This function receives the currently selected text as a parameter, and
    /// should return the text to be inserted in place of the current selection.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If both <see cref="Action"/> and <see cref="AsyncAction"/> are defined,
    /// <see cref="Action"/> will be executed first, then <see
    /// cref="AsyncAction"/> will be executed with the result of <see
    /// cref="Action"/> as its input, and the result will be used to update the
    /// editor.
    /// </remarks>
    /// <example>
    /// If the function receives "some text" as a parameter, you could return
    /// "*some text*" to add italic formatting.
    /// </example>
    public Func<string?, string?>? Action { get; set; }

    /// <summary>
    /// <para>
    /// An asynchronous action taken when the button is clicked.
    /// </para>
    /// <para>
    /// This function receives the currently selected text as a parameter, and
    /// should return the text to be inserted in place of the current selection.
    /// </para>
    /// </summary>
    /// <remarks>
    /// If both <see cref="Action"/> and <see cref="AsyncAction"/> are defined,
    /// <see cref="Action"/> will be executed first, then <see
    /// cref="AsyncAction"/> will be executed with the result of <see
    /// cref="Action"/> as its input, and the result will be used to update the
    /// editor.
    /// </remarks>
    /// <example>
    /// If the function receives "some text" as a parameter, you could return
    /// "*some text*" to add italic formatting.
    /// </example>
    public Func<string?, Task<string?>>? AsyncAction { get; set; }

    /// <summary>
    /// <para>
    /// The id of the host HTML element.
    /// </para>
    /// <para>
    /// Will be set to a random GUID if left unset.
    /// </para>
    /// </summary>
    /// <remarks>
    /// In most situations this can be left unset. It can be manually configured
    /// when you intend to provide custom CSS for this specific button instance.
    /// </remarks>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// The text to display on the button.
    /// </summary>
    public string? Text { get; set; }

    /// <summary>
    /// A tooltip to show when hovering over the button.
    /// </summary>
    public string? Tooltip { get; set; }
}
