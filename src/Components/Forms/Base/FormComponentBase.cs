using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for form components.
/// </summary>
public abstract class FormComponentBase<TValue> : InputBase<TValue>, IFormComponent
{
    private class DummyClass<T>
    {
        public T? This_field { get; set; }
    }

    private readonly AsyncAdjustableTimer _timer;

    private List<string>? _customValidationMessages;
    private bool _disposedValue;
    private DummyClass<TValue>? _dummyModel;
    private bool _initialParametersSet;

    /// <summary>
    /// Custom CSS class(es) for the component.
    /// </summary>
    [Parameter] public string? Class { get; set; }

    /// <summary>
    /// The name of the input element.
    /// </summary>
    [Parameter] public virtual string? Name { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the component.
    /// </summary>
    [Parameter] public string? Style { get; set; }

    /// <summary>
    /// <para>
    /// The validation message displayed when this field's <see cref="InputBase{TValue}.Value"/>
    /// cannot be converted to or from its string representation.
    /// </para>
    /// <para>
    /// Default is "{DisplayName} could not be converted".
    /// </para>
    /// </summary>
    [Parameter] public virtual string ConversionValidationMessage { get; set; } = "{0} could not be converted";

    /// <summary>
    /// Whether the current value of the HTML input failed to convert to or from the bound data
    /// type.
    /// </summary>
    public bool HasConversionError { get; set; }

    /// <summary>
    /// Whether this field currently has a non-empty value.
    /// </summary>
    public virtual bool HasValue => !string.IsNullOrEmpty(CurrentValueAsString);

    /// <summary>
    /// The initial value of this input.
    /// </summary>
    public TValue? InitialValue { get; private set; }

    /// <summary>
    /// Whether this field's value has been changed.
    /// </summary>
    [Parameter] public bool IsTouched { get; set; }

    /// <summary>
    /// Invoked when <see cref="IsTouched"/> changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsTouchedChanged { get; set; }

    /// <summary>
    /// Whether this field is currently valid.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Setting this property overrides the calculated value based on validation rules.
    /// </para>
    /// </remarks>
    [Parameter] public bool IsValid { get; set; } = true;

    /// <summary>
    /// Invoked when <see cref="IsValid"/> changes.
    /// </summary>
    [Parameter] public EventCallback<bool> IsValidChanged { get; set; }

    /// <summary>
    /// Whether this field is required.
    /// </summary>
    [Parameter] public bool Required { get; set; }

    /// <summary>
    /// <para>
    /// The validation message displayed if this field is <see cref="Required"/> but no value is
    /// present, when <see cref="IsTouched"/> is <see langword="true"/>.
    /// </para>
    /// <para>
    /// Default is "{DisplayName} is required".
    /// </para>
    /// <para>
    /// Override with <see langword="null"/> if another validation method provides its own
    /// "required" message.
    /// </para>
    /// </summary>
    [Parameter]
    public string? RequiredValidationMessage { get; set; } = "{0} is required";

    /// <summary>
    /// <para>
    /// Optionally provides validation logic for the field.
    /// </para>
    /// <para>
    /// Receives the current value, and the parent form's bound model (if any) as parameters.
    /// </para>
    /// <para>
    /// Should return an enumeration of validation messages.
    /// </para>
    /// </summary>
    [Parameter] public Func<TValue?, object?, IAsyncEnumerable<string>>? Validation { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component values and anything
    /// assigned by the user in <see cref="InputBase{TValue}.AdditionalAttributes"/>.
    /// </summary>
    protected virtual new string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("form-field")
        .Add("modified", IsTouched)
        .Add("valid", IsValid)
        .Add("invalid", !IsValid)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component values and anything
    /// assigned by the user in <see cref="InputBase{TValue}.AdditionalAttributes"/>.
    /// </summary>
    protected virtual string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// <para>
    /// Whether this component is nested within a larger input.
    /// </para>
    /// <para>
    /// Nested components are not validated.
    /// </para>
    /// </summary>
    [CascadingParameter] private protected bool IsNested { get; set; }

    [CascadingParameter] private Form? Form { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="FormComponentBase{TValue}"/>.
    /// </summary>
    protected FormComponentBase() => _timer = new(OnTimerAsync, 300);

    /// <inheritdoc/>
    public override Task SetParametersAsync(ParameterView parameters)
    {
        if (ValueExpression is null)
        {
            _dummyModel = new();
            ValueExpression = () => _dummyModel.This_field!;
        }

        return base.SetParametersAsync(parameters);
    }

    /// <inheritdoc/>
    protected override void OnInitialized()
    {
        if (!IsNested)
        {
            Form?.Add(this);
        }
    }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (!_initialParametersSet)
        {
            InitialValue = Value;
            _initialParametersSet = true;
        }
    }

    /// <summary>
    /// <para>
    /// Resets this field to its initial state.
    /// </para>
    /// <para>
    /// This also resets the field's <see cref="IFormComponent.IsTouched"/> value to <see
    /// langword="false"/>.
    /// </para>
    /// </summary>
    public async Task ResetAsync()
    {
        CurrentValue = InitialValue;

        if (IsTouched)
        {
            IsTouched = false;
            await IsTouchedChanged.InvokeAsync(false);
        }

        StateHasChanged();
    }

    /// <summary>
    /// Performs validation on this field.
    /// </summary>
    /// <remarks>
    /// Required fields without values will be considered invalid even if they have not yet been
    /// touched.
    /// </remarks>
    public Task ValidateAsync() => ValidateAsync(true);

    /// <summary>
    /// <para>
    /// Gets the current validation messages for this field.
    /// </para>
    /// <para>
    /// This method does not perform validation itself. It only returns messages determined by
    /// previous validation actions.
    /// </para>
    /// </summary>
    /// <returns>The current validation messages.</returns>
    public IEnumerable<string> GetValidationMessages()
    {
        if (EditContext is not null)
        {
            foreach (var message in EditContext.GetValidationMessages(FieldIdentifier))
            {
                yield return message;
            }
        }

        if (!IsTouched)
        {
            yield break;
        }

        if (Required
            && !HasValue
            && !string.IsNullOrEmpty(RequiredValidationMessage))
        {
            yield return GetRequiredValidationMessage() ?? "Field is required";
        }

        if (EditContext is null && HasConversionError)
        {
            yield return GetConversionValidationMessage();
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
    /// Performs application-defined tasks associated with freeing, releasing, or resetting
    /// unmanaged resources.
    /// </summary>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _timer.Dispose();
                Form?.Remove(this);
                DetachValidationStateChangedListener();
            }

            _disposedValue = true;
        }
    }

    /// <inheritdoc/>
    protected override bool TryParseValueFromString(
        string? value,
        [MaybeNullWhen(false)] out TValue result,
        [NotNullWhen(false)] out string? validationErrorMessage)
    {
        result = default;
        validationErrorMessage = null;
        var success = false;

        if (typeof(TValue) == typeof(string))
        {
            result = (TValue?)(object?)value ?? default!;
            success = true;
        }
        else
        {
            validationErrorMessage = GetConversionValidationMessage();
        }

        HasConversionError = !success;

        if (!IsTouched
            && (!EqualityComparer<TValue>.Default.Equals(result, InitialValue)
            || HasConversionError))
        {
            IsTouched = true;
            _ = IsTouchedChanged.InvokeAsync(true);
        }

        if (!IsNested
            && (HasConversionError
            || !EqualityComparer<TValue>.Default.Equals(result, CurrentValue)))
        {
            EvaluateDebounced();
        }

        return success;
    }

    private protected void EvaluateDebounced() => _timer.Start();

    private protected string GetConversionValidationMessage()
        => string.Format(ConversionValidationMessage, DisplayName ?? FieldIdentifier.FieldName.ToHumanReadable());

    private void DetachValidationStateChangedListener()
    {
        if (EditContext is not null)
        {
            EditContext.OnValidationStateChanged -= OnValidationStateChanged;
        }
    }

    private string? GetRequiredValidationMessage() => string.IsNullOrEmpty(RequiredValidationMessage)
        ? null
        : string.Format(RequiredValidationMessage, DisplayName ?? FieldIdentifier.FieldName.ToHumanReadable());

    private Task OnTimerAsync() => InvokeAsync(ValidateAutoAsync);

    private void OnValidationStateChanged(object? sender, ValidationStateChangedEventArgs e)
    {
        if (!IsNested && EditContext is not null)
        {
            EvaluateDebounced();
        }
    }

    private async Task ValidateAsync(bool ignoreTouched)
    {
        var value = Value;

        var valid = EditContext?
            .GetValidationMessages(FieldIdentifier)
            .Any() != true;

        valid = valid
            && !HasConversionError
            && ((!ignoreTouched && !IsTouched) || !Required || HasValue);

        var fieldMessages = new List<string>();
        if (Validation is not null)
        {
            await foreach (var error in Validation(Value, Form?.Model ?? EditContext?.Model))
            {
                if (!string.IsNullOrEmpty(error))
                {
                    fieldMessages.Add(error);
                    valid = false;
                }
            }
        }

        var messagesChanged = fieldMessages.Count == 0
            ? (_customValidationMessages?.Count ?? 0) > 0
            : _customValidationMessages?.SequenceEqual(fieldMessages) != true;
        _customValidationMessages = fieldMessages.Count == 0
            ? null
            : fieldMessages;

        if (!EqualityComparer<TValue>.Default.Equals(value, Value))
        {
            return;
        }

        var update = false;
        if (messagesChanged)
        {
            update = true;
            EditContext?.NotifyValidationStateChanged();
        }

        if (IsValid != valid)
        {
            update = true;
            IsValid = valid;
            await IsValidChanged.InvokeAsync(IsValid);
        }

        if (update)
        {
            StateHasChanged();
        }
    }

    private Task ValidateAutoAsync() => ValidateAsync(false);
}
