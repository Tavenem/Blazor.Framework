﻿namespace Tavenem.Blazor.Framework;

internal enum EditorCommandType
{
    None = 0,
    Undo = 1,
    Redo = 2,
    Heading1 = 3,
    Heading2 = 4,
    Heading3 = 5,
    Heading4 = 6,
    Heading5 = 7,
    Heading6 = 8,
    Paragraph = 9,
    BlockQuote = 10,
    CodeBlock = 11,
    Bold = 12,
    Italic = 13,
    Strikethrough = 14,
    Subscript = 15,
    Superscript = 16,
    Inserted = 17,
    Marked = 18,
    ListBullet = 19,
    ListNumber = 20,
    ListCheck = 21,
    UpLevel = 22,
    DownLevel = 23,
    HorizontalRule = 24,
    TableInsertColumnBefore = 25,
    TableInsertColumnAfter = 26,
    TableDeleteColumn = 27,
    TableInsertRowBefore = 28,
    TableInsertRowAfter = 29,
    TableDeleteRow = 30,
    TableDelete = 31,
    TableMergeCells = 32,
    TableSplitCell = 33,
    TableToggleHeaderRow = 34,
    TableColumnAlignLeft = 35,
    TableColumnAlignCenter = 36,
    TableColumnAlignRight = 37,
    InsertImage = 38,
    InsertLink = 39,
    SetBackground = 40,
}
