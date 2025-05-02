namespace Tavenem.Blazor.Framework.Sample.Client.Pages;

public partial class Test
{
    private string? Value { get; set; }

    private string? Submitted { get; set; }

    private void OnEnter()
    {
        Console.WriteLine("Enter pressed!");
        Console.WriteLine(Value);
        Submitted = Value;
        Value = null;
    }
}
