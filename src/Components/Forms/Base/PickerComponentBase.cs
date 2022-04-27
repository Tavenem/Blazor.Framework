using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for picker components.
/// </summary>
public class PickerComponentBase<TValue> : FormComponentBase<TValue>
{
    private readonly AdjustableTimer _focusTimer;

    private bool _disposedValue;

    /// <summary>
    /// <para>
    /// Whether to allow the user to clear the current value.
    /// </para>
    /// <para>
    /// Default is <see langword="true"/>.
    /// </para>
    /// <para>
    /// This property is ignored if <typeparamref name="TValue"/> is not nullable, or if any of <see
    /// cref="Disabled"/>, <see cref="ReadOnly"/>, or <see
    /// cref="FormComponentBase{TValue}.Required"/> are <see langword="true"/>.
    /// </para>
    /// <para>
    /// Note that even when this property is <see langword="false"/>, a <see langword="null"/> value
    /// can still be set programmatically. This property only affects the presence of the clear button.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowClear { get; set; } = true;

    /// <summary>
    /// Whether the select should receive focus on page load.
    /// </summary>
    [Parameter] public bool AutoFocus { get; set; }

    /// <summary>
    /// <para>
    /// The icon displayed for the clear button.
    /// </para>
    /// <para>
    /// Default is "clear".
    /// </para>
    /// </summary>
    [Parameter] public string ClearIcon { get; set; } = DefaultIcons.Clear;

    /// <summary>
    /// Whether the select is disabled.
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// A reference to the select element.
    /// </summary>
    public ElementReference ElementReference { get; set; }

    /// <summary>
    /// The format string to use for conversion.
    /// </summary>
    [Parameter] public string? Format { get; set; }

    /// <summary>
    /// The <see cref="IFormatProvider"/> to use for conversion.
    /// </summary>
    [Parameter] public IFormatProvider? FormatProvider { get; set; }

    /// <summary>
    /// Any help text displayed below the select.
    /// </summary>
    [Parameter] public string? HelpText { get; set; }

    /// <summary>
    /// <para>
    /// The id of the select element.
    /// </para>
    /// <para>
    /// Set to a random GUID if not provided.
    /// </para>
    /// </summary>
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// Custom HTML attributes for the select element.
    /// </summary>
    [Parameter] public Dictionary<string, object> InputAttributes { get; set; } = new();

    /// <summary>
    /// Custom CSS class(es) for the select element.
    /// </summary>
    [Parameter] public string? InputClass { get; set; }

    /// <summary>
    /// Custom CSS style(s) for the select element.
    /// </summary>
    [Parameter] public string? InputStyle { get; set; }

    /// <summary>
    /// A label which describes the field.
    /// </summary>
    [Parameter] public string? Label { get; set; }

    /// <summary>
    /// The placeholder value.
    /// </summary>
    [Parameter] public string? Placeholder { get; set; }

    /// <summary>
    /// Whether the select is read-only.
    /// </summary>
    [Parameter] public bool ReadOnly { get; set; }

    /// <summary>
    /// The tabindex of the select element.
    /// </summary>
    [Parameter] public int TabIndex { get; set; }

    /// <summary>
    /// One of the built-in color themes.
    /// </summary>
    [Parameter] public ThemeColor ThemeColor { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add(ThemeColor.ToCSS())
        .Add("disabled", Disabled)
        .Add("read-only", ReadOnly)
        .Add("field")
        .Add("shrink", ShrinkWhen)
        .Add("required", Required)
        .Add("open", ShowPicker)
        .ToString();

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected virtual string? DisplayString { get; }

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected string? InputCssClass => new CssBuilder(InputClass)
        .Add("input-core")
        .ToString();

    private protected virtual bool CanClear => AllowClear
        && Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && !string.IsNullOrEmpty(CurrentValueAsString);

    private protected bool Clearable { get; set; }

    private protected bool HasFocus { get; set; }

    private protected bool PopoverOpen { get; set; }

    private protected bool ShowPicker => PopoverOpen
        && !Disabled
        && !ReadOnly;

    private protected virtual bool ShrinkWhen => !string.IsNullOrEmpty(CurrentValueAsString)
        || !string.IsNullOrEmpty(Placeholder);

    /// <summary>
    /// Constructs a new instance of <see cref="PickerComponentBase{TValue}"/>.
    /// </summary>
    protected PickerComponentBase() => _focusTimer = new(ClearFocus, 200);

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public virtual Task ClearAsync()
    {
        if (!Disabled && !ReadOnly)
        {
            CurrentValueAsString = null;
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// Focuses this element.
    /// </summary>
    public virtual async Task FocusAsync() => await ElementReference.FocusAsync();

    /// <inheritdoc/>
    protected override void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                _focusTimer.Dispose();
            }

            _disposedValue = true;
        }

        base.Dispose(disposing);
    }

    private protected async Task ClosePopoverAsync()
    {
        if (PopoverOpen)
        {
            PopoverOpen = false;
            await OnClosePopoverAsync();
            StateHasChanged();
        }
    }

    private protected void TogglePopover()
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        PopoverOpen = !PopoverOpen;
        if (PopoverOpen)
        {
            OnOpenPopover();
        }
        else
        {
            OnClosePopoverAsync();
        }
    }

    private protected async Task OnClickContainerAsync()
    {
        if (!Disabled && !ReadOnly)
        {
            await ElementReference.FocusAsync();
            TogglePopover();
        }
    }

    private protected virtual Task OnClosePopoverAsync() => Task.CompletedTask;

    private protected void OnFocusIn()
    {
        _focusTimer.Cancel();
        HasFocus = true;
    }

    private protected void OnFocusOut()
    {
        if (HasFocus)
        {
            _focusTimer.Start();
        }
    }

    private protected virtual Task OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly)
        {
            return Task.CompletedTask;
        }

        switch (e.Key)
        {
            case "escape":
            case "tab":
                if (PopoverOpen)
                {
                    TogglePopover();
                }
                break;
            case " ":
            case "enter":
                TogglePopover();
                break;
        }

        return Task.CompletedTask;
    }

    private protected virtual void OnOpenPopover() { }

    private void ClearFocus() => HasFocus = false;
}
