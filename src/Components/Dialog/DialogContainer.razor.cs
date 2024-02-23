using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Provides support for displaying <see cref="Dialog"/>s when not using the <see
/// cref="FrameworkLayout"/> component.
/// </summary>
public partial class DialogContainer : IDisposable
{
    private readonly Collection<DialogReference> _dialogs = [];

    private bool _disposedValue;

    [Inject, NotNull] private DialogService? DialogService { get; set; }

    [Inject, NotNull] private NavigationManager? NavigationManager { get; set; }

    /// <inheritdoc />
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            DialogService.OnDialogAdded += OnDialogAdded;
            DialogService.OnDialogClosed += DismissDialogInstance;
            NavigationManager.LocationChanged += OnLocationChanged;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Dismisses all open dialogs.
    /// </summary>
    public void DismissAllDialogs()
    {
        _dialogs
            .ToList()
            .ForEach(dialog => DismissDialogInstance(dialog, DialogResult.DefaultCancel));
        StateHasChanged();
    }

    internal void DismissDialogInstance(string id, DialogResult? result = null)
    {
        var reference = GetDialogReference(id);
        if (reference is not null)
        {
            DismissDialogInstance(reference, result);
        }
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
                NavigationManager.LocationChanged -= OnLocationChanged;
            }

            _disposedValue = true;
        }
    }

    private void DismissDialogInstance(DialogReference dialog, DialogResult? result = null)
    {
        dialog.Dismiss(result);
        _dialogs.Remove(dialog);
        StateHasChanged();
    }

    private DialogReference? GetDialogReference(string id) => _dialogs
        .SingleOrDefault(x => x.Id == id);

    private void OnDialogAdded(DialogReference reference)
    {
        _dialogs.Add(reference);
        StateHasChanged();
    }

    private void OnLocationChanged(object? _, LocationChangedEventArgs args)
        => DismissAllDialogs();
}