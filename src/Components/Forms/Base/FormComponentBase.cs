using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;
using System.Linq.Expressions;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for form components.
/// </summary>
public abstract class FormComponentBase<TValue> : ComponentBase, IDisposable, IFormComponent
{
    private class DummyClass<T>
    {
        public T? This_field { get; set; }
    }

    private readonly EventHandler<ValidationStateChangedEventArgs> _validationStateChangedHandler;
    private readonly AsyncAdjustableTimer _timer;

    private List<string>? _customValidationMessages;
    private bool _hasInitializedParameters;
    private bool _disposedValue;
    private DummyClass<TValue>? _dummyModel;
    private bool _initialParametersSet;
    private Type? _nullableUnderlyingType;
    private bool _previousParsingAttemptFailed;
    private ValidationMessageStore? _parsingValidationMessages;
    private ValidationMessageStore? _requiredValidationMessages;

    /// <summary>
    /// Custom HTML attributes for the component.
    /// </summary>
    [Parameter(CaptureUnmatchedValues = true)]
    public IReadOnlyDictionary<string, object>? AdditionalAttributes { get; set; }

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
    /// The validation message displayed when this field's <see cref="Value"/>
    /// cannot be converted to or from its string representation.
    /// </para>
    /// <para>
    /// Default is "{DisplayName} could not be converted".
    /// </para>
    /// </summary>
    [Parameter] public virtual string ConversionValidationMessage { get; set; } = "{0} could not be converted";

    /// <summary>
    /// <para>
    /// Gets or sets the display name for this field.
    /// </para>
    /// <para>
    /// This value is used when generating error messages when the input value fails to parse
    /// correctly.
    /// </para>
    /// </summary>
    [Parameter] public string? DisplayName { get; set; }

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
    /// Gets or sets the value of the input. This should be used with two-way binding.
    /// </summary>
    /// <example>
    /// @bind-Value="model.PropertyName"
    /// </example>
    [Parameter] public TValue? Value { get; set; }

    /// <summary>
    /// Gets or sets a callback that updates the bound value.
    /// </summary>
    [Parameter] public EventCallback<TValue> ValueChanged { get; set; }

