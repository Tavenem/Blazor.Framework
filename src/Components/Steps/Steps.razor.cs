using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A set of <see cref="Step"/> components, one of which is visible at any time.
/// </summary>
public partial class Steps
{
    private readonly List<Step> _steps = new();

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

    private IEnumerable<Step> VisibleSteps => _steps
        .Where(x => x.IsVisible || x == _steps[CurrentStep]);

    /// <inheritdoc />
    protected override string? CssClass => new CssBuilder(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .Add("steps")
        .ToString();

    private int CurrentStep { get; set; }

    private ThemeColor CurrentThemeColor
        => ThemeColor == ThemeColor.None ? ThemeColor.Primary : ThemeColor;

    private bool IsFinishButtonDisabled => FinishButtonDisabled
        || !IsFormValid;

    private string? FinishButtonCssClass => new CssBuilder("btn ms-auto")
        .Add("btn-text", FinishButtonDisabled)
        .Add(CurrentThemeColor.ToCSS(), !FinishButtonDisabled)
        .ToString();

    private bool IsFormValid { get; set; } = true;

    private string? NextButtonCssClass => new CssBuilder("btn ms-auto")
        .Add("btn-text", NextDisabled)
        .Add(CurrentThemeColor.ToCSS(), !NextDisabled)
        .ToString();

    private bool NextDisabled
    {
        get
        {
            var next = _steps
                .Skip(CurrentStep + 1)
                .FirstOrDefault(x => x.IsVisible);
            return next is null || next.Disabled;
        }
    }

    private string? PreviousButtonCssClass => new CssBuilder("btn")
        .Add("btn-text", PreviousDisabled)
        .Add("outlined", !PreviousDisabled)
        .ToString();

    private bool PreviousDisabled
    {
        get
        {
            var previous = _steps
                .Take(CurrentStep)
                .LastOrDefault(x => x.IsVisible);
            return previous is null || previous.Disabled;
        }
    }

    private bool ShowFinishButton => (Finish.HasDelegate
        || Form?.OnSubmit.HasDelegate == true
        || Form?.OnValidSubmit.HasDelegate == true)
        && _steps
        .Skip(CurrentStep + 1)
        .FirstOrDefault(x => x.IsVisible) is null;

    private bool ShowNextButton => _steps
        .Skip(CurrentStep + 1)
        .FirstOrDefault(x => x.IsVisible) is not null;

    private bool ShowPreviousButton => _steps
        .Take(CurrentStep)
        .LastOrDefault(x => x.IsVisible) is not null;

    /// <inheritdoc />
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender && _steps.Count > 0)
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
    }

    internal void AddStep(Step step)
    {
        _steps.Add(step);
        StateHasChanged();
    }

    internal void Refresh() => StateHasChanged();

    internal void RemoveStep(Step step)
    {
        _steps.Remove(step);
        StateHasChanged();
    }

    private string? GetStepActivatorCssClass(Step step) => new CssBuilder("step-activator")
        .Add("disabled", step.Disabled)
        .Add(CurrentThemeColor.ToCSS(), step == _steps[CurrentStep])
        .ToString();

    private string? GetStepCssStyle(int index) => new CssBuilder()
        .AddStyle("visibility", "hidden", index != CurrentStep)
        .ToString();

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
        if (next is null || next.Disabled)
        {
            return;
        }

        await _steps[CurrentStep].ActivateAsync(false);
        CurrentStep = _steps.IndexOf(next);
        await _steps[CurrentStep].ActivateAsync(true);
    }

    private async Task OnPreviousAsync()
    {
        var previous = _steps
            .Take(CurrentStep)
            .LastOrDefault(x => x.IsVisible);
        if (previous is null || previous.Disabled)
        {
            return;
        }

        await _steps[CurrentStep].ActivateAsync(false);
        CurrentStep = _steps.IndexOf(previous);
        await _steps[CurrentStep].ActivateAsync(true);
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
}