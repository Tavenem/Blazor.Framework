﻿namespace Tavenem.Blazor.Framework;

/// <summary>
/// One of the built-in color palettes.
/// </summary>
public enum ThemeColor
{
    /// <summary>
    /// No specified color palette; the default color scheme for the component.
    /// </summary>
    None = 0,

    /// <summary>
    /// The primary color palette.
    /// </summary>
    Primary = 1,

    /// <summary>
    /// The secondary color palette.
    /// </summary>
    Secondary = 2,

    /// <summary>
    /// The tertiary color palette.
    /// </summary>
    Tertiary = 3,

    /// <summary>
    /// The info color palette.
    /// </summary>
    Danger = 4,

    /// <summary>
    /// The dark color palette.
    /// </summary>
    Dark = 5,

    /// <summary>
    /// <para>
    /// The default color palette.
    /// </para>
    /// <para>
    /// Note: this does not necessarily indicate the default for this component,
    /// but the specific color theme called "default."
    /// </para>
    /// </summary>
    Default = 6,

    /// <summary>
    /// The info color palette.
    /// </summary>
    Info = 7,

    /// <summary>
    /// The success color palette.
    /// </summary>
    Success = 8,

    /// <summary>
    /// The warning color palette.
    /// </summary>
    Warning = 9,
}
