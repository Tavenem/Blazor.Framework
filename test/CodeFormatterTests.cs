using Microsoft.VisualStudio.TestTools.UnitTesting;
using Tavenem.Blazor.Framework.DocPages.Utilities;

namespace Tavenem.Blazor.Framework.Test;

[TestClass]
public class CodeFormatterTests
{
    [TestMethod]
    public void DirectiveTest1()
    {
        var result = CodeFormatter.CodeToMarkup(@"@page ""/layout/rows-columns""");
        Console.WriteLine(result);
    }

    [TestMethod]
    public void DirectiveTest2()
    {
        var result = CodeFormatter.CodeToMarkup("@inherits LayoutComponentBase");
        Console.WriteLine(result);
    }

    [TestMethod]
    public void DirectiveTest3()
    {
        var result = CodeFormatter.CodeToMarkup(@"<ChildContent>
    @Body
</ChildContent>");
        Console.WriteLine(result);
    }

    [TestMethod]
    public void DirectiveTest4()
    {
        var result = CodeFormatter.CodeToMarkup(@"<button @onclick=""Home"">Home</button>");
        Console.WriteLine(result);
    }

    [TestMethod]
    public void ForLoopTest()
    {
        var result = CodeFormatter.CodeToMarkup(@"<div class=""row"">
    @for (var i = 0; i < 2; i++)
    {
        <div class=""primary filled"" style=""height:5em;width:5em""></div>
    }
</div>");
        Console.WriteLine(result);
    }
}