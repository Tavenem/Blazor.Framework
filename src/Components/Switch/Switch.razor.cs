using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Tavenem.Blazor.Framework.Components.Forms;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A boolean toggle input component.
/// </summary>
public partial class Switch : BoolInputComponentBase<bool>
{
    /// <summary>
    /// An optional icon to display in the checked state.
    /// </summary>
    [Parameter] public string? CheckedIcon { get; set; }

    /// <inheritdoc/>
    public override bool HasValue => IsChecked == true;

    /// <summary>
    /// An optional icon to display in the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedIcon { get; set; }

    /// <summary>
    /// An optional label for the unchecked state.
    /// </summary>
    [Parameter] public string? UncheckedLabel { get; set; }

    /// <inheritdoc/>
    protected override string? CssClass => new CssBuilder(base.CssClass)
        .Add("switch")
        .Add("checked", IsChecked == true)
        .ToString();

    private string? ButtonClass => new CssBuilder("btn btn-icon")
        .Add(ThemeColor.ToCSS())
        .ToString();

    private protected string ButtonId { get; set; } = Guid.NewGuid().ToHtmlId();

    private string? Icon => IsChecked == true
        ? CheckedIcon
        : UncheckedIcon;

    [Inject] private protected IKeyListener KeyListener { get; set; } = default!;

    private protected virtual List<KeyOptions> KeyOptions { get; set; } =
    [
        new()
        {
            Key = "/ArrowLeft|ArrowRight| |Enter/",
            SubscribeDown = true,
            PreventDown = "key+none",
        }
    ];

    /// <inheritdoc/>
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await KeyListener.ConnectAsync(ButtonId, new()
            {
                Keys = KeyOptions,
            });
            KeyListener.KeyDown += OnKeyDown;
        }
    }

    private void OnChange(ChangeEventArgs e) => Toggle();

    private protected void OnKeyDown(KeyboardEventArgs e)
    {
        if (Disabled || ReadOnly || !IsInteractive)
        {
            return;
        }

        switch (e.Key)
        {
            case "ArrowLeft":
                if (Value)
                {
                    Toggle();
                }
                break;
            case "ArrowRight":
                if (!Value)
                {
                    Toggle();
                }
                break;
            case " ":
            case "Enter":
                Toggle();
                break;
        }
    }
}