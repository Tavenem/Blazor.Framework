using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides syntax highlighting for code blocks.
/// </summary>
public partial class SyntaxHighlighter : IAsyncDisposable
{
    private bool _disposed;
    private IJSObjectReference? _module;

    private string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    [Inject] private IJSRuntime JSRuntime { get; set; } = default!;

    /// <inheritdoc />
    protected override async Task OnInitializedAsync()
    {
        _module = await JSRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "./_content/Tavenem.Blazor.Framework/tavenem-highlight.js");
        await _module.InvokeVoidAsync("highlight", Id);
    }

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (_module is not null)
        {
            await _module.InvokeVoidAsync("highlight", Id);
        }
    }

    /// <inheritdoc />
    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }
        _disposed = true;
        if (_module is not null)
        {
            await _module.DisposeAsync();
        }
        GC.SuppressFinalize(this);
    }
}