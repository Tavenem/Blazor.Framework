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

    /// <summary>
    /// <para>
    /// The id of the HTML element.
    /// </para>
    /// <para>
    /// A generated id will be assigned if none is supplied (including through splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    [Inject] private IJSRuntime JSRuntime { get; set; } = default!;

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
        }
    }

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _module = await JSRuntime.InvokeAsync<IJSObjectReference>(
                "import",
                "./_content/Tavenem.Blazor.Framework/tavenem-highlight.js");
        }
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