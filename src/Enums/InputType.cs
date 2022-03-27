namespace Tavenem.Blazor.Framework;

/// <summary>
/// The input type of a <see cref="TextInput"/> component.
/// </summary>
/// <remarks>
/// Note: not all HTML input types are available. The missing types are supported by different
/// components.
/// </remarks>
public enum InputType
{
    /// <summary>
    /// The text type. This is the default value.
    /// </summary>
    Text = 0,

    /// <summary>
    /// <para>
    /// The email type.
    /// </para>
    /// <para>
    /// Has built-in format validation in most browsers, and may use a special keyboard on some
    /// devices.
    /// </para>
    /// </summary>
    Email = 1,

    /// <summary>
    /// <para>
    /// The password type.
    /// </para>
    /// <para>
    /// Automatically obscures the text in most browsers, and automatically alerts the user when
    /// used on an unsecure site.
    /// </para>
    /// </summary>
    Password = 2,

    /// <summary>
    /// <para>
    /// The search type.
    /// </para>
    /// <para>
    /// May incorporate a built-in search icon within the text field in some browsers.
    /// </para>
    /// </summary>
    Search = 3,

    /// <summary>
    /// <para>
    /// The telephone type.
    /// </para>
    /// <para>
    /// Has built-in format validation in most browsers, and may use a special keyboard on some
    /// devices.
    /// </para>
    /// </summary>
    Tel = 4,

    /// <summary>
    /// <para>
    /// The URL type.
    /// </para>
    /// <para>
    /// Has built-in format validation in most browsers, and may use a special keyboard on some
    /// devices.
    /// </para>
    /// </summary>
    Url = 5,
}
