using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A step in a <see cref="Steps"/> component.
/// </summary>
public class Step : TavenemComponentBase, IDisposable
{
    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// Whether this step is disabled.
    /// </para>
    /// <para>
    /// A disabled step cannot be activated using the UI, but <i>can</i> be activated
    /// programmatically.
    /// </para>
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// <para>
    /// Whether this step is currently active.
    /// </para>
    /// <para>
    /// Only one step in a <see cref="Steps"/> component can be active at a given time.
    /// </para>
    /// </summary>
    [Parameter] public bool IsActive { get; set; }

    /// <summary>
    /// Raised when this step's active state changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsActiveChanged { get; set; }

    /// <summary>
    /// <para>
    /// Whether this step is currently visible.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// <para>
    /// An invisible step does not appear in the <see cref="Steps"/> component's selection list and
    /// cannot be activated using the UI, but it <em>can</em> be activated programmatically. If it
    /// is made active, its title will appear in the selection list.
    /// </para>
    /// </summary>
    [Parameter] public bool IsVisible { get; set; } = true;

    /// <summary>
    /// The title of this step. Optional.
    /// </summary>
    [Parameter] public string? Title { get; set; }

    /// <summary>
    /// This step's parent <see cref="Steps"/> component.
    /// </summary>
    [CascadingParameter] protected Steps? Parent { get; set; }

    /// <inheritdoc />
    protected override void OnInitialized()
        => Parent?.AddStep(this);

    /// <inheritdoc />
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var refresh = (parameters.TryGetValue<bool>(nameof(Disabled), out var disabled)
            && disabled != Disabled)
            || (parameters.TryGetValue<bool>(nameof(IsActive), out var isActive)
            && isActive != IsActive)
            || (parameters.TryGetValue<bool>(nameof(IsVisible), out var isVisible)
            && isVisible != IsVisible)
            || (parameters.TryGetValue<string>(nameof(Title), out var title)
            && !string.Equals(title, Title));

        await base.SetParametersAsync(parameters);

        if (refresh)
        {
            Parent?.Refresh();
        }
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    internal async Task ActivateAsync(bool value)
    {
        IsActive = value;
        await IsActiveChanged.InvokeAsync(value);
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                Parent?.RemoveStep(this);
            }

            _disposedValue = true;
        }
    }
}