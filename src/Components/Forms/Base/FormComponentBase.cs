using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for form components.
/// </summary>
public abstract class FormComponentBase<TValue> : InputBase<TValue>, IFormComponent
{
    /// <summary>
    /// The model to which unbound form components are bound.
    /// </summary>
    private protected class FormComponentBaseDefaultModelClass<T>
    {
        /// <summary>
        /// A field to which the form component will bind.
        /// </summary>
        public T? This_field { get; set; }
    }

    private readonly AsyncAdjustableTimer _timer;
    private readonly AsyncAdjustableTimer _touchedTimer;

    private protected FormComponentBaseDefaultModelClass<TValue>? _dummyModel;
    private List<string>? _customValidationMessages;
    private bool _disposedValue;
    private string? _incomingValueBeforeParsing;
    private bool _initialParametersSet;
    private bool _parsingFailed;
    private ValidationMessageStore? _parsingValidationMessages;
    private bool _previousParsingAttemptFailed;
    private ValidationMessageStore? _requiredValidationMessages;

    /// <summary>
    /// Whether this input should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

    /// <summary>
    /// The child content of this component.
    /// </summary>
    [Parameter] public RenderFragment? ChildContent { get; set; }

    /// <summary>
    /// Custom CSS class(es) for the component.
    /// </summary>
    [Parameter] public string? Class { get; set; }

    /// <summary>
    /// Whether the input is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// A reference to the input element.
    /// </summary>
    public virtual ElementReference ElementReference { get; set; }

    /// <summary>
    /// <para>
    /// The id of the input element.
    /// </para>
    /// <para>
    /// A random id will be assigned if none is supplied (including through
    /// splatted attributes).
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

    /// <summary>
    /// The name of the input element.
    /// </summary>
    [Parameter] public virtual string? Name { get; set; }

    /// <summary>
    /// Whether the input is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

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
    /// Custom CSS class(es) for the inner input element (may be a hidden element).
    /// </summary>
    [Parameter] public string? InputClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the inner input element (may be a hidden element).
    /// </summary>
    [Parameter] public string? InputStyle { get; set; }

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
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

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
    [Parameter] public string? RequiredValidationMessage { get; set; } = "{0} is required";

    /// <summary>
    /// The tabindex of the input element.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

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
    protected new virtual string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("field")
        .Add("disabled", Disabled)
        .Add("read-only", ReadOnly)
        .Add("required", Required)
        .Add("no-label", string.IsNullOrEmpty(Label))
        .Add("modified", IsTouched)
        .Add("valid", IsValid)
        .Add("invalid", IsInvalidAndTouched)
        .Add(EffectiveThemeColor.ToCSS())
        .ToString();

