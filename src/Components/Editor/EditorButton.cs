namespace Tavenem.Blazor.Framework;

/// <summary>
/// A custom button to display on the editor toolbar.
/// </summary>
public class EditorButton
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
    public Func<SelectedEditorText, string?>? Action { get; set; }

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
    public Func<SelectedEditorText, Task<string?>>? AsyncAction { get; set; }

    /// <summary>
    /// <para>
    /// The editor mode in which this button appears.
    /// </para>
    /// <para>
    /// When set to <see cref="EditorMode.None"/> (the default) the button is displayed in any mode.
    /// </para>
    /// </summary>
    public EditorMode EditMode { get; set; }

    /// <summary>
    /// The name of an icon to display on the button.
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// <para>
    /// The id of the button element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied.
    /// </para>
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// The text to display on the button.
    /// </summary>
    public string? Text { get; set; }

    /// <summary>
    /// A tooltip to show when hovering over the button.
    /// </summary>
    public string? Tooltip { get; set; }
}
