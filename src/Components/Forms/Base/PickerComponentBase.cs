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
    /// cref="FormComponentBase{TValue}.Disabled"/>, <see
    /// cref="FormComponentBase{TValue}.ReadOnly"/>, or <see
    /// cref="FormComponentBase{TValue}.Required"/> are <see langword="true"/>.
    /// </para>
    /// <para>
    /// Note that even when this property is <see langword="false"/>, a <see langword="null"/> value
    /// can still be set programmatically. This property only affects the presence of the clear
    /// button.
    /// </para>
    /// </summary>
    [Parameter] public bool AllowClear { get; set; } = true;

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
    /// The placeholder value.
    /// </summary>
    [Parameter] public string? Placeholder { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("shrink", ShrinkWhen)
        .Add("open", ShowPicker)
        .Add("disabled", IsDisabled)
        .Add("read-only", IsReadOnly)
        .ToString();

    /// <summary>
    /// The display text for the current selection.
    /// </summary>
    protected virtual string? DisplayString { get; }

    /// <summary>
    /// Whether this control is currently disabled.
    /// </summary>
    /// <remarks>
    /// Returns <see langword="true"/> if <see cref="FormComponentBase{T}.Disabled"/> is <see
    /// langword="true"/> or <see cref="FormComponentBase{T}.IsInteractive"/> is <see
    /// langword="false"/>.
    /// </remarks>
    protected virtual bool IsDisabled => Disabled || !IsInteractive;

    /// <summary>
    /// Whether this control is currently read-only.
    /// </summary>
    /// <remarks>
    /// Returns <see langword="true"/> if <see cref="FormComponentBase{T}.ReadOnly"/> is <see
    /// langword="true"/> or <see cref="FormComponentBase{T}.IsInteractive"/> is <see
    /// langword="false"/>.
    /// </remarks>
    protected virtual bool IsReadOnly => ReadOnly || !IsInteractive;

    /// <summary>
    /// Whether the popover should open when the enter key is pressed.
    /// </summary>
    protected virtual bool OpenOnEnter => true;

    /// <summary>
    /// The popover component.
    /// </summary>
    protected Popover? Popover { get; set; }

    private protected virtual bool CanClear => ShowClear
        && !string.IsNullOrEmpty(CurrentValueAsString);

    private protected bool Clearable { get; set; }

    private protected string? ClearButtonCssClass => new CssBuilder("btn btn-icon small")
        .Add("invisible", !CanClear)
        .ToString();

    private protected string ContainerId { get; set; } = Guid.NewGuid().ToHtmlId();

    private protected virtual List<KeyOptions> InputKeyOptions { get; set; } =
    [
        new()
        {
            Key = " ",
            SubscribeDown = true,
            PreventDown = "key+none",
            TargetOnly = true,
        }
    ];

    private protected string InputId { get; set; } = Guid.NewGuid().ToHtmlId();

    [Inject] private protected IKeyListener KeyListener { get; set; } = default!;

    private protected virtual List<KeyOptions> KeyOptions { get; set; } =
    [
        new()
        {
            Key = "/Delete|Enter|Escape/",
            SubscribeDown = true,
            PreventDown = "key+none",
        },
        new()
        {
            Key = "/ArrowDown|ArrowUp/",
            SubscribeDown = true,
            PreventDown = "key+alt",
        }
    ];

    private protected bool PopoverOpen { get; set; }

    private protected virtual bool ShowClear => AllowClear
        && Clearable
        && !Disabled
        && !ReadOnly
        && IsInteractive
        && !Required;

    private protected bool ShowPicker => PopoverOpen
        && !Disabled
        && !ReadOnly
        && IsInteractive;

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
            await KeyListener.ConnectAsync(Id, new()
            {
                Keys = InputKeyOptions,
            });
            KeyListener.KeyDown += OnKeyDownAsync;
        }
        await base.OnAfterRenderAsync(firstRender);
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
        if (!Disabled && !ReadOnly && IsInteractive)
        {
            CurrentValueAsString = null;
        }

        StateHasChanged();
        return Task.CompletedTask;
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

    private protected async Task TogglePopoverAsync()
    {
        if (Disabled || ReadOnly || !IsInteractive)
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
            await FocusAsync();
        }
        StateHasChanged();
    }

    private protected async Task OnClickContainerAsync()
    {
        if (!Disabled && !ReadOnly && IsInteractive)
        {
            await ElementReference.FocusAsync();
            await TogglePopoverAsync();
        }
    }

    private protected virtual Task OnClosePopoverAsync() => Task.CompletedTask;

    private protected virtual async void OnKeyDownAsync(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly || !IsInteractive)
        {
            return;
        }

        switch (e.Key)
        {
            case " ":
                if (!PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "ArrowDown":
                if (e.AltKey && !PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "ArrowUp":
                if (e.AltKey && PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "Delete":
                if (CanClear && !PopoverOpen)
                {
                    await ClearAsync();
                }
                break;
            case "Enter":
                if (OpenOnEnter || PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
            case "Escape":
                if (PopoverOpen)
                {
                    await TogglePopoverAsync();
                }
                break;
        }
    }

    private protected virtual void OnOpenPopover() { }
}