    /// <summary>
    /// Gets or sets an expression that identifies the bound value.
    /// </summary>
    [Parameter] public Expression<Func<TValue>>? ValueExpression { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component values and anything
    /// assigned by the user in <see cref="AdditionalAttributes"/>.
    /// </summary>
    protected virtual string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("form-field")
        .Add("modified", IsTouched)
        .Add("valid", IsValid)
        .Add("invalid", IsInvalidAndTouched)
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component values and anything
    /// assigned by the user in <see cref="AdditionalAttributes"/>.
    /// </summary>
    protected virtual string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Gets or sets the current value of the input.
    /// </summary>
    protected TValue? CurrentValue
    {
        get => Value;
        set
        {
            var hasChanged = !EqualityComparer<TValue>.Default.Equals(value, Value);
            if (hasChanged)
            {
                Value = value;
                _ = ValueChanged.InvokeAsync(Value);

                // EditContext may be null if the input is not a child component of EditForm.
                if (EditContext is not null)
                {
                    if (Required)
                    {
                        if (HasValue)
                        {
                            if (_requiredValidationMessages?[FieldIdentifier].Any() == true)
                            {
                                _requiredValidationMessages.Clear(FieldIdentifier);
                                EditContext.NotifyValidationStateChanged();
                            }
                        }
                        else if (!string.IsNullOrEmpty(RequiredValidationMessage))
                        {
                            var validationErrorMessage = GetRequiredValidationMessage() ?? "Field is required";
                            _requiredValidationMessages ??= new ValidationMessageStore(EditContext);
                            _requiredValidationMessages.Add(FieldIdentifier, validationErrorMessage);
                            EditContext.NotifyValidationStateChanged();
                        }
                    }

                    EditContext.NotifyFieldChanged(FieldIdentifier);
                }
            }
        }
    }

    /// <summary>
    /// Gets or sets the current value of the input, represented as a string.
    /// </summary>
    protected string? CurrentValueAsString
    {
        get => FormatValueAsString(CurrentValue);
        set
        {
            _parsingValidationMessages?.Clear();

            bool parsingFailed;

            if (_nullableUnderlyingType != null && string.IsNullOrEmpty(value))
            {
                // Assume if it's a nullable type, null/empty inputs should correspond to default(T)
                // Then all subclasses get nullable support almost automatically (they just have to
                // not reject Nullable<T> based on the type itself).
                parsingFailed = false;
                CurrentValue = default!;
            }
            else if (TryParseValueFromString(value, out var parsedValue, out var validationErrorMessage))
            {
                parsingFailed = false;
                CurrentValue = parsedValue!;
            }
            else
            {
                parsingFailed = true;

                // EditContext may be null if the input is not a child component of EditForm.
                if (EditContext is not null)
                {
                    _parsingValidationMessages ??= new ValidationMessageStore(EditContext);
                    _parsingValidationMessages.Add(FieldIdentifier, validationErrorMessage);

                    // Since we're not writing to CurrentValue, we'll need to notify about modification from here
                    EditContext.NotifyFieldChanged(FieldIdentifier);
                }
            }

            // We can skip the validation notification if we were previously valid and still are
            if (parsingFailed || _previousParsingAttemptFailed)
            {
                EditContext?.NotifyValidationStateChanged();
                _previousParsingAttemptFailed = parsingFailed;
            }
        }
    }

    [CascadingParameter] private EditContext? CascadedEditContext { get; set; }

    /// <summary>
    /// Gets the associated <see cref="Microsoft.AspNetCore.Components.Forms.EditContext"/>. This
    /// property is uninitialized if the input does not have a parent <see cref="Framework.Form"/>
    /// or <see cref="EditForm"/>.
    /// </summary>
    protected EditContext EditContext { get; set; } = default!;

    /// <summary>
    /// Gets the <see cref="Microsoft.AspNetCore.Components.Forms.FieldIdentifier"/> for the bound
    /// value.
    /// </summary>
    protected internal FieldIdentifier FieldIdentifier { get; set; }

    /// <summary>
    /// <para>
    /// Whether this component is nested within a larger input.
    /// </para>
    /// <para>
    /// Nested components are not validated.
    /// </para>
    /// </summary>
    [CascadingParameter] private protected bool IsNested { get; set; }

    private protected bool IsInvalidAndTouched => !IsValid && IsTouched;

    [CascadingParameter] private Form? Form { get; set; }

    /// <summary>
    /// Constructs a new instance of <see cref="FormComponentBase{TValue}"/>.
    /// </summary>
    protected FormComponentBase()
    {
        _timer = new(OnTimerAsync, 300);
        _validationStateChangedHandler = OnValidateStateChanged;
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        if (ValueExpression is null)
        {
            _dummyModel = new();
            ValueExpression = () => _dummyModel.This_field!;
        }

        parameters.SetParameterProperties(this);

        if (!_hasInitializedParameters)
        {
            // This is the first run
            // Could put this logic in OnInit, but its nice to avoid forcing people who override OnInit to call base.OnInit()

            if (ValueExpression is null)
            {
                throw new InvalidOperationException($"{GetType()} requires a value for the 'ValueExpression' parameter. Normally this is provided automatically when using 'bind-Value'.");
            }

            FieldIdentifier = FieldIdentifier.Create(ValueExpression);

            if (CascadedEditContext is not null)
            {
                EditContext = CascadedEditContext;
                EditContext.OnValidationStateChanged += _validationStateChangedHandler;
            }

            _nullableUnderlyingType = Nullable.GetUnderlyingType(typeof(TValue));
            _hasInitializedParameters = true;
        }
        else if (CascadedEditContext != EditContext)
        {
            // Not the first run

            // We don't support changing EditContext because it's messy to be clearing up state and event
            // handlers for the previous one, and there's no strong use case. If a strong use case
            // emerges, we can consider changing this.
            throw new InvalidOperationException($"{GetType()} does not support changing the {nameof(EditContext)} dynamically.");
        }

        UpdateAdditionalValidationAttributes();

        await base.SetParametersAsync(ParameterView.Empty);

        if (!_initialParametersSet)
        {
            InitialValue = Value;
            _initialParametersSet = true;

            // Set initial required validation
            if (EditContext is not null
                && Required
                && !HasValue
                && !string.IsNullOrEmpty(RequiredValidationMessage))
            {
                var validationErrorMessage = GetRequiredValidationMessage() ?? "Field is required";
                _requiredValidationMessages ??= new ValidationMessageStore(EditContext);
                _requiredValidationMessages.Add(FieldIdentifier, validationErrorMessage);
                EditContext.NotifyValidationStateChanged();
            }

            await ValidateAsync();
        }
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
    void IDisposable.Dispose()
    {
        // When initialization in the SetParametersAsync method fails, the EditContext property can remain equal to null
        if (EditContext is not null)
        {
            EditContext.OnValidationStateChanged -= _validationStateChangedHandler;
        }

        Dispose(disposing: true);
        GC.SuppressFinalize(this);
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
    public async Task ValidateAsync()
    {
        var value = Value;

        var valid = EditContext?
            .GetValidationMessages(FieldIdentifier)
            .Any() != true;

        valid = valid
            && !HasConversionError
            && (!Required || HasValue);

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

        if (EditContext is null
            && Required
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
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _timer.Dispose();
                Form?.Remove(this);
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Formats the value as a string. Derived classes can override this to determine the formating
    /// used for <see cref="CurrentValueAsString"/>.
    /// </summary>
    /// <param name="value">The value to format.</param>
    /// <returns>A string representation of the value.</returns>
    protected virtual string? FormatValueAsString(TValue? value) => value?.ToString();

    /// <summary>
    /// Parses a string to create an instance of <typeparamref name="TValue"/>. Derived classes can
    /// override this to change how <see cref="CurrentValueAsString"/> interprets incoming values.
    /// </summary>
    /// <param name="value">The string value to be parsed.</param>
    /// <param name="result">An instance of <typeparamref name="TValue"/>.</param>
    /// <param name="validationErrorMessage">If the value could not be parsed, provides a validation
    /// error message.</param>
    /// <returns>True if the value could be parsed; otherwise false.</returns>
    protected virtual bool TryParseValueFromString(
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

    /// <summary>
    /// Returns a dictionary with the same values as the specified <paramref name="source"/>.
    /// </summary>
    /// <returns>
    /// <see langword="true"/>, if a new dictionary with copied values was created; otherwise <see
    /// langword="false"/>.
    /// </returns>
    private static bool ConvertToDictionary(IReadOnlyDictionary<string, object>? source, out Dictionary<string, object> result)
    {
        var newDictionaryCreated = true;
        if (source is null)
        {
            result = new Dictionary<string, object>();
        }
        else if (source is Dictionary<string, object> currentDictionary)
        {
            result = currentDictionary;
            newDictionaryCreated = false;
        }
        else
        {
            result = new Dictionary<string, object>();
            foreach (var item in source)
            {
                result.Add(item.Key, item.Value);
            }
        }

        return newDictionaryCreated;
    }

    private protected void EvaluateDebounced()
    {
        if (!_disposedValue)
        {
            _timer.Start();
        }
    }

    private protected string GetConversionValidationMessage()
        => string.Format(ConversionValidationMessage, DisplayName ?? FieldIdentifier.FieldName.ToHumanReadable());

    private string? GetRequiredValidationMessage() => string.IsNullOrEmpty(RequiredValidationMessage)
        ? null
        : string.Format(RequiredValidationMessage, DisplayName ?? FieldIdentifier.FieldName.ToHumanReadable());

    private Task OnTimerAsync() => InvokeAsync(ValidateAsync);

    private void OnValidateStateChanged(object? sender, ValidationStateChangedEventArgs e)
    {
        UpdateAdditionalValidationAttributes();

        if (!IsNested && EditContext is not null)
        {
            EvaluateDebounced();
        }

        StateHasChanged();
    }

    private void UpdateAdditionalValidationAttributes()
    {
        if (EditContext is null)
        {
            return;
        }

        var hasAriaInvalidAttribute = AdditionalAttributes?.ContainsKey("aria-invalid") == true;
        if (EditContext.GetValidationMessages(FieldIdentifier).Any())
        {
            if (hasAriaInvalidAttribute)
            {
                // Do not overwrite the attribute value
                return;
            }

            if (ConvertToDictionary(AdditionalAttributes, out var additionalAttributes))
            {
                AdditionalAttributes = additionalAttributes;
            }

            // To make the `Input` components accessible by default
            // we will automatically render the `aria-invalid` attribute when the validation fails
            // value must be "true" see https://www.w3.org/TR/wai-aria-1.1/#aria-invalid
            additionalAttributes["aria-invalid"] = "true";
        }
        else if (hasAriaInvalidAttribute)
        {
            // No validation errors. Need to remove `aria-invalid` if it was rendered already

            if (AdditionalAttributes!.Count == 1)
            {
                // Only aria-invalid argument is present which we don't need any more
                AdditionalAttributes = null;
            }
            else
            {
                if (ConvertToDictionary(AdditionalAttributes, out var additionalAttributes))
                {
                    AdditionalAttributes = additionalAttributes;
                }

                additionalAttributes.Remove("aria-invalid");
            }
        }
    }
}
