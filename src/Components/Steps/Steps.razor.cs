using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A set of <see cref="Step"/> components, one of which is visible at any time.
/// </summary>
public partial class Steps : PersistentComponentBase
{
    private const string CurrentStepQueryParamName = "s";

    private readonly List<Step> _steps = [];

    /// <summary>
    /// <para>
    /// Whether the <see cref="Form"/>'s own <see cref="Form.Validation"/> should run each time a
    /// field is updated.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>. If <see langword="false"/>, the form as a whole will only
    /// be validated when <see cref="Form.ValidateAsync"/> is invoked manually.
    /// </para>
    /// </summary>
    /// <remarks>
    /// <para>
    /// Validation requests are debounced to avoid excessive calls, but for large forms with many
    /// fields, or any form with a field whose value updates frequently, it might still be necessary
    /// to set this to <see langword="false"/>, especially if <see cref="Form.Validation"/> is an
    /// expensive process.
    /// </para>
    /// </remarks>
    [Parameter] public bool AutoValidate { get; set; } = true;

    /// <summary>
    /// Supplies an edit context for the <see cref="Form"/> explicitly. If using this parameter, do
    /// not also supply <see cref="Model"/>, since the model value will be taken from the <see
    /// cref="EditContext.Model"/> property.
    /// </summary>
    [Parameter] public EditContext? EditContext { get; set; }

    /// <summary>
    /// Invoked when a field value within the <see cref="Form"/> changes.
    /// </summary>
    [Parameter] public EventCallback<FieldChangedEventArgs> FieldChanged { get; set; }

    /// <summary>
    /// <para>
    /// Raised when the finish button is pressed.
    /// </para>
    /// <para>
    /// If this is omitted, the finish button is not displayed.
    /// </para>
    /// <para>
    /// This callback is only raised if the <see cref="Form"/> is not invalid. If it <i>is</i>
    /// invalid, the finish button will be disabled.
    /// </para>
    /// </summary>
    [Parameter] public EventCallback<EditContext> Finish { get; set; }

    /// <summary>
    /// <para>
    /// Whether the "finish" button is disabled.
    /// </para>
    /// <para>
    /// Default is <see langword="false"/>.
    /// </para>
    /// </summary>
    [Parameter] public bool FinishButtonDisabled { get; set; }

    /// <summary>
    /// <para>
    /// The text to display on the "finish" button (if displayed).
    /// </para>
    /// <para>
    /// Default is "Finish".
    /// </para>
    /// </summary>
    [Parameter] public string? FinishButtonText { get; set; } = "Finish";

    /// <summary>
    /// The <see cref="Framework.Form"/> component that wraps the steps.
    /// </summary>
    public Form? Form { get; set; }

    /// <summary>
    /// Whether there is a visible step after the current step (disabled or not).
    /// </summary>
    public bool HasNextStep => _steps
        .Skip(CurrentStep + 1)
        .FirstOrDefault(x => x.IsVisible) is not null;

    /// <summary>
    /// If set to <see langword="true"/> the previous, next, and finish buttons will not be shown.
    /// </summary>
    /// <remarks>
    /// This can be helpful if progress through steps should be controlled programmatically, rather
    /// then through user interaction.
    /// </remarks>
    [Parameter] public bool HideButtons { get; set; }

    /// <summary>
    /// Whether the finish button is currently disabled.
    /// </summary>
    /// <remarks>
    /// Note that this property is set even if <see cref="HideButtons"/> is <see langword="true"/>.
    /// </remarks>
    public bool IsFinishButtonDisabled => !IsInteractive
        || FinishButtonDisabled
        || !IsFormValid;

    /// <summary>
    /// Whether the finish button is currently visible.
    /// </summary>
    /// <remarks>
    /// Note that this property is set even if <see cref="HideButtons"/> is <see langword="true"/>.
    /// </remarks>
    public bool IsFinishButtonVisible => (Finish.HasDelegate
        || Form?.OnSubmit.HasDelegate == true
        || Form?.OnValidSubmit.HasDelegate == true)
        && _steps
        .Skip(CurrentStep + 1)
        .FirstOrDefault(x => x.IsVisible) is null;

    /// <summary>
    /// Whether the next button is currently disabled.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Note that this property is set even if <see cref="HideButtons"/> is <see langword="true"/>.
    /// </para>
    /// </remarks>
    public bool IsNextButtonDisabled => _steps
        .Skip(CurrentStep + 1)
        .FirstOrDefault(x => x.IsVisible)?
        .Disabled != false;

