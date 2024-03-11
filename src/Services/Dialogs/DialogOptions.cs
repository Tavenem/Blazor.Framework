namespace Tavenem.Blazor.Framework;

/// <summary>
/// Options for displaying a dialog.
/// </summary>
public class DialogOptions
{
    /// <summary>
    /// <para>
    /// The breakpoint which defines the maximum width of the dialog.
    /// </para>
    /// <para>
    /// Ignored if <see cref="FullScreen"/> is <see langword="true"/>.
    /// </para>
    /// </summary>
    public Breakpoint Breakpoint { get; set; }

    /// <summary>
    /// Whether to prevent the dialog from closing when the escape key is
    /// pressed.
    /// </summary>
    public bool DisableCloseOnEscape { get; set; }

    /// <summary>
    /// Whether to prevent the dialog from closing when the overlay backdrop is
    /// clicked.
    /// </summary>
    public bool DisableCloseOnOverlayClick { get; set; }

    /// <summary>
    /// Whether to show the dialog in the full viewport.
    /// </summary>
    public bool FullScreen { get; set; }

    /// <summary>
    /// <para>
    /// Whether to hide the close button in the header.
    /// </para>
    /// <para>
    /// Ignored if <see cref="HideHeader"/> is <see langword="true"/>.
    /// </para>
    /// </summary>
    public bool HideCloseButton { get; set; }

    /// <summary>
    /// Whether to hide the header.
    /// </summary>
    public bool HideHeader { get; set; }

    /// <summary>
    /// <para>
    /// Whether the dialog should be draggable.
    /// </para>
    /// <para>
    /// Ignored if <see cref="HideHeader"/> is <see langword="true"/> (since the header is the drag
    /// handle).
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    public bool IsDraggable { get; set; } = true;

    /// <summary>
    /// <para>
    /// Whether the dialog should be resizable.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// </summary>
    public bool IsResizable { get; set; } = true;

    /// <summary>
    /// Whether to show the dialog non-modally (i.e. without an overlay blocking the rest of the
    /// window).
    /// </summary>
    public bool NonModal { get; set; }

    /// <summary>
    /// <para>
    /// The location of the dialog.
    /// </para>
    /// <para>
    /// Defaults to <see cref="Origin.Center_Center"/> (the center of the
    /// viewport).
    /// </para>
    /// </summary>
    public Origin Origin { get; set; } = Origin.Center_Center;
}
