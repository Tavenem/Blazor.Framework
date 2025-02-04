using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.Forms;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A picker for emoji.
/// </summary>
[method: DynamicDependency(DynamicallyAccessedMemberTypes.All, typeof(ValueChangeEventArgs))]
public partial class EmojiInput() : PickerComponentBase<string>
{
    /// <summary>
    /// When this is <see langword="true"/>, the button displays an icon rather than the current
    /// selected emoji.
    /// </summary>
    [Parameter] public bool IconButton { get; set; }

    /// <inheritdoc/>
    protected override string? FormatValueAsString(string? value) => value;

    private void OnValueChange(ValueChangeEventArgs e)
    {
        if (!IsNested
            && string.CompareOrdinal(e.Value, CurrentValue) != 0)
        {
            EvaluateDebounced();
        }

        CurrentValue = e.Value;
        StateHasChanged();
    }
}