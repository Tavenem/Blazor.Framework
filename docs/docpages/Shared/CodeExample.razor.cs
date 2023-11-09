using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.DocPages.Shared;

public partial class CodeExample
{
    [Parameter] public string? Code { get; set; }

    [Parameter] public bool IsOpen { get; set; } = true;

    [Parameter] public string? RowClass { get; set; }

    private RenderFragment? CodeFragment { get; set; }

    private string? RowCssClass => new CssBuilder("row justify-content-center")
        .Add(RowClass)
        .ToString();

    private RenderFragment AddContent()
        => builder => builder.AddMarkupContent(1, Code);

    protected override void OnInitialized()
        => CodeFragment = AddContent();
}