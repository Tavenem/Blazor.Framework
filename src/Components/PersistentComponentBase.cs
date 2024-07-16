using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// The base class for components in this library which can persist state information in the query
/// string.
/// </summary>
public abstract class PersistentComponentBase : TavenemComponentBase, IDisposable
{
    private const string _defaultId = "uninitialized";

    private protected bool _disposedValue;

    /// <summary>
    /// <para>
    /// The <c>id</c> of the HTML element.
    /// </para>
    /// <para>
    /// A generated value will be assigned if none is supplied (including through splatted
    /// attributes).
    /// </para>
    /// </summary>
    /// <remarks>
    /// <para>
    /// For the <see cref="PersistState"/> mechanism to operate well, this component should have a
    /// stable, unique <see cref="Id"/>. The default generated <see cref="Id"/> makes an attempt to
    /// be reasonably unique and semi-stable across page loads for the same version of an app, but
    /// any code changes present a strong risk that the auto-generated <see cref="Id"/> will change.
    /// In some scenarios even different page views of the same app version can result in different
    /// <see cref="Id"/> values. In either case, all saved queries would become invalid, and result
    /// in unexpected state when revisiting saved URLs with state information in the query.
    /// </para>
    /// <para>
    /// To avoid this problem, the <see cref="Id"/> should be manually assigned a stable, unique
    /// value.
    /// </para>
    /// </remarks>
    [Parameter] public string Id { get; set; } = _defaultId;

    /// <summary>
    /// <para>
    /// Whether this component should automatically persist its open/closed state in a query string
    /// parameter.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// <para>
    /// If the component persists its state, the query string of the current page will be updated
    /// whenever the component's state changes. When the component is in its default state
    /// (determined by its initial values) the query string will not contain any data for this
    /// component. When its state is anything but the default, the query string will contain
    /// information necessary to restore the component to its current state.
    /// </para>
    /// <para>
    /// This mechanism allows the component's state to persist through page refreshes, and even
    /// supports bookmarking or sharing links to a page in which the component's state is preserved.
    /// </para>
    /// <para>
    /// For this mechanism to operate well, the component should have a unique <see cref="Id"/>. The
    /// default <see cref="Id"/> value makes an attempt to be both unique and semi-stable, but any
    /// code changes present a strong risk that the auto-generated <see cref="Id"/> will change,
    /// making all saved queries invalid. At best they will refer to nonexistent components, and
    /// components will simply take their default values. But it is not unlikely that new generated
    /// <see cref="Id"/> values will collide with old values, resulting in a completely different
    /// page state than what was intended when a query was saved. To avoid this issue, the <see
    /// cref="Id"/> should be manually overridden with a stable, unique value.
    /// </para>
    /// </remarks>
    [Parameter] public virtual bool PersistState { get; set; }

    /// <summary>
    /// The <see cref="Framework.QueryStateService"/>.
    /// </summary>
    [Inject, NotNull] protected QueryStateService? QueryStateService { get; set; }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        parameters.SetParameterProperties(this);
        if (string.IsNullOrEmpty(Id)
            || string.Equals(Id, _defaultId))
        {
            if (AdditionalAttributes?.TryGetValue("id", out var value) == true
                && value is string id
                && !string.IsNullOrWhiteSpace(id))
            {
                Id = id;
            }
            else
            {
                Id = IdService.GenerateId(GetType().Name);
            }
        }
        await base.SetParametersAsync(parameters);
    }

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
                QueryStateService.RemoveComponent(Id);
            }

            _disposedValue = true;
        }
    }
}
