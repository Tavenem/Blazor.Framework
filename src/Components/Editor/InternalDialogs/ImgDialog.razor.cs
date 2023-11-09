using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.Components.Editor.InternalDialogs;

/// <summary>
/// A dialog used internally by the <see cref="Framework.Editor"/> component.
/// </summary>
public partial class ImgDialog
{
    [CascadingParameter] private DialogInstance? Dialog { get; set; }

    private ImgInfo Img { get; set; } = new();

    private Form? ImgForm { get; set; }

    private async Task SubmitAsync()
    {
        if (ImgForm is null
            || string.IsNullOrEmpty(Img.Src))
        {
            return;
        }

        var valid = await ImgForm.ValidateAsync();
        if (!valid)
        {
            return;
        }

        if (!Uri.TryCreate(Img.Src, UriKind.RelativeOrAbsolute, out _))
        {
            return;
        }

        Dialog?.Close(DialogResult.Ok(Img));
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
