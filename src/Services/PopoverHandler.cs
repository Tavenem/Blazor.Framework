using Microsoft.JSInterop;

namespace Tavenem.Blazor.Framework.Services;

internal class PopoverHandler
{
    private readonly IJSObjectReference _jsInterop;

    public string? AnchorId { get; init; }
    public Guid Id { get; init; }
    public bool IsConnected { get; private set; }

    public PopoverHandler(IJSObjectReference jsInterop, string? anchorId = null)
    {
        _jsInterop = jsInterop;
        AnchorId = anchorId;
        Id = Guid.NewGuid();
    }

    public async Task DetachAsync()
    {
        try
        {
            await _jsInterop.InvokeVoidAsync("popoverDisconnect", Id);
        }
        catch (JSDisconnectedException) { }
        catch (TaskCanceledException) { }
        finally
        {
            IsConnected = false;
        }
    }

    public async Task Initialize()
    {
        await _jsInterop.InvokeVoidAsync("popoverConnect", Id, AnchorId);
        IsConnected = true;
    }
}
