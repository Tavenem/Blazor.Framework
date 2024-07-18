import hljs from 'highlight.js/lib/core';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import latex from 'highlight.js/lib/languages/latex';
import markdown from 'highlight.js/lib/languages/markdown';
import objectivec from 'highlight.js/lib/languages/objectivec';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('latex', latex);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('objectivec', objectivec);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

hljs.configure({
    cssSelector: 'tf-syntax-highlight pre code',
    ignoreUnescapedHTML: true,
});

export class TavenemHighlightHTMLElement extends HTMLElement {
    private _mutationObserver: MutationObserver;

    constructor() {
        super();

        this._mutationObserver = new MutationObserver(_ => {
            this.applyHighlighting();
        });
    }

    connectedCallback() {
        this._mutationObserver.observe(this, { characterData: true });

        setTimeout(() => {
            this.applyHighlighting();
        });
    }

    applyHighlighting() {
        hljs.highlightAll();
    }
}