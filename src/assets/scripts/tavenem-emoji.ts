interface Emoji {
    category: string,
    codepoint: string,
    codepoints?: string[],
    hasSkinTones: boolean,
    keywords: string[],
    name: string,
    shortName: string,
    shortNames?: string[]
}

let emojiData: Emoji[];

export class TavenemEmojiHTMLElement extends HTMLElement {
    private _mutationObserver: MutationObserver;
    private _replacing: boolean = false;

    constructor() {
        super();

        this._mutationObserver = new MutationObserver(mutations => {
            if (this._replacing) {
                return;
            }
            let updated = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList'
                    || mutation.type === 'characterData') {
                    updated = true;
                    break;
                }
            }
            if (updated) {
                this.refreshEmoji();
            }
        });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `span {
    font-family: "Noto Color Emoji",
                 system-ui,
                 "Apple Color Emoji",
                 "Segoe UI Emoji",
                 "Segoe UI Symbol",
                 "EmojiOne Color",
                 "Android Emoji",
                 sans-serif;
    font-style: normal;
    font-weight: 400;
}

slot {
    display: none;
}
`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const span = document.createElement('span');
        shadow.appendChild(span);

        this.refreshEmoji();

        this._mutationObserver.observe(this, { characterData: true, childList: true, subtree: true });
    }

    private refreshEmoji() {
        if (this._replacing) {
            return;
        }
        if (!emojiData) {
            fetch("_content/Tavenem.Blazor.Framework/emoji.json")
                .then(response => response.json())
                .then(data => {
                    emojiData = data;
                    this.refreshEmojiInner();
                });
        } else if (emojiData
            && emojiData.length) {
            this.refreshEmojiInner();
        }
    }

    private refreshEmojiInner() {
        if (this._replacing
            || !emojiData
            || !emojiData.length) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const span = root.querySelector('span');
        if (!span) {
            return;
        }

        if (!this.textContent
            || !this.textContent.length) {
            this._replacing = true;
            span.textContent = null;
            this._replacing = false;
            console.log('!this.textContent');
            return;
        }

        const text = trimChar(this.textContent.trim(), ':').trim().toLowerCase();
        if (!text
            || !text.length) {
            this._replacing = true;
            span.textContent = null;
            this._replacing = false;
            console.log('!text');
            return;
        }

        const emoji = emojiData.find(v => v.shortName === text || v.shortNames?.includes(text));
        if (!emoji) {
            console.log('!emoji');
            this._replacing = true;
            span.textContent = this.textContent;
            this._replacing = false;
            return;
        }

        let emojiText = `&#x${emoji.codepoint};`;
        if (emoji.codepoints
            && emoji.codepoints.length) {
            for (let i = 0; i < emoji.codepoints.length; i++) {
                emojiText += `&#x${emoji.codepoints[i]};`;
            }
        }

        this._replacing = true;
        span.innerHTML = emojiText;
        this._replacing = false;
    }
}

function trimChar(str: string, ch: string) {
    let start = 0;
    let end = str.length;

    while (start < end && str[start] === ch) {
        ++start;
    }

    while (end > start && str[end - 1] === ch) {
        --end;
    }

    return (start > 0 || end < str.length)
        ? str.substring(start, end)
        : str;
}