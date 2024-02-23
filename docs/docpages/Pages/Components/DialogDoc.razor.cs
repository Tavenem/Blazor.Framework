using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.DocPages.Shared;

namespace Tavenem.Blazor.Framework.DocPages.Pages.Components;

public partial class DialogDoc
{
    private bool _isVisible;

    [Inject] private DialogService DialogService { get; set; } = default!;

    private void ShowDialog() => DialogService.Show<ExampleDialog>("Example");

    private void ShowMessageBox() => DialogService.ShowMessageBox(MessageBoxOptions.Ok("Example dialog"));

    private void ShowNonModalDialog() => DialogService.Show<ExampleDialog>("Non-Modal Example", new() { NonModal = true });
}