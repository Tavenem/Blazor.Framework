using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A reference to a dialog.
/// </summary>
public class DialogReference
{
    private readonly DialogService _dialogService;
    private readonly TaskCompletionSource<DialogResult> _resultCompletion = new();

    /// <summary>
    /// The result of the dialog.
    /// </summary>
    public Task<DialogResult> Result => _resultCompletion.Task;

    internal bool AreParametersRendered { get; set; }

    internal object? Dialog { get; private set; }

    internal string Id { get; }

    internal RenderFragment? RenderFragment { get; set; }

    internal DialogReference(DialogService dialogService)
    {
        Id = Guid.NewGuid().ToHtmlId();
        _dialogService = dialogService;
    }

    /// <summary>
    /// Close the dialog.
    /// </summary>
    /// <param name="result">
    /// <para>
    /// An optional <see cref="DialogResult"/> to submit as the result of the dialog.
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, a Cancel result will be supplied.
    /// </para>
    /// </param>
    public void Close(DialogResult? result = null) => _dialogService.Close(this, result ?? DialogResult.DefaultCancel);

    internal void Dismiss(DialogResult? result = null) => _resultCompletion.TrySetResult(result ?? DialogResult.DefaultCancel);

    internal void InjectDialog(object component) => Dialog = component;

    internal void InjectRenderFragment(RenderFragment fragment) => RenderFragment = fragment;
}
