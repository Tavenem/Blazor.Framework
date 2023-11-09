/// <reference types="./../node_modules/@types/blazor__javascript-interop" />

interface IFocusableElement extends HTMLElement {
    savedFocus?: IFocusableElement | undefined | null;
}

interface IBoundingClientRect extends DOMRect {
    scrollY: number;
    scrollX: number;
    windowHeight: number;
    windowWidth: number;
}

interface DotNetStreamReference {
    arrayBuffer(): Promise<ArrayBuffer>;
}

const fonts = [
    'Arial',
    'Arial Black',
    'Comic Sans MS',
    'Courier New',
    'Georgia',
    'Impact',
    'Microsoft Sans Serif',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
];

export async function downloadStream(fileName: string, fileType: string, streamReference: DotNetStreamReference) {
    const buffer = await streamReference.arrayBuffer();
    const file = new File([buffer], fileName, { type: fileType });
    const url = URL.createObjectURL(file);
    downloadUrl(fileName, url);
    URL.revokeObjectURL(url);
}

export function downloadUrl(fileName: string, url: string, open?: boolean) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = "_blank";
    if (!open) {
        anchor.download = fileName ?? '';
    }
    anchor.click();
    anchor.remove();
}

export function focusFirstElement(element: HTMLElement, skip = 0, min = 0) {
    if (element) {
        const tabbables = getTabbableElements(element);
        if (tabbables.length <= min) {
            element.focus();
        } else if (tabbables.length <= skip) {
            const tabbable = tabbables[tabbables.length - 1];
            if (tabbable instanceof HTMLElement) {
                tabbable.focus();
            }
        } else {
            const tabbable = tabbables[skip];
            if (tabbable instanceof HTMLElement) {
                tabbable.focus();
            }
        }
    }
}

export function focusLastElement(element: HTMLElement, skip = 0, min = 0) {
    if (element) {
        const tabbables = getTabbableElements(element);
        if (tabbables.length <= min) {
            element.focus();
        } else if (tabbables.length - skip - 1 < 0) {
            const tabbable = tabbables[0];
            if (tabbable instanceof HTMLElement) {
                tabbable.focus();
            }
        } else {
            const tabbable = tabbables[tabbables.length - skip - 1];
            if (tabbable instanceof HTMLElement) {
                tabbable.focus();
            }
        }
    }
}

export function getBoundingClientRect(element: HTMLElement) {
    if (!element) {
        return;
    }

    const rect: IBoundingClientRect = JSON.parse(JSON.stringify(element.getBoundingClientRect()));

    rect.scrollY = window.scrollY || document.documentElement.scrollTop;
    rect.scrollX = window.scrollX || document.documentElement.scrollLeft;

    rect.windowHeight = window.innerHeight;
    rect.windowWidth = window.innerWidth;
    return rect;
}

export function getFonts() {
    const validFonts: string[] = [];
    for (const font of fonts) {
        if (document.fonts.check('1em ' + font)) {
            validFonts.push(font);
        }
    }
    return validFonts;
}

export function open(url?: string, target?: string, features?: string) {
    window.open(url, target, features);
}

export async function openStream(fileName: string, fileType: string, streamReference: DotNetStreamReference, revoke: boolean) {
    const buffer = await streamReference.arrayBuffer();
    const file = new File([buffer], fileName, { type: fileType });
    const url = URL.createObjectURL(file);
    downloadUrl(fileName, url, true);
    if (revoke) {
        URL.revokeObjectURL(url);
        return '';
    } else {
        return url;
    }
}

export function restoreElementFocus(element: IFocusableElement) {
    if (element) {
        const previous = element.savedFocus;
        delete element.savedFocus;
        if (previous) {
            previous.focus();
        }
    }
}

export function revokeURL(url: string) {
    URL.revokeObjectURL(url);
}

export function saveElementFocus(element: IFocusableElement) {
    if (element && document.activeElement instanceof HTMLElement) {
        element.savedFocus = document.activeElement;
    }
}

export function select(element: HTMLInputElement) {
    if (element) {
        element.select();
    }
}

export function selectRange(element: HTMLInputElement, start: number, end: number | null) {
    if (element) {
        if (element.setSelectionRange) {
            element.setSelectionRange(start, end);
        } else if (element.selectionStart) {
            element.selectionStart = start;
            element.selectionEnd = end;
        }
        element.focus();
    }
}

export function shake(elementId: string | null) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element || element.classList.contains('shake')) {
        return;
    }

    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 1000);
}

function getTabbableElements(element: HTMLElement) {
    return element.querySelectorAll(
        "a[href]:not([tabindex='-1'])," +
        "area[href]:not([tabindex='-1'])," +
        "button:not([disabled]):not([tabindex='-1'])," +
        "input:not([disabled]):not([tabindex='-1']):not([type='hidden']):not([hidden])," +
        "select:not([disabled]):not([tabindex='-1'])," +
        "textarea:not([disabled]):not([tabindex='-1'])," +
        "iframe:not([tabindex='-1'])," +
        "details:not([tabindex='-1'])," +
        "[tabindex]:not([tabindex='-1'])," +
        "[contentEditable=true]:not([tabindex='-1']"
    );
}
