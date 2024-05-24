import { CommandType } from "./_schemas";
import { syntaxLabelMap, syntaxes } from "./_syntax";

export enum ToolbarControlStyle {
    Separator = 0,
    Button = 1,
    Dropdown = 2,
    DropdownButton = 3,
    ButtonGroup = 4,
}

interface ToolbarControlDefinition {
    buttons?: ToolbarControlDefinition[];
    icon?: string;
    inactiveIcon?: string;
    isStyle?: boolean;
    isWysiwyg?: boolean;
    params?: any[];
    parentClass?: string;
    separatorBefore?: boolean;
    style?: ToolbarControlStyle;
    text?: string;
    tooltip?: string;
    type?: CommandType;
}

export class ToolbarControl {
    _active: boolean = false;
    _definition: ToolbarControlDefinition;
    _disabled: boolean = false;
    _element: HTMLElement;
    _parentElement?: HTMLElement;

    constructor(element: HTMLElement, definition: ToolbarControlDefinition, parentElement?: HTMLElement) {
        this._element = element;
        this._definition = definition;
        this._parentElement = parentElement;
    }
}

export const toolbarButtonDefinitions: ToolbarControlDefinition[] = [
    {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>',
        tooltip: 'undo',
        type: CommandType.Undo,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z"/></svg>',
        tooltip: 'redo',
        type: CommandType.Redo,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z"/></svg>',
        isStyle: true,
        type: CommandType.Strong,
        style: ToolbarControlStyle.DropdownButton,
        buttons: [
            {
                parentClass: 'filled',
                text: 'Strong',
                type: CommandType.Strong,
            },
            {
                parentClass: 'outlined',
                text: 'Bold',
                type: CommandType.Bold,
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z"/></svg>',
        isStyle: true,
        type: CommandType.Emphasis,
        style: ToolbarControlStyle.DropdownButton,
        buttons: [
            {
                parentClass: 'filled',
                text: 'Emphasis',
                type: CommandType.Emphasis,
            },
            {
                parentClass: 'outlined',
                text: 'Italic',
                type: CommandType.Italic,
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120v-80h560v80H200Zm280-160q-101 0-157-63t-56-167v-330h103v336q0 56 28 91t82 35q54 0 82-35t28-91v-336h103v330q0 104-56 167t-157 63Z"/></svg>',
        isStyle: true,
        tooltip: 'underline',
        type: CommandType.Underline,
        style: ToolbarControlStyle.ButtonGroup,
        buttons: [
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M486-160q-76 0-135-45t-85-123l88-38q14 48 48.5 79t85.5 31q42 0 76-20t34-64q0-18-7-33t-19-27h112q5 14 7.5 28.5T694-340q0 86-61.5 133T486-160ZM80-480v-80h800v80H80Zm402-326q66 0 115.5 32.5T674-674l-88 39q-9-29-33.5-52T484-710q-41 0-68 18.5T386-640h-96q2-69 54.5-117.5T482-806Z"/></svg>',
                tooltip: 'strikethrough',
                type: CommandType.Strikethrough,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M760-160v-80q0-17 11.5-28.5T800-280h80v-40H760v-40h120q17 0 28.5 11.5T920-320v40q0 17-11.5 28.5T880-240h-80v40h120v40H760Zm-525-80 185-291-172-269h106l124 200h4l123-200h107L539-531l186 291H618L482-457h-4L342-240H235Z"/></svg>',
                tooltip: 'subscript',
                type: CommandType.Subscript,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M760-600v-80q0-17 11.5-28.5T800-720h80v-40H760v-40h120q17 0 28.5 11.5T920-760v40q0 17-11.5 28.5T880-680h-80v40h120v40H760ZM235-160l185-291-172-269h106l124 200h4l123-200h107L539-451l186 291H618L482-377h-4L342-160H235Z"/></svg>',
                tooltip: 'superscript',
                type: CommandType.Superscript,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M320-240 80-480l240-240 57 57-184 184 183 183-56 56Zm320 0-57-57 184-184-183-183 56-56 240 240-240 240Z"/></svg>',
                tooltip: 'code',
                type: CommandType.CodeInline,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M560-160v-520H360v-120h520v120H680v520H560Zm-360 0v-320H80v-120h360v120H320v320H200Z"/></svg>',
                tooltip: 'small',
                type: CommandType.Small,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>',
                tooltip: 'inserted',
                type: CommandType.Inserted,
            },
        ],
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M420-160v-520H200v-120h560v120H540v520H420Z"/></svg>',
        isStyle: true,
        tooltip: 'block type',
        style: ToolbarControlStyle.Dropdown,
        buttons: [
            {
                text: 'Heading 1',
                type: CommandType.Heading,
                params: [1],
            },
            {
                text: 'Heading 2',
                type: CommandType.Heading,
                params: [2],
            },
            {
                text: 'Heading 3',
                type: CommandType.Heading,
                params: [3],
            },
            {
                text: 'Heading 4',
                type: CommandType.Heading,
                params: [4],
            },
            {
                text: 'Heading 5',
                type: CommandType.Heading,
                params: [5],
            },
            {
                text: 'Heading 6',
                type: CommandType.Heading,
                params: [6],
            },
            {
                text: 'Paragraph',
                type: CommandType.Paragraph,
            },
            {
                text: 'Block quote',
                type: CommandType.BlockQuote,
            },
            {
                text: 'Code block',
                type: CommandType.CodeBlock,
            },
        ],
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg class="active" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m770-302-60-62q40-11 65-42.5t25-73.5q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 57-29.5 105T770-302ZM634-440l-80-80h86v80h-6ZM792-56 56-792l56-56 736 736-56 56ZM440-280H280q-83 0-141.5-58.5T80-480q0-69 42-123t108-71l74 74h-24q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h65l79 80H320Z"/></svg>',
        inactiveIcon: '<svg class="inactive" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>',
        isStyle: true,
        tooltip: 'link',
        type: CommandType.InsertLink,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg>',
        isStyle: true,
        tooltip: 'image',
        type: CommandType.InsertImage,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm0-240q-33 0-56.5-23.5T120-720q0-33 23.5-56.5T200-800q33 0 56.5 23.5T280-720q0 33-23.5 56.5T200-640Z"/></svg>',
        isStyle: true,
        tooltip: 'list',
        type: CommandType.ListBullet,
        style: ToolbarControlStyle.ButtonGroup,
        buttons: [
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h120q17 0 28.5 11.5T280-280v40q0 17-11.5 28.5T240-200q17 0 28.5 11.5T280-160v40q0 17-11.5 28.5T240-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h60v-30H120v-60h120q17 0 28.5 11.5T280-560v70q0 17-11.5 28.5T240-450h-60v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z"/></svg>',
                type: CommandType.ListNumber,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M222-200 80-342l56-56 85 85 170-170 56 57-225 226Zm0-320L80-662l56-56 85 85 170-170 56 57-225 226Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z"/></svg>',
                type: CommandType.ListCheck,
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M120-120v-80h720v80H120Zm320-160v-80h400v80H440Zm0-160v-80h400v80H440Zm0-160v-80h400v80H440ZM120-760v-80h720v80H120Zm160 440L120-480l160-160v320Z"/></svg>',
        isStyle: true,
        isWysiwyg: true,
        tooltip: 'lift out',
        type: CommandType.UpLevel,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M120-120v-80h720v80H120Zm320-160v-80h400v80H440Zm0-160v-80h400v80H440Zm0-160v-80h400v80H440ZM120-760v-80h720v80H120Zm0 440v-320l160 160-160 160Z"/></svg>',
        isStyle: true,
        isWysiwyg: true,
        tooltip: 'indent',
        type: CommandType.DownLevel,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M80 0v-160h800V0H80Zm504-480L480-584 320-424l103 104 161-160Zm-47-160 103 103 160-159-104-104-159 160Zm-84-29 216 216-189 190q-24 24-56.5 24T367-263l-27 23H140l126-125q-24-24-25-57.5t23-57.5l189-189Zm0 0 187-187q24-24 56.5-24t56.5 24l104 103q24 24 24 56.5T857-640L669-453 453-669Z"/></svg>',
        isStyle: true,
        tooltip: 'highlight',
        type: CommandType.Marked,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        tooltip: 'foreground color',
        type: CommandType.ForegroundColor,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m247-904 57-56 343 343q23 23 23 57t-23 57L457-313q-23 23-57 23t-57-23L153-503q-23-23-23-57t23-57l190-191-96-96Zm153 153L209-560h382L400-751Zm360 471q-33 0-56.5-23.5T680-360q0-21 12.5-45t27.5-45q9-12 19-25t21-25q11 12 21 25t19 25q15 21 27.5 45t12.5 45q0 33-23.5 56.5T760-280ZM80 0v-160h800V0H80Z"/></svg>',
        isStyle: true,
        tooltip: 'background color',
        type: CommandType.BackgroundColor,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M120-120v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Z"/></svg>',
        isStyle: true,
        tooltip: 'align left',
        type: CommandType.AlignLeft,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M120-120v-80h720v80H120Zm160-160v-80h400v80H280ZM120-440v-80h720v80H120Zm160-160v-80h400v80H280ZM120-760v-80h720v80H120Z"/></svg>',
        isStyle: true,
        tooltip: 'align center',
        type: CommandType.AlignCenter,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M120-760v-80h720v80H120Zm240 160v-80h480v80H360ZM120-440v-80h720v80H120Zm240 160v-80h480v80H360ZM120-120v-80h720v80H120Z"/></svg>',
        isStyle: true,
        tooltip: 'align right',
        type: CommandType.AlignRight,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200v-80h560v80H200Zm76-160 164-440h80l164 440h-76l-38-112H392l-40 112h-76Zm138-176h132l-64-182h-4l-64 182Z"/></svg>',
        isStyle: true,
        tooltip: 'font',
        style: ToolbarControlStyle.Dropdown,
        buttons: [
            {
                text: 'Reset',
                type: CommandType.SetFontFamily,
                params: [null],
            },
            {
                text: 'sans-serif',
                type: CommandType.SetFontFamily,
                params: ['sans-serif'],
            },
            {
                text: 'serif',
                type: CommandType.SetFontFamily,
                params: ['serif'],
            },
            {
                text: 'monospace',
                type: CommandType.SetFontFamily,
                params: ['monospace'],
            },
            {
                text: 'cursive',
                type: CommandType.SetFontFamily,
                params: ['cursive'],
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M560-160v-520H360v-120h520v120H680v520H560Zm-360 0v-320H80v-120h360v120H320v320H200Z"/></svg>',
        isStyle: true,
        tooltip: 'font size',
        type: CommandType.SetFontSize,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M240-160 80-320l56-56 64 62v-332l-64 62-56-56 160-160 160 160-56 56-64-62v332l64-62 56 56-160 160Zm240-40v-80h400v80H480Zm0-240v-80h400v80H480Zm0-240v-80h400v80H480Z"/></svg>',
        isStyle: true,
        tooltip: 'line height',
        type: CommandType.SetLineHeight,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        style: ToolbarControlStyle.Separator,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200Zm80-400h560v-160H200v160Zm213 200h134v-120H413v120Zm0 200h134v-120H413v120ZM200-400h133v-120H200v120Zm427 0h133v-120H627v120ZM200-200h133v-120H200v120Zm427 0h133v-120H627v120Z"/></svg>',
        isStyle: true,
        isWysiwyg: true,
        tooltip: 'insert table',
        type: CommandType.InsertTable,
        style: ToolbarControlStyle.ButtonGroup,
        buttons: [
            {
                text: 'Insert Column Before',
                type: CommandType.TableInsertColumnBefore,
            },
            {
                text: 'Insert Column After',
                type: CommandType.TableInsertColumnAfter,
            },
            {
                text: 'Toggle Header Column',
                type: CommandType.TableToggleHeaderColumn,
            },
            {
                text: 'Delete Column',
                type: CommandType.TableDeleteColumn,
            },
            {
                separatorBefore: true,
                text: 'Insert Row Before',
                type: CommandType.TableInsertRowBefore,
            },
            {
                text: 'Insert Row After',
                type: CommandType.TableInsertRowAfter,
            },
            {
                text: 'Toggle Header Row',
                type: CommandType.TableToggleHeaderRow,
            },
            {
                text: 'Delete Row',
                type: CommandType.TableDeleteRow,
            },
            {
                separatorBefore: true,
                text: 'Merge Cells',
                type: CommandType.TableMergeCells,
            },
            {
                text: 'Split Cell',
                type: CommandType.TableSplitCell,
            },
            {
                separatorBefore: true,
                text: 'Full Width',
                type: CommandType.TableFullWidth,
            },
            {
                separatorBefore: true,
                text: 'Delete Table',
                type: CommandType.TableDelete,
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200Zm80-400h560v-160H200v160Zm213 200h134v-120H413v120Zm0 200h134v-120H413v120ZM200-400h133v-120H200v120Zm427 0h133v-120H627v120ZM200-200h133v-120H200v120Zm427 0h133v-120H627v120Z"/></svg>',
        isStyle: true,
        isWysiwyg: false,
        tooltip: 'insert table',
        type: CommandType.InsertTable,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M160-440v-80h640v80H160Z"/></svg>',
        isStyle: true,
        tooltip: 'horizontal rule',
        type: CommandType.HorizontalRule,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M240-80q-33 0-56.5-23.5T160-160v-120h640v120q0 33-23.5 56.5T720-80H240Zm280-520h200L520-800v200ZM360-360v-80h240v80H360Zm320 0v-80h240v80H680Zm-640 0v-80h240v80H40Zm120-160v-280q0-33 23.5-56.5T240-880h320l240 240v120H160Z"/></svg>',
        isStyle: true,
        tooltip: 'page break',
        type: CommandType.PageBreak,
        style: ToolbarControlStyle.Button,
    }, {
        isStyle: true,
        tooltip: 'insert emoji',
        type: CommandType.Emoji,
        style: ToolbarControlStyle.Button,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M320-240 80-480l240-240 57 57-184 184 183 183-56 56Zm320 0-57-57 184-184-183-183 56-56 240 240-240 240Z"/></svg>',
        isStyle: true,
        isWysiwyg: true,
        separatorBefore: true,
        tooltip: 'set code block syntax',
        style: ToolbarControlStyle.Dropdown,
        buttons: syntaxes.map(x => {
            return {
                text: syntaxLabelMap[x],
                type: CommandType.SetCodeSyntax,
                params: [x],
            };
        }),
    }];