    /// <summary>
    /// Whether the next button is currently visible.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Note that this property is set even if <see cref="HideButtons"/> is <see langword="true"/>.
    /// </para>
    /// <para>
    /// Note: this is never <see langword="true"/> when <see cref="IsFinishButtonVisible"/> is <see
    /// langword="true"/>, since the finish button replaces the next button.
    /// </para>
    /// </remarks>
    public bool IsNextButtonVisible => !IsFinishButtonVisible
        && _steps
        .Skip(CurrentStep + 1)
        .FirstOrDefault(x => x.IsVisible) is not null;

    /// <summary>
    /// Whether the previous button is currently disabled.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Note that this property is set even if <see cref="HideButtons"/> is <see langword="true"/>.
    /// </para>
    /// </remarks>
    public bool IsPreviousButtonDisabled => _steps
        .Take(CurrentStep)
        .LastOrDefault(x => x.IsVisible)?
        .Disabled != false;

    /// <summary>
    /// Whether the previous button is currently visible.
    /// </summary>
    /// <remarks>
    /// Note that this property is set even if <see cref="HideButtons"/> is <see langword="true"/>.
    /// </remarks>
    public bool IsPreviousButtonVisible => _steps
        .Take(CurrentStep)
        .LastOrDefault(x => x.IsVisible) is not null;

