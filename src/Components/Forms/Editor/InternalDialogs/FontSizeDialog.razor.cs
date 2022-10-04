using Microsoft.AspNetCore.Components;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework.Components.Forms.Editor.InternalDialogs;

/// <summary>
/// A dialog for choosing font size in the Editor.
/// </summary>
public partial class FontSizeDialog
{
    [CascadingParameter] private DialogInstance? Dialog { get; set; }

    private TextInput? FontSizeInput { get; set; }

    private List<string> FontSizes { get; } = new() { "Reset", ".75em", ".875em", "1em", "1.25em", "1.5em", "1.75em", "2em", "2.5em", "3em" };

    private string? NewFontSize { get; set; } = "1em";

    private async Task SubmitAsync()
    {
        if (NewFontSize == "Reset")
        {
            NewFontSize = null;
        }

        if (FontSizeInput is not null)
        {
            await FontSizeInput.ValidateAsync();
            if (!FontSizeInput.IsValid)
            {
                return;
            }
        }

        if (!string.IsNullOrEmpty(NewFontSize) && double.TryParse(NewFontSize, out var _))
        {
            NewFontSize = $"{NewFontSize}em";
        }

        Dialog?.Close(DialogResult.Ok(NewFontSize));
    }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
    private static async IAsyncEnumerable<string> ValidateFontSizeAsync(string? value, object? _)
    {
        if (string.IsNullOrEmpty(value) || value == "Reset")
        {
            yield break;
        }

        if (double.TryParse(value, out var _))
        {
            yield break;
        }

#if NET7_0_OR_GREATER
        if (!FontSizeRegex().IsMatch(value))
        {
            yield return "Invalid font size";
        }
#else
        if (!Regex.IsMatch(value, "^(0?\\.?[\\d]+(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt))|((x+-)?small|smaller|medium|(x+-)?large|larger|inherit|initial|revert|revert-layer|unset)$"))
        {
            yield return "Invalid font size";
        }
#endif
    }
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously

#if NET7_0_OR_GREATER
    [GeneratedRegex("^(0?\\.?[\\d]+(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt))|((x+-)?small|smaller|medium|(x+-)?large|larger|inherit|initial|revert|revert-layer|unset)$")]
    private static partial Regex FontSizeRegex();
#endif
}