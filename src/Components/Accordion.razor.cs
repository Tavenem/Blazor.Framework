using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// A set of collapsible panels.
/// </summary>
public partial class Accordion
{
    private readonly List<Collapse> _collapses = new();

    private bool _childrenNeedUpdates = false;

    /// <summary>
    /// <para>
    /// Set to <see langword="true"/> to prevent opening or closing any child collapses by the user.
    /// </para>
    /// <para>
    /// Note that open state can still be set programmatically.
    /// </para>
    /// </summary>
    [Parameter] public bool Disabled { get; set; }

    /// <summary>
    /// The final value assigned to the class attribute, including component
    /// values and anything assigned by the user in <see
    /// cref="TavenemComponentBase.AdditionalAttributes"/>.
    /// </summary>
    protected override string CssClass => new CssBuilder("accordion")
        .Add(Class)
        .AddClassFromDictionary(AdditionalAttributes)
        .ToString();

    /// <summary>
    /// Method invoked when the component has received parameters from its parent in
    /// the render tree, and the incoming values have been assigned to properties.
    /// </summary>
    protected override void OnParametersSet()
    {
        base.OnParametersSet();

        if (_childrenNeedUpdates)
        {
            foreach (var collapse in _collapses)
            {
                collapse.ForceRedraw();
            }

            _childrenNeedUpdates = false;
        }
    }

    internal async ValueTask AddAsync(Collapse collapse)
    {
        if (_collapses.Any(x => x.IsOpen))
        {
            await collapse.SetOpenAsync(false);
        }
        collapse.OnIsOpenChanged += OnCollapseOpenChanged;
        _collapses.Add(collapse);
        StateHasChanged();
    }

    private async void OnCollapseOpenChanged(object? sender, bool isOpen)
    {
        if (sender is not Collapse collapse
            || !isOpen)
        {
            return;
        }

        foreach (var item in _collapses)
        {
            if (item != collapse)
            {
                await item.SetOpenAsync(false);
            }
        }
    }

    internal void Remove(Collapse collapse)
    {
        collapse.OnIsOpenChanged -= OnCollapseOpenChanged;
        _collapses.Remove(collapse);
    }
}