using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A base class for picker components.
/// </summary>
public class PickerComponentBase<TValue> : FormComponentBase<TValue>
{
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
    [Parameter] public string Id { get; set; } = Guid.NewGuid().ToHtmlId();

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
        .Add("no-label", string.IsNullOrEmpty(Label))
        .ToString();

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected virtual string? DisplayString { get; }

    /// <summary>
    /// The final value assigned to the input element's class attribute, including component values.
    /// </summary>
    protected string? InputCssClass => new CssBuilder(InputClass)
        .AddClassFromDictionary(InputAttributes)
        .Add("input-core")
        .ToString();

    /// <summary>
    /// The final value assigned to the input element's style attribute.
    /// </summary>
    protected virtual string? InputCssStyle => new CssBuilder(InputStyle)
        .AddStyleFromDictionary(InputAttributes)
        .ToString();

    /// <summary>
    /// The popover component.
    /// </summary>
    protected Popover? Popover { get; set; }

    private protected virtual bool CanClear => AllowClear
        && Clearable
        && !Disabled
        && !ReadOnly
        && !Required
        && !string.IsNullOrEmpty(CurrentValueAsString);

    private protected bool Clearable { get; set; }

    private protected string ContainerId { get; set; } = Guid.NewGuid().ToHtmlId();

    private protected string InputId { get; set; } = Guid.NewGuid().ToHtmlId();

    [Inject] private protected IKeyListener KeyListener { get; set; } = default!;

    private protected virtual List<KeyOptions> KeyOptions { get; set; } = new()
    {
        new()
        {
            Key = "Escape",
            SubscribeDown = true,
            PreventDown = "key+none",
        },
        new()
        {
            Key = "/Delete| |Enter/",
            SubscribeDown = true,
            PreventDown = "key+none",
            TargetOnly = true,
        }
    };

    private protected bool PopoverOpen { get; set; }

    private protected bool ShowPicker => PopoverOpen
        && !Disabled
        && !ReadOnly;

    private protected virtual bool ShrinkWhen => !string.IsNullOrEmpty(CurrentValueAsString)
        || !string.IsNullOrEmpty(Placeholder);

    /// <inheritdoc/>
    protected override void OnParametersSet()
    {
        if (AdditionalAttributes is not null
            && AdditionalAttributes.TryGetValue("id", out var id)
            && id is string idString
            && !string.IsNullOrEmpty(idString))
        {
            ContainerId = idString;
        }
    }

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await KeyListener.ConnectAsync(ContainerId, new()
            {
                Keys = KeyOptions,
            });
            KeyListener.KeyDown += OnKeyDownAsync;
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

    private protected async Task ClosePopoverAsync()
    {
        if (PopoverOpen)
        {
            PopoverOpen = false;
            await OnClosePopoverAsync();
            StateHasChanged();
        }
    }

    private protected async Task TogglePopoverAsync()
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        PopoverOpen = !PopoverOpen;
        if (PopoverOpen)
        {
            OnOpenPopover();
            if (Popover is not null)
            {
                await Popover.ElementReference.FocusFirstAsync();
            }
        }
        else
        {
            await OnClosePopoverAsync();
        }
        StateHasChanged();
    }

    private protected async Task OnClickContainerAsync()
    {
        if (!Disabled && !ReadOnly)
        {
            await ElementReference.FocusAsync();
            await TogglePopoverAsync();
        }
    }

    private protected virtual Task OnClosePopoverAsync() => Task.CompletedTask;

    private protected virtual async void OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly)
        {
            return;
        }

        switch (e.Key)
        {
            case "Escape":
                if (PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "Delete":
                if (CanClear)
                {
                    await ClearAsync();
                }
                break;
            case " ":
            case "Enter":
                await TogglePopoverAsync();
                break;
        }
    }

    private protected virtual void OnOpenPopover() { }
}
