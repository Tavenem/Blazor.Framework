using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using System.Globalization;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for picker components.
/// </summary>
public class PickerComponentBase<TValue> : FormComponentBase<TValue>
{
    private readonly AdjustableTimer _focusTimer;

    private bool _disposedValue;

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
    /// <para>
    /// The converter used to convert bound values to HTML input element values, and vice versa.
    /// </para>
    /// <para>
    /// Built-in input components have reasonable default converters for most data types, but you
    /// can supply your own for custom data.
    /// </para>
    /// </summary>
    [Parameter] public InputValueConverter<TValue>? Converter { get; set; }

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
    /// <para>
    /// The <see cref="IFormatProvider"/> to use for conversion.
    /// </para>
    /// <para>
    /// Default is <see cref="CultureInfo.CurrentCulture"/>.
    /// </para>
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

    private protected virtual bool CanClear => Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && !string.IsNullOrEmpty(CurrentValueAsString);

    private protected bool Clearable { get; set; }

    private protected bool HasFocus { get; set; }

    private protected bool PopoverClosed { get; set; } = true;

    private protected bool ShowPicker => HasFocus
        && !PopoverClosed;

    private protected virtual bool ShrinkWhen => !string.IsNullOrEmpty(CurrentValueAsString)
        || !string.IsNullOrEmpty(Placeholder);

    /// <summary>
    /// Constructs a new instance of <see cref="PickerComponentBase{TValue}"/>.
    /// </summary>
    protected PickerComponentBase() => _focusTimer = new(ClearFocus, 200);

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (Converter is not null)
        {
            if (Format?.Equals(Converter.Format) != true)
            {
                Converter.Format = Format;
            }
            if (FormatProvider?.Equals(Converter.FormatProvider) != true)
            {
                Converter.FormatProvider = FormatProvider;
            }
        }
    }

    /// <summary>
    /// <para>
    /// Clears the current selected value.
    /// </para>
    /// <para>
    /// If the bound type is non-nullable, this may set the default value.
    /// </para>
    /// </summary>
    public virtual void Clear() => CurrentValueAsString = null;

    /// <summary>
    /// Focuses this element.
    /// </summary>
    public async Task FocusAsync() => await ElementReference.FocusAsync();

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

    private protected void OnClick()
    {
        if (!Disabled && !ReadOnly)
        {
            var wasShown = ShowPicker;
            PopoverClosed = !PopoverClosed;
            if (ShowPicker != wasShown)
            {
                if (ShowPicker)
                {
                    OnOpenPopover();
                }
                else
                {
                    OnClosePopoverAsync();
                }
            }
        }
    }

    private protected async Task OnClickContainerAsync()
    {
        if (!Disabled && !ReadOnly)
        {
            await ElementReference.FocusAsync();
            PopoverClosed = !PopoverClosed;
        }
    }

    private protected virtual Task OnClosePopoverAsync() => Task.CompletedTask;

    private protected void OnFocusIn()
    {
        _focusTimer.Cancel();
        HasFocus = true;
        if (!PopoverClosed)
        {
            OnOpenPopover();
        }
    }

    private protected void OnFocusOut() => _focusTimer.Start();

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
                PopoverClosed = true;
                break;
            case " ":
            case "enter":
                PopoverClosed = !PopoverClosed;
                break;
        }

        return Task.CompletedTask;
    }

    private protected virtual void OnOpenPopover() { }

    private void ClearFocus()
    {
        HasFocus = false;
        PopoverClosed = true;
        OnClosePopoverAsync();
        StateHasChanged();
    }
}
