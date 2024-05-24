import { cpp } from "@codemirror/lang-cpp";
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { csharp, objectiveC } from "@codemirror/legacy-modes/mode/clike";
import { less, sCSS } from "@codemirror/legacy-modes/mode/css";
import { typescript } from "@codemirror/legacy-modes/mode/javascript";
import { stex } from "@codemirror/legacy-modes/mode/stex";

export const syntaxes = <const>[
    'none',
    'cpp',
    'csharp',
    'css',
    'html',
    'java',
    'javascript',
    'json',
    'latex',
    'less',
    'markdown',
    'objectivec',
    'php',
    'python',
    'sass',
    'sql',
    'typescript'
];

export type EditorSyntax = typeof syntaxes[number];

export const codeEditorLanguageMap: Record<EditorSyntax, LanguageSupport | StreamLanguage<unknown> | undefined> = {
    "none": undefined,
    "cpp": cpp(),
    "css": css(),
    "html": html(),
    "java": java(),
    "javascript": javascript(),
    "json": json(),
    "markdown": markdown(),
    "php": php(),
    "python": python(),
    "sql": sql(),
    "csharp": StreamLanguage.define(csharp),
    "objectivec": StreamLanguage.define(objectiveC),
    "less": StreamLanguage.define(less),
    "sass": StreamLanguage.define(sCSS),
    "latex": StreamLanguage.define(stex),
    "typescript": StreamLanguage.define(typescript),
};

export const syntaxLabelMap: Record<EditorSyntax, string> = {
    "none": 'Plain text',
    "cpp": 'C++',
    "csharp": 'C#',
    "css": 'CSS',
    "html": 'HTML',
    "java": 'Java',
    "javascript": 'JavaScript',
    "json": 'JSON',
    "latex": `<span style="font-family:'CMU Serif',cmr10,LMRoman10-Regular,'Latin Modern Math','Nimbus Roman No9 L','Times New Roman',Times,serif;">L<span style="text-transform:uppercase;font-size:.75em;vertical-align:.25em;margin-left:-.36em;margin-right:-.15em;line-height:1ex;">a</span>T<span style="text-transform:uppercase;vertical-align:-.25em;margin-left:-.1667em;margin-right:-.125em;line-height:1ex;">e</span>X</span>`,
    "less": 'Less',
    "markdown": 'Markdown',
    "objectivec": 'Objective-C',
    "php": 'PHP',
    "python": 'Python',
    "sass": 'Sass',
    "sql": 'SQL',
    "typescript": 'TypeScript',
};

export const syntaxTextMap: Record<EditorSyntax, string> = {
    "none": 'Plain text',
    "cpp": 'C++',
    "csharp": 'C#',
    "css": 'CSS',
    "html": 'HTML',
    "java": 'Java',
    "javascript": 'JavaScript',
    "json": 'JSON',
    "latex": 'LaTeX',
    "less": 'Less',
    "markdown": 'Markdown',
    "objectivec": 'Objective-C',
    "php": 'PHP',
    "python": 'Python',
    "sass": 'Sass',
    "sql": 'SQL',
    "typescript": 'TypeScript',
};