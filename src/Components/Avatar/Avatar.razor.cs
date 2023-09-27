﻿using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an avatar, with support for inclusion in a group.
/// </summary>
public partial class Avatar : IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// Used as the alt property for the automatic img element created for <see
    /// cref="Image"/>.
    /// </summary>
    [Parameter] public string? Alt { get; set; }

    /// <summary>
    /// URL of an image. Overrides <see cref="TavenemComponentBase.ChildContent"/>.
    /// </summary>
    [Parameter] public string? Image { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// The group to which this avatar belongs, if any.
    /// </summary>
    [CascadingParameter] protected AvatarGroup? AvatarGroup { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("avatar")
        .Add(ThemeColor.ToCSS())
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssStyle => new CssBuilder(Style)
        .AddStyle("z-index", AvatarGroup?.ZIndex(this))
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <inheritdoc/>
    protected override void OnInitialized() => AvatarGroup?.Add(this);

    /// <inheritdoc/>
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

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

    internal void ForceRedraw() => StateHasChanged();
}
