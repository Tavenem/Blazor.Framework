using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.Editor.InternalDialogs;

/// <summary>
/// A dialog used internally by the <see cref="Framework.Editor"/> component.
/// </summary>
public partial class LinkDialog
{
    [CascadingParameter] private DialogInstance? Dialog { get; set; }

    private LinkInfo Link { get; set; } = new();

    private Form? LinkForm { get; set; }

    private async Task SubmitAsync()
    {
        if (LinkForm is null
            || string.IsNullOrEmpty(Link.Url))
        {
            return;
        }

        var valid = await LinkForm.ValidateAsync();
        if (!valid)
        {
            return;
        }

        if (!Uri.TryCreate(Link.Url, UriKind.RelativeOrAbsolute, out _))
        {
            return;
        }

        Dialog?.Close(DialogResult.Ok(Link));
    }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
    private static async IAsyncEnumerable<string> ValidateUri(string? value, object? _)
    {
        if (string.IsNullOrEmpty(value))
        {
            yield break;
        }

        if (value.StartsWith('#'))
        {
            yield break;
        }

        if (Uri.TryCreate(value, UriKind.RelativeOrAbsolute, out var _))
        {
            yield break;
        }

        yield return "Must be a valid URL";
    }
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
}
