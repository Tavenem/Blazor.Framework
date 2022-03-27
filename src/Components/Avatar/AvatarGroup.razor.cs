using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Displays an avatar group, with support for collapsing excess items.
/// </summary>
public partial class AvatarGroup
{
    private readonly List<Avatar> _avatars = new();

    /// <summary>
    /// <para>
    /// The maximum number avatars to display.
    /// </para>
    /// <para>
    /// If the actual number exceeds this value, a single additional avatar with
    /// the count of hidden ones will be displayed in their place.
    /// </para>
    /// </summary>
    [Parameter]
    public int? Max { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the avatar displayed in place of any overflow.
    /// </summary>
    [Parameter] public string? OverflowAvatarClass { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string? CssClass => new CssBuilder("avatar-group")
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Custom CSS class(es) for the avatar displayed in place of any overflow.
    /// </summary>
    protected string? OverflowAvatarClassName => new CssBuilder("avatar")
        .Add(OverflowAvatarClass)
        .ToString();

    /// <inheritdoc/>
    public override Task SetParametersAsync(ParameterView parameters)
    {
        if (parameters.TryGetValue<int?>(nameof(Max), out var max)
            && max != Max)
        {
            foreach (var avatar in _avatars)
            {
                avatar.ForceRedraw();
            }
        }

        return base.SetParametersAsync(parameters);
    }

    internal void Add(Avatar avatar)
    {
        _avatars.Add(avatar);
        StateHasChanged();
    }

    internal string? ZIndex(Avatar avatar)
    {
        var index = _avatars.IndexOf(avatar);
        if (index == -1)
        {
            return null;
        }

        return (_avatars.Count - index).ToString();
    }

    internal void Remove(Avatar avatar) => _avatars.Remove(avatar);

    internal bool ShouldDisplay(Avatar avatar) => !Max.HasValue || _avatars.IndexOf(avatar) < Max;
}