    /// <summary>
    /// Specifies the top-level model object for the <see cref="Form"/>. An edit context will be
    /// constructed for this model. If using this parameter, do not also supply a value for <see
    /// cref="EditContext"/>.
    /// </summary>
    [Parameter] public object? Model { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <summary>
    /// <para>
    /// Optionally provides validation logic for the <see cref="Form"/> as a whole.
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

    internal int InitialStep { get; private set; } = -1;

    /// <inheritdoc />
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("steps")
        .ToString();

    private int CurrentStep { get; set; }

    private ThemeColor CurrentThemeColor
        => ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor;

    private string? FinishButtonCssClass => new CssBuilder("btn ms-auto")
        .Add("btn-text", FinishButtonDisabled)
        .Add(CurrentThemeColor.ToCSS(), !FinishButtonDisabled)
        .ToString();

    private bool IsInteractive { get; set; }

    private bool IsFormValid { get; set; } = true;

    private string? NextButtonCssClass => new CssBuilder("btn ms-auto")
        .Add("btn-text", IsNextButtonDisabled)
        .Add(CurrentThemeColor.ToCSS(), !IsNextButtonDisabled)
        .ToString();

    private string? PreviousButtonCssClass => new CssBuilder("btn")
        .Add("btn-text", IsPreviousButtonDisabled)
        .Add("outlined", !IsPreviousButtonDisabled)
        .ToString();

    private IEnumerable<Step> VisibleSteps => _steps
        .Where(x => x.IsVisible || x == _steps[CurrentStep]);

    /// <inheritdoc/>
    protected override void OnInitialized()
    {
        var currentSteps = QueryStateService.RegisterProperty(
            Id,
            CurrentStepQueryParamName,
            OnQueryChangedAsync,
            CurrentStep + 1);
        if (currentSteps?.Count > 0
            && int.TryParse(currentSteps[0], out var currentStep))
        {
            InitialStep = currentStep - 1;
        }
    }

    /// <inheritdoc />
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            IsInteractive = true;

            if (_steps.Count > 0)
            {
                while (CurrentStep < _steps.Count
                    && !_steps[CurrentStep].IsVisible)
                {
                    CurrentStep++;
                }
                if (!_steps[CurrentStep].IsVisible)
                {
                    CurrentStep = 0;
                }
            }
            if (CurrentStep >= _steps.Count)
            {
                CurrentStep = 0;
            }

            StateHasChanged();
        }
    }

    /// <summary>
    /// Activates the next visible step, if it is not disabled.
    /// </summary>
    /// <remarks>
    /// Does nothing if there is no visible step after the current step, or if the next step is
    /// disabled.
    /// </remarks>
    public async Task ActivateNextStepAsync()
    {
        var next = _steps
            .Skip(CurrentStep + 1)
            .FirstOrDefault(x => x.IsVisible);
        if (next?.Disabled != false)
        {
            return;
        }

        await ActivateStepAsync(next);
    }

    /// <summary>
    /// Activates the previous visible step, if it is not disabled.
    /// </summary>
    /// <remarks>
    /// Does nothing if there is no visible step before the current step, or if the previous step is
    /// disabled.
    /// </remarks>
    public async Task ActivatePreviousStepAsync()
    {
        var previous = _steps
            .Take(CurrentStep)
            .LastOrDefault(x => x.IsVisible);
        if (previous?.Disabled != false)
        {
            return;
        }

        await ActivateStepAsync(previous);
    }

    /// <summary>
    /// Set the given step as the active step.
    /// </summary>
    /// <param name="step">The step to set as the currently active step.</param>
    /// <remarks>
    /// Does nothing if <paramref name="step"/> is not one of the steps in this <see cref="Steps"/>
    /// component.
    /// </remarks>
    public async Task ActivateStepAsync(Step step)
    {
        var index = _steps.IndexOf(step);
        if (index == -1)
        {
            return;
        }

        await _steps[CurrentStep].ActivateAsync(false);
        CurrentStep = index;
        await _steps[CurrentStep].ActivateAsync(true);
        SetCurrentStep();
    }

    internal int AddStep(Step step)
    {
        _steps.Add(step);
        StateHasChanged();
        return _steps.Count - 1;
    }

    internal void Refresh() => StateHasChanged();

    internal void RemoveStep(Step step)
    {
        _steps.Remove(step);
        StateHasChanged();
    }

    private string GetNextStepUrl()
    {
        var step = CurrentStep;
        var next = _steps
            .Skip(CurrentStep + 1)
            .FirstOrDefault(x => x.IsVisible);
        if (next?.Disabled == false)
        {
            step = _steps.IndexOf(next);
        }

        return QueryStateService.GetUriWithPropertyValue(
            Id,
            CurrentStepQueryParamName,
            step + 1);
    }

    private string GetPreviousStepUrl()
    {
        var step = CurrentStep;
        var previous = _steps
            .Take(CurrentStep)
            .LastOrDefault(x => x.IsVisible);
        if (previous?.Disabled == false)
        {
            step = _steps.IndexOf(previous);
        }

        return QueryStateService.GetUriWithPropertyValue(
            Id,
            CurrentStepQueryParamName,
            step + 1);
    }

    private string? GetStepActivatorCssClass(Step step) => new CssBuilder("step-activator")
        .Add("disabled", step != _steps[CurrentStep] && step.Disabled)
        .Add(CurrentThemeColor.ToCSS(), step == _steps[CurrentStep])
        .ToString();

    private string? GetStepCssClass(int index) => new CssBuilder()
        .AddStyle("d-none", index != CurrentStep)
        .ToString();

    private string GetStepUrl(Step step)
    {
        var index = _steps.IndexOf(step);
        if (index == -1)
        {
            index = CurrentStep;
        }

        return QueryStateService.GetUriWithPropertyValue(
            Id,
            CurrentStepQueryParamName,
            index + 1);
    }

    private async Task OnActivateStepAsync(Step step)
    {
        if (!step.Disabled)
        {
            await ActivateStepAsync(step);
        }
    }

    private async Task OnFinishAsync()
    {
        if (!Finish.HasDelegate)
        {
            return;
        }

        await Finish.InvokeAsync();
    }

    private async Task OnNextAsync()
    {
        var next = _steps
            .Skip(CurrentStep + 1)
            .FirstOrDefault(x => x.IsVisible);
        if (next?.Disabled != false)
        {
            return;
        }

        await _steps[CurrentStep].ActivateAsync(false);
        CurrentStep = _steps.IndexOf(next);
        await _steps[CurrentStep].ActivateAsync(true);
        SetCurrentStep();
    }

    private async Task OnPreviousAsync()
    {
        var previous = _steps
            .Take(CurrentStep)
            .LastOrDefault(x => x.IsVisible);
        if (previous?.Disabled != false)
        {
            return;
        }

        await _steps[CurrentStep].ActivateAsync(false);
        CurrentStep = _steps.IndexOf(previous);
        await _steps[CurrentStep].ActivateAsync(true);
        SetCurrentStep();
    }

    private Task OnQueryChangedAsync(QueryChangeEventArgs args)
    {
        if (int.TryParse(args.Value, out var currentStep)
            && _steps.Count >= currentStep
            && _steps[currentStep - 1].IsVisible
            && !_steps[currentStep - 1].Disabled)
        {
            CurrentStep = currentStep - 1;
        }
        return Task.CompletedTask;
    }

    private async Task OnValidationStateChanged(ValidationStateChangedEventArgs e)
    {
        if (Form is null)
        {
            return;
        }
        IsFormValid = await Form.ValidateAsync();
        await ValidationStateChanged.InvokeAsync(e);
    }

    private void SetCurrentStep()
    {
        if (PersistState)
        {
            QueryStateService.SetPropertyValue(
                Id,
                CurrentStepQueryParamName,
                CurrentStep + 1);
        }
    }
}