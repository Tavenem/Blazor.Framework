using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// THe base class for most components in this library.
/// </summary>
public abstract class TavenemComponentBase : ComponentBase
{
    /// <summary>
    /// Custom CSS class(es) for the component.
    /// </summary>
    [Parameter] public string? Class { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the component.
    /// </summary>
    [Parameter] public string? Style { get; set; }

    /// <summary>
    /// Custom HTML attributes for the component.
    /// </summary>
    [Parameter(CaptureUnmatchedValues = true)]
    public Dictionary<string, object> UserAttributes { get; set; } = new Dictionary<string, object>();
}
