namespace Tavenem.Blazor.Framework;

/// <summary>
/// Represents the selected text in an <see cref="Editor"/>.
/// </summary>
/// <param name="Position">
/// The position within the entire text of the beginning of the current selection (or the cursor
/// position, when the current selection is empty).
/// </param>
/// <param name="RawTextFrom">
/// <para>
/// When the editor is in WYSIWYG mode, the position within the raw (non-WYSIWYG) text of the
/// beginning of the current selection (or the cursor position, when the current selection is
/// empty).
/// </para>
/// <para>
/// When the editor is not in WYSIWYG mode, this is the same as <see cref="Position"/>.
/// </para>
/// </param>
/// <param name="RawTextTo">
/// <para>
/// When the editor is in WYSIWYG mode, the position within the raw (non-WYSIWYG) text of the
/// end of the current selection (exclusive).
/// </para>
/// <para>
/// When the editor is not in WYSIWYG mode, this is the same as <c>Position + Text.Length</c>.
/// </para>
/// </param>
/// <param name="Text">The currently selected text (may be <see langword="null"/>).</param>
public readonly record struct SelectedEditorText(int Position, int RawTextFrom, int RawTextTo, string? Text);