import { EditorSelection, EditorState, StateCommand, Transaction } from '@codemirror/state';
import { undo, redo } from '@codemirror/commands';
import {
    CodeCommandSet,
    CommandType,
    htmlWrapCommand,
    ParamStateCommand,
    wrapCommand
} from './_schemas';

export const htmlCommands: CodeCommandSet = {};
htmlCommands[CommandType.Undo] = _ => undo;
htmlCommands[CommandType.Redo] = _ => redo;
htmlCommands[CommandType.Heading] = params => {
    let level = 1;
    if (params && params.length) {
        const i = Number.parseInt(params[0]);
        if (i >= 1) {
            level = i;
        }
    }
    const tag = `<h${level}>`;
    const closeTag = `</h${level}>`;
    return (target: {
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
    }) => {
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: closeTag },
            ],
        }))));
        return true;
    }
};
htmlCommands[CommandType.Paragraph] = wrapCommand("\n<p>\n", "\n</p>\n");
htmlCommands[CommandType.BlockQuote] = wrapCommand("\n<blockquote>\n", "\n</blockquote>\n");
htmlCommands[CommandType.CodeBlock] = wrapCommand("\n<pre>\n<code>", "</code>\n</pre>\n");
htmlCommands[CommandType.Strong] = htmlWrapCommand("strong");
htmlCommands[CommandType.Bold] = htmlWrapCommand("b");
htmlCommands[CommandType.Emphasis] = htmlWrapCommand("em");
htmlCommands[CommandType.Italic] = htmlWrapCommand("i");
htmlCommands[CommandType.Underline] = htmlWrapCommand("u");
htmlCommands[CommandType.Small] = htmlWrapCommand("small");
htmlCommands[CommandType.Strikethrough] = htmlWrapCommand("del");
htmlCommands[CommandType.Subscript] = htmlWrapCommand("sub");
htmlCommands[CommandType.Superscript] = htmlWrapCommand("sup");
htmlCommands[CommandType.Inserted] = htmlWrapCommand("ins");
htmlCommands[CommandType.Marked] = htmlWrapCommand("mark");
htmlCommands[CommandType.CodeInline] = htmlWrapCommand("code");
htmlCommands[CommandType.ForegroundColor] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const color = params[0] as string | null;
    if (!color) {
        return _ => false;
    }
    return (target: {
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
    }) => {
        const tag = `<span style="color:${color}">`;
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: "</span>" },
            ],
        }))));
        return true;
    }
};
htmlCommands[CommandType.BackgroundColor] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const color = params[0] as string | null;
    if (!color) {
        return _ => false;
    }
    return (target: {
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
    }) => {
        const tag = `<div style="background-color:${color}">\n`;
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: "\n</div>" },
            ],
        }))));
        return true;
    }
};
htmlCommands[CommandType.InsertImage] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const src = params[0] as string | null;
    if (!src) {
        return _ => false;
    }
    let title: string | null = null;
    if (params.length > 1) {
        title = params[1];
    }
    let alt: string | null = null;
    if (params.length > 2 && params[2]) {
        alt = params[2];
    }
    return (target: {
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
    }) => {
        let text = `<img src="${src}"`;
        if (title) {
            text += ` title=${title}`;
        }
        if (alt) {
            text += ` alt=${alt}`;
        }
        text += ">";
        target.dispatch(target.state.update(target.state.replaceSelection(text)));
        return true;
    }
};
htmlCommands[CommandType.InsertLink] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const href = params[0] as string | null;
    if (!href) {
        return _ => false;
    }
    let title: string | null = null;
    if (params.length > 1) {
        title = params[1];
    }
    return (target: {
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
    }) => {
        let tag = `<a href="${href}"`;
        if (title) {
            tag += ` title=${title}`;
        }
        tag += ">";

        if (target.state.selection.ranges.some(x => !x.empty)) {
            target.dispatch(target.state.update(target.state.changeByRange(range => ({
                range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
                changes: [
                    { from: range.from, insert: tag },
                    { from: range.to, insert: "</a>" },
                ],
            }))));
        } else {
            target.dispatch(target.state.update(target.state.replaceSelection(tag + (title || href) + "</a>")));
        }

        return true;
    }
};
htmlCommands[CommandType.ListBullet] = wrapCommand("\n<ul>\n<li>", "</li>\n</ul>\n");
htmlCommands[CommandType.ListNumber] = wrapCommand("\n<ol>\n<li>", "</li>\n</ol>\n");
htmlCommands[CommandType.ListCheck] = wrapCommand('\n<ul>\n<li><input type="checkbox">', "</li>\n</ul>\n");
htmlCommands[CommandType.HorizontalRule] = _ => (target: {
    state: EditorState;
    dispatch: (transaction: Transaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection("<hr>")));
    return true;
};
htmlCommands[CommandType.InsertTable] = _ => (target: {
    state: EditorState;
    dispatch: (transaction: Transaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection("\n<table>\n<thead>\n<tr>\n<th></th>\n<th></th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td></td>\n</tr>\n</tbody>\n</table>\n")));
    return true;
};
htmlCommands[CommandType.SetFontFamily] = setInlineStyleCommand('font-family');
htmlCommands[CommandType.SetFontSize] = setInlineStyleCommand('font-size');
htmlCommands[CommandType.SetLineHeight] = setInlineStyleCommand('line-height');
htmlCommands[CommandType.AlignLeft] = setStyleCommand('text-align', 'left');
htmlCommands[CommandType.AlignCenter] = setStyleCommand('text-align', 'center');
htmlCommands[CommandType.AlignRight] = setStyleCommand('text-align', 'right');
htmlCommands[CommandType.PageBreak] = setStyleCommand('page-break-after', 'always');
htmlCommands[CommandType.Emoji] = params => (target: {
    state: EditorState;
    dispatch: (transaction: Transaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection(params && params.length && params[0] && params[0].length ? params[0] : '')));
    return true;
};

function setInlineStyleCommand(style: string, value?: string): ParamStateCommand {
    return (params: any[] | undefined): StateCommand => {
        if (!value && (!params || !params.length)) {
            return _ => false;
        }
        const tag = `<span style="${style}=${value || params![0]}">`;
        return (target: {
            state: EditorState;
            dispatch: (transaction: Transaction) => void;
        }) => {
            target.dispatch(target.state.update(target.state.changeByRange(range => ({
                range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
                changes: [
                    { from: range.from, insert: tag },
                    { from: range.to, insert: "</span>" },
                ],
            }))));
            return true;
        };
    }
}

function setStyleCommand(style: string, value?: string): ParamStateCommand {
    return (params: any[] | undefined): StateCommand => {
        if (!value && (!params || !params.length)) {
            return _ => false;
        }
        const tag = `\n<div style="${style}=${value || params![0]}">\n`;
        return (target: {
            state: EditorState;
            dispatch: (transaction: Transaction) => void;
        }) => {
            target.dispatch(target.state.update(target.state.changeByRange(range => ({
                range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
                changes: [
                    { from: range.from, insert: tag },
                    { from: range.to, insert: "\n</div>\n" },
                ],
            }))));
            return true;
        };
    }
}
