using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Components.Rendering;
using System.Diagnostics;
using System.Dynamic;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A form which supports flexible validation rules.
/// </summary>
public class Form : EditForm, IDisposable
{
    private readonly List<IFormComponent> _fields = new();
    private readonly Func<Task> _handleSubmitDelegate;
    private readonly AsyncAdjustableTimer _timer;

    private List<string>? _customValidationMessages;
    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// Whether the form's own <see cref="Validation"/> should run each time a field is updated.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>. If <see langword="false"/>, the form as a whole will only
    /// be validated when <see cref="ValidateAsync"/> is invoked manually.
    /// </para>
    /// </summary>
    /// <remarks>
    /// <para>
    /// Validation requests are debounced to avoid excessive calls, but for large forms with many
    /// fields, or any form with a field whose value updates frequently, it might still be necessary
    /// to set this to <see langword="false"/>, especially if <see cref="Validation"/> is an
    /// expensive process.
    /// </para>
    /// </remarks>
    [Parameter] public bool AutoValidate { get; set; } = true;

    /// <summary>
    /// Custom CSS class(es) for the component.
    /// </summary>
    [Parameter] public string? Class { get; set; }

    /// <summary>
    /// Invoked when a field value changes.
    /// </summary>
    [Parameter] public EventCallback<FieldChangedEventArgs> FieldChanged { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the component.
    /// </summary>
    [Parameter] public string? Style { get; set; }

    /// <summary>
    /// <para>
    /// Optionally provides validation logic for the form as a whole.
    /// </para>
    /// <para>
    /// Receives the model object as a parameter, if one exists. The <see cref="EditContext.Model"/>
    /// of the <see cref="EditForm.EditContext"/> will be supplied, if <see
    /// cref="EditForm.EditContext"/> was set rather than <see cref="EditForm.Model"/>.
    /// </para>
    /// <para>
    /// Should return an enumeration of validation messages.
    /// </para>
    /// </summary>
    [Parameter] public Func<object?, IAsyncEnumerable<string>>? Validation { get; set; }

    /// <summary>
    /// Invoked when validation is requested.
    /// </summary>
    [Parameter] public EventCallback<ValidationRequestedEventArgs> ValidationRequested { get; set; }

    /// <summary>
    /// Invoked when validation state has changed.
    /// </summary>
    [Parameter] public EventCallback<ValidationStateChangedEventArgs> ValidationStateChanged { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component values and anything
    /// assigned by the user in <see cref="EditForm.AdditionalAttributes"/>.
    /// </summary>
    protected virtual string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component values and anything
    /// assigned by the user in <see cref="EditForm.AdditionalAttributes"/>.
    /// </summary>
    protected virtual string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// This is the resolved <see cref="EditContext"/>. It will be the <see
    /// cref="EditForm.EditContext"/> parameter if supplied, or a new one otherwise.
    /// </summary>
    protected EditContext? InnerEditContext { get; set; }

    /// <summary>
    /// Constructs an instance of <see cref="Form"/>.
    /// </summary>
    public Form()
    {
        _handleSubmitDelegate = HandleSubmitAsync;
        _timer = new(OnTimerAsync, 300);
    }

    /// <inheritdoc />
    protected override void OnParametersSet()
    {
        if (EditContext is null
            && Model is null)
        {
            if (InnerEditContext is null)
            {
                EditContext = new(new ExpandoObject());
            }
            else
            {
                EditContext = InnerEditContext;
            }
        }

        base.OnParametersSet();

        if (EditContext is null)
        {
            return;
        }

        if (InnerEditContext is null)
        {
            InnerEditContext = EditContext;
            InnerEditContext.OnFieldChanged += Update;
            InnerEditContext.OnValidationRequested += (s, e) => _ = ValidationRequested.InvokeAsync(e);
            InnerEditContext.OnValidationStateChanged += (s, e) => _ = ValidationStateChanged.InvokeAsync(e);
        }
    }

    /// <inheritdoc />
    protected override void BuildRenderTree(RenderTreeBuilder builder)
    {
        Debug.Assert(InnerEditContext is not null);

        builder.OpenRegion(InnerEditContext.GetHashCode());

        builder.OpenElement(0, "form");
        builder.AddMultipleAttributes(1, AdditionalAttributes);
        builder.AddAttribute(2, "onsubmit", _handleSubmitDelegate);
        builder.AddAttribute(3, "class", CssClass);
        builder.AddAttribute(4, "style", CssStyle);

        builder.OpenElement(5, "button");
        builder.AddAttribute(6, "type", "submit");
        builder.AddAttribute(7, "disabled");
        builder.AddAttribute(8, "style", "display:none");
        builder.AddAttribute(9, "aria-hidden", "true");
        builder.CloseElement();

        builder.OpenComponent<CascadingValue<EditContext>>(10);
        builder.AddAttribute(11, "IsFixed", true);
        builder.AddAttribute(12, "Value", InnerEditContext);
        builder.AddAttribute(13, "ChildContent", ChildContent?.Invoke(InnerEditContext));
        builder.CloseComponent();

        builder.CloseElement();

        builder.CloseRegion();
    }

    /// <inheritdoc/>
    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// <para>
    /// Gets the current validation messages across all fields and the form itself.
    /// </para>
    /// <para>
    /// This method does not perform validation itself. It only returns messages determined by
    /// previous validation actions.
    /// </para>
    /// </summary>
    /// <returns>The current validation messages.</returns>
    public IEnumerable<string> GetValidationMessages()
    {
        if (InnerEditContext is not null)
        {
            foreach (var message in InnerEditContext.GetValidationMessages())
            {
                yield return message;
            }
        }

        foreach (var message in _fields.SelectMany(x => x.GetValidationMessages()))
        {
            yield return message;
        }

        if (_customValidationMessages is not null)
        {
            foreach (var message in _customValidationMessages)
            {
                yield return message;
            }
        }
    }

    /// <summary>
    /// Determines whether any of the fields in this form have been modified.
    /// </summary>
    /// <returns>
    /// <see langword="true"/> if any of the fields in this form have been modified; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public bool IsModified()
    {
        if (InnerEditContext?.IsModified() == true)
        {
            return true;
        }

        return _fields.Any(x => x.IsTouched);
    }

    /// <summary>
    /// Clears all modification flags within this form.
    /// </summary>
    public void MarkAsUnmodified()
    {
        InnerEditContext?.MarkAsUnmodified();

        foreach (var field in _fields)
        {
            field.IsTouched = false;
        }
    }

    /// <summary>
    /// <para>
    /// Resets all the <see cref="IFormComponent"/> fields in this form to their initial states.
    /// </para>
    /// <para>
    /// This also resets the fields' <see cref="IFormComponent.IsTouched"/> value to <see
    /// langword="false"/>.
    /// </para>
    /// </summary>
    /// <remarks>
    /// Note: this has no effect on non-<see cref="IFormComponent"/> controls, such as the native
    /// Blazor input components, or components from other libraries.
    /// </remarks>
    public async Task ResetAsync()
    {
        _timer.Cancel();
        await Task.WhenAll(_fields.Select(x => x.ResetAsync()));
    }

    /// <summary>
    /// Validates this form.
    /// </summary>
    /// <returns>
    /// <see langword="true"/> if there are no validation messages after validation; otherwise <see
    /// langword="false"/>.
    /// </returns>
    public async Task<bool> ValidateAsync()
    {
        var valid = InnerEditContext?.GetValidationMessages().Any() != true;

        var formMessages = new List<string>();
        if (Validation is not null)
        {
            await foreach (var error in Validation(Model ?? InnerEditContext?.Model))
            {
                if (!string.IsNullOrEmpty(error))
                {
                    formMessages.Add(error);
                    valid = false;
                }
            }
        }

        var messagesChanged = formMessages.Count == 0
            ? (_customValidationMessages?.Count ?? 0) > 0
            : _customValidationMessages?.SequenceEqual(formMessages) != true;
        _customValidationMessages = formMessages.Count == 0
            ? null
            : formMessages;
        if (messagesChanged)
        {
            await ValidationStateChanged.InvokeAsync(ValidationStateChangedEventArgs.Empty);
        }

        return valid;
    }

    /// <summary>
    /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _timer.Dispose();
                if (InnerEditContext is not null)
                {
                    InnerEditContext.OnFieldChanged -= Update;
                }
            }

            _disposedValue = true;
        }
    }

    internal void Add(IFormComponent formComponent) => _fields.Add(formComponent);

    internal void Remove(IFormComponent formComponent) => _fields.Remove(formComponent);

    internal async void Update(object? sender, FieldChangedEventArgs e)
    {
        await FieldChanged.InvokeAsync(e);

        if (AutoValidate)
        {
            EvaluateDebounced();
        }
    }

    private void EvaluateDebounced() => _timer.Start();

    private async Task HandleSubmitAsync()
    {
        Debug.Assert(InnerEditContext is not null);

        if (OnSubmit.HasDelegate)
        {
            await OnSubmit.InvokeAsync(InnerEditContext);
        }
        else
        {
            var isValid = await ValidateAsync();

            if (isValid && OnValidSubmit.HasDelegate)
            {
                await OnValidSubmit.InvokeAsync(InnerEditContext);
            }

            if (!isValid && OnInvalidSubmit.HasDelegate)
            {
                await OnInvalidSubmit.InvokeAsync(InnerEditContext);
            }
        }
    }

    private Task OnTimerAsync() => InvokeAsync(ValidateAsync);
}