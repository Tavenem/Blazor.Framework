namespace Tavenem.Blazor.Framework;

/// <summary>
/// The result of closing a dialog.
/// </summary>
public class DialogResult
{
    /// <summary>
    /// a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Alt"/> and no data.
    /// </summary>
    public static DialogResult DefaultAlt { get; } = Alt();

    /// <summary>
    /// a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Cancel"/> and no data.
    /// </summary>
    public static DialogResult DefaultCancel { get; } = Cancel();

    /// <summary>
    /// a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Ok"/> and no data.
    /// </summary>
    public static DialogResult DefaultOk { get; } = Ok();

    /// <summary>
    /// The choice selected.
    /// </summary>
    public DialogChoice Choice { get; set; }

    /// <summary>
    /// <para>
    /// The data returned.
    /// </para>
    /// <para>
    /// Often <see langword="null"/> or <c>default</c> if <see cref="Choice"/>
    /// is not <see cref="DialogChoice.Ok"/> or <see cref="DialogChoice.Alt"/>.
    /// </para>
    /// </summary>
    public object? Data { get; set; }

    /// <summary>
    /// Initializes a new instance of <see cref="DialogResult"/>.
    /// </summary>
    public DialogResult() { }

    /// <summary>
    /// Initializes a new instance of <see cref="DialogResult"/>.
    /// </summary>
    public DialogResult(DialogChoice choice, object? data = null)
    {
        Choice = choice;
        Data = data;
    }

    /// <summary>
    /// Gets a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Alt"/>.
    /// </summary>
    /// <returns>
    /// A a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Alt"/>.
    /// </returns>
    public static DialogResult Alt(object? data = null) => new(DialogChoice.Alt, data);

    /// <summary>
    /// Gets a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Cancel"/>.
    /// </summary>
    /// <param name="data">The data returned.</param>
    /// <returns>
    /// A a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Cancel"/>.
    /// </returns>
    public static DialogResult Cancel(object? data = null) => new(DialogChoice.Cancel, data);

    /// <summary>
    /// Gets a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Ok"/>.
    /// </summary>
    /// <param name="data">The data returned.</param>
    /// <returns>
    /// A a new <see cref="DialogResult"/> with <see cref="Choice"/> set
    /// to <see cref="DialogChoice.Ok"/>.
    /// </returns>
    public static DialogResult Ok(object? data = null) => new(DialogChoice.Ok, data);
}
