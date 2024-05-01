using System.Diagnostics.CodeAnalysis;
using Tavenem.Blazor.Framework.Components.DataGrid;
using Tavenem.Blazor.Framework.InternalComponents.DataGrid;

namespace Tavenem.Blazor.Framework.Components.Forms;

/// <summary>
/// A rich data grid for displaying collections of items in rows and columns, within a select
/// component.
/// </summary>
/// <typeparam name="TDataItem">The type of data item.</typeparam>
public interface IDataGridSelect<[DynamicallyAccessedMembers(
    DynamicallyAccessedMemberTypes.PublicParameterlessConstructor
    | DynamicallyAccessedMemberTypes.PublicFields
    | DynamicallyAccessedMemberTypes.PublicProperties)] TDataItem> : IDataGrid<TDataItem>
{
    /// <summary>
    /// The format string to use for conversion.
    /// </summary>
    string? Format { get; set; }

    /// <summary>
    /// The <see cref="IFormatProvider"/> to use for conversion.
    /// </summary>
    IFormatProvider? FormatProvider { get; set; }

    /// <summary>
    /// <para>
    /// A function to obtain a label from a data item.
    /// </para>
    /// <para>
    /// If omitted, the <see cref="object.ToString"/> method will be invoked on the item.
    /// </para>
    /// </summary>
    Func<TDataItem, string?>? ItemLabel { get; set; }

    /// <summary>
    /// Gets the value of the given row as a string.
    /// </summary>
    /// <param name="row">The row for which a display string is to be obtained.</param>
    /// <returns>The display string.</returns>
    string? GetRowValueAsString(Row<TDataItem>? row);

    /// <summary>
    /// Gets the value of the given row as a string.
    /// </summary>
    /// <param name="row">The row for which a display string is to be obtained.</param>
    /// <returns>The display string.</returns>
    public string? GetRowAsDisplayString(Row<TDataItem>? row)
    {
        if (row is null)
        {
            return null;
        }

        return ItemLabel?.Invoke(row.Item)
            ?? (row.Item is IFormattable formattable
                ? formattable.ToString(Format, FormatProvider)
                : row.Item.ToString());
    }
}
