using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

public partial class Avatar : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// Used as the alt property for the automatic img element created for <see
    /// cref="Image"/>.
    /// </summary>
    [Parameter] public string? Alt { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// URL of an image. Overrides <see cref="ChildContent"/>.
    /// </summary>
    [Parameter] public string? Image { get; set; }

    /// <summary>
    /// The group to which this avatar belongs, if any.
    /// </summary>
    [CascadingParameter] protected AvatarGroup? AvatarGroup { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.UserAttributes"/>.
    /// </summary>
    protected string ClassName => new CssBuilder("alert")
        .Add(Class)
        .AddClassFromDictionary(UserAttributes)
        .ToString();

    /// <summary>
    /// Method invoked when the component is ready to start, having received its
    /// initial parameters from its parent in the render tree.
    /// </summary>
    protected override void OnInitialized() => AvatarGroup?.Add(this);

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                AvatarGroup?.Remove(this);
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing,
    /// or resetting unmanaged resources.
    /// </summary>
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    internal void ForceRedraw() => StateHasChanged();
}