    /// <summary>
    /// The final value assigned to the style attribute, including component values and anything
    /// assigned by the user in <see cref="InputBase{TValue}.AdditionalAttributes"/>.
    /// </summary>
    protected virtual string? CssStyle => new CssBuilder(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Gets or sets the current value of the input.
    /// </summary>
    protected new TValue? CurrentValue
    {
        get => Value;
        set
        {
            var hasChanged = !EqualityComparer<TValue>.Default.Equals(value, Value);
            if (hasChanged)
            {
                _parsingFailed = false;

                var wasTouched = IsTouched;

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

                if (!wasTouched && IsTouched)
                {
                    _ = IsTouchedChanged.InvokeAsync(true);
                }
            }
        }
    }

    /// <summary>
    /// Gets or sets the current value of the input, represented as a string.
    /// </summary>
    protected new string? CurrentValueAsString
    {
        get => _parsingFailed ? _incomingValueBeforeParsing : FormatValueAsString(CurrentValue);
        set
        {
            _incomingValueBeforeParsing = value;
            _parsingValidationMessages?.Clear();

            var previousValue = CurrentValue;

            if (NullableUnderlyingType != null && string.IsNullOrEmpty(value))
            {
                // Assume if it's a nullable type, null/empty inputs should correspond to default(T)
                // Then all subclasses get nullable support almost automatically (they just have to
                // not reject Nullable<T> based on the type itself).
                _parsingFailed = false;
                CurrentValue = default!;
            }
            else if (TryParseValueFromString(value, out var parsedValue, out var validationErrorMessage))
            {
                _parsingFailed = false;
                CurrentValue = parsedValue!;
            }
            else
            {
                _parsingFailed = true;

                // EditContext may be null if the input is not a child component of EditForm.
                if (EditContext is not null)
                {
                    _parsingValidationMessages ??= new ValidationMessageStore(EditContext);
                    _parsingValidationMessages.Add(FieldIdentifier, validationErrorMessage);

                    // Since we're not writing to CurrentValue, we'll need to notify about modification from here
                    EditContext.NotifyFieldChanged(FieldIdentifier);
                }
            }

            if (!_parsingFailed)
            {
                if (!IsNested
                    && (HasConversionError
                    || !EqualityComparer<TValue>.Default.Equals(previousValue, CurrentValue)))
                {
                    EvaluateDebounced();
                }

                if (!IsTouched
                    && (!EqualityComparer<TValue>.Default.Equals(CurrentValue, InitialValue)
                    || HasConversionError))
                {
                    SetTouchedDebounced();
                }
            }

            // We can skip the validation notification if we were previously valid and still are
            if (_parsingFailed || _previousParsingAttemptFailed)
            {
                EditContext?.NotifyValidationStateChanged();
                _previousParsingAttemptFailed = _parsingFailed;
            }
        }
    }

    /// <summary>
    /// The final <see cref="Framework.ThemeColor"/> for this element.
    /// </summary>
    protected virtual ThemeColor EffectiveThemeColor => ThemeColor;

    /// <summary>
    /// The <see cref="Framework.Form"/> in which this component is located.
    /// </summary>
    [CascadingParameter] protected Form? Form { get; set; }

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected virtual string? InputCssClass => InputClass;

    /// <summary>
    /// The final value assigned to the input element's style attribute.
    /// </summary>
    protected virtual string? InputCssStyle => InputStyle;

    /// <summary>
    /// <para>
    /// Whether this component is nested within a larger input.
    /// </para>
    /// <para>
    /// Nested components are not validated.
    /// </para>
    /// </summary>
    [CascadingParameter] protected bool IsNested { get; set; }

    /// <summary>
    /// Whether the control is being rendered interactively.
    /// </summary>
    protected bool IsInteractive { get; set; }

    /// <summary>
    /// Whether this field is currently invalid and has been changed.
    /// </summary>
    protected bool IsInvalidAndTouched => !IsValid && IsTouched;

    /// <summary>
    /// The final value to be assigned to the HTML input element's <c>name</c> attribute.
    /// </summary>
    protected string NameValue => Name ?? NameAttributeValue;

    /// <summary>
    /// The underlying type of this input, if <typeparamref name="TValue"/> is a nullable type.
    /// </summary>
    protected Type? NullableUnderlyingType { get; private set; }

    /// <summary>
    /// Constructs a new instance of <see cref="FormComponentBase{TValue}"/>.
    /// </summary>
    protected FormComponentBase()
    {
        _timer = new(OnTimerAsync, 300);
        _touchedTimer = new(OnTouchedTimerAsync, 500);
    }

    /// <inheritdoc/>
    public override async Task SetParametersAsync(ParameterView parameters)
    {
        var wasRequired = Required;

        if (ValueExpression is null)
        {
            _dummyModel = new();
            ValueExpression = () => _dummyModel.This_field!;
        }

        var hasNewValue = parameters.TryGetValue<TValue>(
            nameof(Value),
            out var value)
            && ((value is null) != (Value is null)
                || value?.Equals(Value) == false);

        await base.SetParametersAsync(parameters);

        if (!_initialParametersSet)
        {
            InitialValue = Value;
            _initialParametersSet = true;

            NullableUnderlyingType = Nullable.GetUnderlyingType(typeof(TValue));

            // Set initial required validation
            if (EditContext is not null)
            {
                if (!IsNested)
                {
                    EditContext.OnValidationStateChanged += OnValidateStateChanged;
                }

                if (Required
                    && !HasValue
                    && !string.IsNullOrEmpty(RequiredValidationMessage))
                {
                    var validationErrorMessage = GetRequiredValidationMessage() ?? "Field is required";
                    _requiredValidationMessages ??= new ValidationMessageStore(EditContext);
                    _requiredValidationMessages.Add(FieldIdentifier, validationErrorMessage);
                    EditContext.NotifyValidationStateChanged();
                }
            }

            await ValidateAsync();
        }
        else if (wasRequired != Required
            || hasNewValue)
        {
            // respond to external changes in status
            if (EditContext is not null)
            {
                if (Required)
                {
                    if (HasValue)
                    {
                        if (_requiredValidationMessages?[FieldIdentifier].Any() == true)
                        {
                            _requiredValidationMessages.Clear(FieldIdentifier);
                        }
                    }
                    else if (!string.IsNullOrEmpty(RequiredValidationMessage))
                    {
                        var validationErrorMessage = GetRequiredValidationMessage() ?? "Field is required";
                        _requiredValidationMessages ??= new ValidationMessageStore(EditContext);
                        _requiredValidationMessages.Add(FieldIdentifier, validationErrorMessage);
                    }
                }
                else if (_requiredValidationMessages?[FieldIdentifier].Any() == true)
                {
                    _requiredValidationMessages.Clear(FieldIdentifier);
                }
                EditContext.NotifyValidationStateChanged();
            }
            await ValidateAsync();
        }
    }

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes?.TryGetValue("id", out var value) == true
            && value is string id
            && !string.IsNullOrWhiteSpace(id))
        {
            Id = id;
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
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            IsInteractive = true;
            StateHasChanged();
        }
    }

    /// <summary>
    /// Focuses this input.
    /// </summary>
    public virtual async Task FocusAsync() => await ElementReference.FocusAsync();

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
        EditContext.MarkAsUnmodified(FieldIdentifier);
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
    /// Clears the modification flag for this form component.
    /// </summary>
    public void MarkAsUnmodified()
    {
        IsTouched = false;
        EditContext?.MarkAsUnmodified(FieldIdentifier);
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
                _touchedTimer.Dispose();
                if (!IsNested && EditContext is not null)
                {
                    EditContext.OnValidationStateChanged -= OnValidateStateChanged;
                }
                Form?.Remove(this);
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Starts the evaluation timer.
    /// </summary>
    protected void EvaluateDebounced()
    {
        if (!_disposedValue)
        {
            _timer.Start();
        }
    }

    /// <summary>
    /// Gets a formatted conversion validation message.
    /// </summary>
    /// <returns>
    /// <see cref="ConversionValidationMessage"/>, supplied with <see
    /// cref="InputBase{TValue}.DisplayName"/> (or the field name, if <see
    /// cref="InputBase{TValue}.DisplayName"/> is unset) as a parameter.
    /// </returns>
    protected string GetConversionValidationMessage()
        => string.Format(ConversionValidationMessage, DisplayName ?? FieldIdentifier.FieldName.ToHumanReadable());

    /// <summary>
    /// Starts the touch timer.
    /// </summary>
    protected void SetTouchedDebounced()
    {
        if (!_disposedValue)
        {
            _touchedTimer.Start();
        }
    }

    /// <inheritdoc />
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

        return success;
    }

    private string? GetRequiredValidationMessage() => string.IsNullOrEmpty(RequiredValidationMessage)
        ? null
        : string.Format(RequiredValidationMessage, DisplayName ?? FieldIdentifier.FieldName.ToHumanReadable());

    private Task OnTimerAsync() => InvokeAsync(ValidateAsync);

    private Task OnTouchedTimerAsync() => InvokeAsync(SetTouchedAsync);

    private void OnValidateStateChanged(object? sender, ValidationStateChangedEventArgs e)
    {
        if (!IsNested)
        {
            EvaluateDebounced();
        }
    }

    private protected async Task SetTouchedAsync()
    {
        IsTouched = true;
        await IsTouchedChanged.InvokeAsync(true);
    }
}
