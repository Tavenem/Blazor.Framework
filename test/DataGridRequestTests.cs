using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Globalization;

namespace Tavenem.Blazor.Framework.Test;

[TestClass]
public class DataGridRequestTests
{
    [TestMethod]
    public void SqlCount_NoFilter()
    {
        var request = new DataGridRequest(
            0,
            0,
            null,
            null);
        var (command, parameters) = DataGridRequest.ToSqlCount(request);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual("SELECT COUNT(1) FROM {0}", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlCount_TextFilter()
    {
        const string ParameterName = "FilterProp";
        const string ParameterValue = "Filter";

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, ParameterValue, false, null, null, null, null, null, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlCount(request);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT COUNT(1) FROM {{0}} WHERE [{ParameterName}] LIKE '%' + @{ParameterName} + '%' COLLATE Latin1_general_CI_AI", command);
        Assert.AreEqual(1, parameters.Length);
        Assert.AreEqual(ParameterName, parameters[0].name);
        Assert.AreEqual(ParameterValue, parameters[0].value);
    }

    [TestMethod]
    public void SqlQuery_NoFilter_NoOrder()
    {
        const string PrimaryKey = "Id";

        var request = new DataGridRequest(
            0,
            0,
            null,
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_Count()
    {
        const string PrimaryKey = "Id";
        const ushort Count = 10;
        const ulong Offset = 20;

        var request = new DataGridRequest(
            Count,
            Offset,
            null,
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} ORDER BY [{PrimaryKey}] OFFSET {Offset} ROWS FETCH NEXT {Count} ROWS ONLY", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_Limit()
    {
        const string PrimaryKey = "Id";
        const ulong Limit = 10;

        var request = new DataGridRequest(
            0,
            0,
            null,
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey, Limit);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} ORDER BY [{PrimaryKey}] OFFSET 0 ROWS FETCH NEXT {Limit} ROWS ONLY", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_NoFilter_OneOrder()
    {
        const string PrimaryKey = "Id";
        const string OrderProperty = "OrderProp";

        var request = new DataGridRequest(
            0,
            0,
            null,
            new[]
            {
                new SortInfo(OrderProperty)
            });
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} ORDER BY [{OrderProperty}], [{PrimaryKey}]", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_NoFilter_MultiOrder()
    {
        const string PrimaryKey = "Id";
        const string OrderProperty1 = "OrderProp1";
        const string OrderProperty2 = PrimaryKey;
        const string OrderProperty3 = "OrderProp3";

        var request = new DataGridRequest(
            0,
            0,
            null,
            new[]
            {
                new SortInfo(OrderProperty1, true),
                new SortInfo(OrderProperty2),
                new SortInfo(OrderProperty3),
            });
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} ORDER BY [{OrderProperty1}] DESC, [{OrderProperty2}], [{OrderProperty3}]", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_TextFilter_NoOrder()
    {
        const string PrimaryKey = "Id";
        const string ParameterName = "FilterProp";
        const string ParameterValue = "Filter";

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, ParameterValue, false, null, null, null, null, null, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{ParameterName}] LIKE '%' + @{ParameterName} + '%' COLLATE Latin1_general_CI_AI ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(1, parameters.Length);
        Assert.AreEqual(ParameterName, parameters[0].name);
        Assert.AreEqual(ParameterValue, parameters[0].value);
    }

    [TestMethod]
    public void SqlQuery_TextFilter_OneOrder()
    {
        const string PrimaryKey = "Id";
        const string ParameterName = "FilterProp";
        const string ParameterValue = "Filter";
        const string OrderProperty = "OrderProp";

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, ParameterValue, false, null, null, null, null, null, false) },
            new[]
            {
                new SortInfo(OrderProperty)
            });
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{ParameterName}] LIKE '%' + @{ParameterName} + '%' COLLATE Latin1_general_CI_AI ORDER BY [{OrderProperty}], [{PrimaryKey}]", command);
        Assert.AreEqual(1, parameters.Length);
        Assert.AreEqual(ParameterName, parameters[0].name);
        Assert.AreEqual(ParameterValue, parameters[0].value);
    }

