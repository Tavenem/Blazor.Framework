using Microsoft.AspNetCore.Components;
using System.Text.RegularExpressions;

namespace Tavenem.Blazor.Framework.Components.Forms.Editor.InternalDialogs;

/// <summary>
/// A dialog for choosing line height in the Editor.
/// </summary>
public partial class LineHeightDialog
{
    [CascadingParameter] private DialogInstance? Dialog { get; set; }

    private TextInput? LineHeightInput { get; set; }

    private List<string> LineHeights { get; } = new() { "Reset", "normal", "1", "1.2", "1.5", "2" };

    private string? NewLineHeight { get; set; } = "normal";

    private async Task SubmitAsync()
    {
        if (NewLineHeight == "Reset")
        {
            NewLineHeight = null;
        }

        if (LineHeightInput is not null)
        {
            await LineHeightInput.ValidateAsync();
            if (!LineHeightInput.IsValid)
            {
                return;
            }
        }

        Dialog?.Close(DialogResult.Ok(NewLineHeight));
    }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
    private static async IAsyncEnumerable<string> ValidateLineHeightAsync(string? value, object? _)
    {
        if (string.IsNullOrEmpty(value)
            || value == "Reset")
        {
            yield break;
        }

        if (double.TryParse(value, out var _))
        {
            yield break;
        }

#if NET7_0_OR_GREATER
        if (!LineHeightRegex().IsMatch(value))
        {
            yield return "Invalid line height";
        }
#else
        if (!Regex.IsMatch(value, "^(0?\\.?[\\d]+(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt))|(normal|inherit|initial|revert|revert-layer|unset)$"))
        {
            yield return "Invalid line height";
        }
#endif
    }
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously

#if NET7_0_OR_GREATER
    [RegexGenerator("^(0?\\.?[\\d]+(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt))|(normal|inherit|initial|revert|revert-layer|unset)$")]
    private static partial Regex LineHeightRegex();
#endif
}