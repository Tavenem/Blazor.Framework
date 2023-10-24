namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A form component
/// </summary>
public interface IFormComponent
{
    /// <summary>
    /// Whether this field currently has a non-empty value.
    /// </summary>
    /// <remarks>
    /// <para>
    /// What constitutes an empty value may vary depending on the field.
    /// </para>
    /// <para>
    /// Most string-based inputs require a non-empty string.
    /// </para>
    /// <para>
    /// Most boolean inputs are always considered to have a value.
    /// </para>
    /// <para>
    /// Numeric inputs may always be considered to have a value, if they do not support having their
    /// value completely cleared (i.e., zero is a valid value).
    /// </para>
    /// </remarks>
    bool HasValue { get; }

    /// <summary>
    /// Whether this field has had its value changed.
    /// </summary>
    bool IsTouched { get; set; }

    /// <summary>
    /// Whether this field is currently valid.
    /// </summary>
    bool IsValid { get; }

    /// <summary>
    /// Whether this field is required.
    /// </summary>
    bool Required { get; set; }

    /// <summary>
    /// <para>
    /// Gets the current validation messages for this field.
    /// </para>
    /// <para>
    /// This method does not perform validation itself. It only returns messages determined by
    /// previous validation actions.
    /// </para>
    /// </summary>
    /// <returns>The current validation messages.</returns>
    IEnumerable<string> GetValidationMessages();

    /// <summary>
    /// Clears the modification flag for this form component.
    /// </summary>
    void MarkAsUnmodified();

    /// <summary>
    /// <para>
    /// Resets this field to its initial state.
    /// </para>
    /// <para>
    /// This also resets the field's <see cref="IFormComponent.IsTouched"/> value to <see
    /// langword="false"/>.
    /// </para>
    /// </summary>
    Task ResetAsync();
}