    [TestMethod]
    public void SqlQuery_TextFilter_ExactMatch()
    {
        const string PrimaryKey = "Id";
        const string ParameterName = "FilterProp";
        const string ParameterValue = "Filter";

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, ParameterValue, true, null, null, null, null, null, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{ParameterName}] = @{ParameterName} ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(1, parameters.Length);
        Assert.AreEqual(ParameterName, parameters[0].name);
        Assert.AreEqual(ParameterValue, parameters[0].value);
    }

    [TestMethod]
    public void SqlQuery_QuickFilter()
    {
        const string PrimaryKey = "Id";
        const string PropertyName = "FilterProp";
        const string ParameterValue = "Quick Filter";
        const string ParameterName1 = "Quick_A";
        const string ParameterName2 = "Quick_B";
        var quickValues = ParameterValue.Split(' ');

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(PropertyName, null, false, ParameterValue, null, null, null, null, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{PropertyName}] LIKE '%' + @{ParameterName1} + '%' COLLATE Latin1_general_CI_AI AND [{PropertyName}] LIKE '%' + @{ParameterName2} + '%' COLLATE Latin1_general_CI_AI ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(2, parameters.Length);
        Assert.AreEqual(ParameterName1, parameters[0].name);
        Assert.AreEqual(quickValues[0], parameters[0].value);
        Assert.AreEqual(ParameterName2, parameters[1].name);
        Assert.AreEqual(quickValues[1], parameters[1].value);
    }

    [TestMethod]
    public void SqlQuery_TextFilterAndQuickFilter()
    {
        const string PrimaryKey = "Id";
        const string PropertyName = "FilterProp";
        const string ParameterValue = "Filter";
        const string QuickParameterValue = "Quick Filter";
        const string QuickParameterName1 = "Quick_A";
        const string QuickParameterName2 = "Quick_B";
        var quickValues = QuickParameterValue.Split(' ');

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(PropertyName, ParameterValue, false, QuickParameterValue, null, null, null, null, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{PropertyName}] LIKE '%' + @{PropertyName} + '%' COLLATE Latin1_general_CI_AI AND ([{PropertyName}] LIKE '%' + @{QuickParameterName1} + '%' COLLATE Latin1_general_CI_AI AND [{PropertyName}] LIKE '%' + @{QuickParameterName2} + '%' COLLATE Latin1_general_CI_AI) ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(3, parameters.Length);
        Assert.AreEqual(PropertyName, parameters[0].name);
        Assert.AreEqual(ParameterValue, parameters[0].value);
        Assert.AreEqual(QuickParameterName1, parameters[1].name);
        Assert.AreEqual(quickValues[0], parameters[1].value);
        Assert.AreEqual(QuickParameterName2, parameters[2].name);
        Assert.AreEqual(quickValues[1], parameters[2].value);
    }

    [TestMethod]
    public void SqlQuery_MultiTextFilter()
    {
        const string PrimaryKey = "Id";
        const string ParameterName1 = "FilterProp1";
        const string ParameterName2 = "FilterProp2";
        const string ParameterValue1 = "Filter1";
        const string ParameterValue2 = "Filter2";

        var request = new DataGridRequest(
            0,
            0,
            new[]
            {
                new FilterInfo(ParameterName1, ParameterValue1, false, null, null, null, null, null, false),
                new FilterInfo(ParameterName2, ParameterValue2, false, null, null, null, null, null, false),
            },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{ParameterName1}] LIKE '%' + @{ParameterName1} + '%' COLLATE Latin1_general_CI_AI AND [{ParameterName2}] LIKE '%' + @{ParameterName2} + '%' COLLATE Latin1_general_CI_AI ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(2, parameters.Length);
        Assert.AreEqual(ParameterName1, parameters[0].name);
        Assert.AreEqual(ParameterValue1, parameters[0].value);
        Assert.AreEqual(ParameterName2, parameters[1].name);
        Assert.AreEqual(ParameterValue2, parameters[1].value);
    }

    [TestMethod]
    public void SqlQuery_MultiQuickFilter()
    {
        const string PrimaryKey = "Id";
        const string PropertyName1 = "FilterProp1";
        const string PropertyName2 = "FilterProp2";
        const string ParameterValue = "Quick Filter";
        const string ParameterName1 = "Quick_A";
        const string ParameterName2 = "Quick_B";
        var quickValues = ParameterValue.Split(' ');

        var request = new DataGridRequest(
            0,
            0,
            new[]
            {
                new FilterInfo(PropertyName1, null, false, ParameterValue, null, null, null, null, false),
                new FilterInfo(PropertyName2, null, false, ParameterValue, null, null, null, null, false),
            },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE ([{PropertyName1}] LIKE '%' + @{ParameterName1} + '%' COLLATE Latin1_general_CI_AI OR [{PropertyName2}] LIKE '%' + @{ParameterName1} + '%' COLLATE Latin1_general_CI_AI) AND ([{PropertyName1}] LIKE '%' + @{ParameterName2} + '%' COLLATE Latin1_general_CI_AI OR [{PropertyName2}] LIKE '%' + @{ParameterName2} + '%' COLLATE Latin1_general_CI_AI) ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(2, parameters.Length);
        Assert.AreEqual(ParameterName1, parameters[0].name);
        Assert.AreEqual(quickValues[0], parameters[0].value);
        Assert.AreEqual(ParameterName2, parameters[1].name);
        Assert.AreEqual(quickValues[1], parameters[1].value);
    }

    [TestMethod]
    public void SqlQuery_MultiTextFilterAndQuickFilter()
    {
        const string PrimaryKey = "Id";
        const string PropertyName1 = "FilterProp1";
        const string PropertyName2 = "FilterProp2";
        const string ParameterValue1 = "Filter1";
        const string ParameterValue2 = "Filter2";
        const string ParameterValue3 = "Quick Filter";
        const string ParameterName1 = "Quick_A";
        const string ParameterName2 = "Quick_B";
        var quickValues = ParameterValue3.Split(' ');

        var request = new DataGridRequest(
            0,
            0,
            new[]
            {
                new FilterInfo(PropertyName1, ParameterValue1, false, ParameterValue3, null, null, null, null, false),
                new FilterInfo(PropertyName2, ParameterValue2, false, ParameterValue3, null, null, null, null, false),
            },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{PropertyName1}] LIKE '%' + @{PropertyName1} + '%' COLLATE Latin1_general_CI_AI AND [{PropertyName2}] LIKE '%' + @{PropertyName2} + '%' COLLATE Latin1_general_CI_AI AND (([{PropertyName1}] LIKE '%' + @{ParameterName1} + '%' COLLATE Latin1_general_CI_AI OR [{PropertyName2}] LIKE '%' + @{ParameterName1} + '%' COLLATE Latin1_general_CI_AI) AND ([{PropertyName1}] LIKE '%' + @{ParameterName2} + '%' COLLATE Latin1_general_CI_AI OR [{PropertyName2}] LIKE '%' + @{ParameterName2} + '%' COLLATE Latin1_general_CI_AI)) ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(4, parameters.Length);
        Assert.AreEqual(PropertyName1, parameters[0].name);
        Assert.AreEqual(ParameterValue1, parameters[0].value);
        Assert.AreEqual(PropertyName2, parameters[1].name);
        Assert.AreEqual(ParameterValue2, parameters[1].value);
        Assert.AreEqual(ParameterName1, parameters[2].name);
        Assert.AreEqual(quickValues[0], parameters[2].value);
        Assert.AreEqual(ParameterName2, parameters[3].name);
        Assert.AreEqual(quickValues[1], parameters[3].value);
    }

    [TestMethod]
    public void SqlQuery_BoolFilter()
    {
        const string PrimaryKey = "Id";
        const string ParameterName = "FilterProp";
        const bool ParameterValue = true;
        const string ParameterText = ParameterValue ? "1" : "0";

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, null, true, null, ParameterValue, null, null, null, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{ParameterName}] = {ParameterText} ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_NumberFilter()
    {
        const string PrimaryKey = "Id";
        const string ParameterName = "FilterProp";
        const double ParameterValue = 1;
        var parameterText = ParameterValue.ToString("g5");

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, null, true, null, null, ParameterValue, null, null, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE ABS([{ParameterName}] - {parameterText}) < 0.00001 ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_DateTimeFilter_After()
    {
        const string PrimaryKey = "Id";
        const string ParameterName = "FilterProp";
        var parameterValue = DateTime.Now;
        const string ParameterFormat = "d";
        var parameterText = parameterValue.ToString(ParameterFormat, CultureInfo.InvariantCulture);

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, null, true, null, null, null, parameterValue, ParameterFormat, false) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{ParameterName}] >= '{parameterText}' ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(0, parameters.Length);
    }

    [TestMethod]
    public void SqlQuery_DateTimeFilter_Before()
    {
        const string PrimaryKey = "Id";
        const string ParameterName = "FilterProp";
        var parameterValue = DateTime.Now;
        const string ParameterFormat = "d";
        var parameterText = parameterValue.ToString(ParameterFormat, CultureInfo.InvariantCulture);

        var request = new DataGridRequest(
            0,
            0,
            new[] { new FilterInfo(ParameterName, null, true, null, null, null, parameterValue, ParameterFormat, true) },
            null);
        var (command, parameters) = DataGridRequest.ToSqlQuery(request, PrimaryKey);

        Console.WriteLine(command);
        for (var i = 0; i < parameters.Length; i++)
        {
            Console.WriteLine($"Parameter @{parameters[i].name}: {parameters[i].value}");
        }

        Assert.AreEqual($"SELECT {{0}} FROM {{1}} WHERE [{ParameterName}] <= '{parameterText}' ORDER BY [{PrimaryKey}]", command);
        Assert.AreEqual(0, parameters.Length);
    }
}