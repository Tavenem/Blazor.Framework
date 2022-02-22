/// <reference types="./node_modules/@types/blazor__javascript-interop" />

interface IFocusableElement extends HTMLElement {
    savedFocus?: IFocusableElement | undefined | null;
}

interface IBoundingClientRect extends DOMRect {
    scrollY: number;
    scrollX: number;
    windowHeight: number;
    windowWidth: number;
}

interface HeadingData {
    id: string;
    isActive: boolean;
    level: number;
    title: string;
}

class ElementReference {
    eventListeners: Record<number, EventListener>;
    listenerId: number;

    constructor() {
        this.eventListeners = {};
        this.listenerId = 0;
    }

    addEventListener(
        element: Element,
        dotNetRef: DotNet.DotNetObject,
        event: string,
        callback: string,
        spec: Record<string, any>[],
        stopPropagation: boolean) {
        const listener = function (e: Event) {
            const args = Array.from(spec, x => serializeParameter(e, x));
            dotNetRef.invokeMethodAsync(callback, ...args);
            if (stopPropagation) {
                e.stopPropagation();
            }
        };
        element.addEventListener(event, listener);
        this.eventListeners[++this.listenerId] = listener;
        return this.listenerId;
    }

    changeCssClassName(element: Element, className: string) {
        if (element) {
            element.className = className;
        }
    }

    changeCssVariable(element: HTMLElement, name: string, newValue: string) {
        if (element) {
            element.style.setProperty(name, newValue);
        }
    }

    focus(element: HTMLElement) {
        if (element) {
            element.focus();
        }
    }

    focusFirst(element: HTMLElement, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            } else {
                const tabbable = tabbables[skip];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }

    focusLast(element: HTMLElement, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            } else {
                const tabbable = tabbables[tabbables.length - skip - 1];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }

    getBoundingClientRect(element: HTMLElement) {
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

    getClientRectFromFirstChild(element: HTMLElement) {
        if (!element) {
            return;
        }
        const child = element.children && element.children[0];
        if (!child || !(child instanceof HTMLElement)) {
            return;
        }
        return this.getBoundingClientRect(child);
    }

    getClientRectFromParent(element: HTMLElement) {
        if (!element) {
            return;
        }
        const parent = element.parentElement;
        if (!parent) {
            return;
        }
        return this.getBoundingClientRect(parent);
    }

    hasFixedAncestors(element: Node | null) {
        for (; element && element instanceof Element; element = element.parentNode) {
            if (window.getComputedStyle(element).getPropertyValue("position") === "fixed") {
                return true;
            }
        }
        return false;
    }

    removeEventListener(element: Element, event: string, eventId: number) {
        element.removeEventListener(event, this.eventListeners[eventId]);
        delete this.eventListeners[eventId];
    }

    restoreFocus(element: IFocusableElement) {
        if (element) {
            let previous = element.savedFocus;
            delete element.savedFocus;
            if (previous) {
                previous.focus();
            }
        }
    }

    saveFocus(element: IFocusableElement) {
        if (element && document.activeElement instanceof HTMLElement) {
            element.savedFocus = document.activeElement;
        }
    }

    select(element: HTMLInputElement) {
        if (element) {
            element.select();
        }
    }

    selectRange(element: HTMLInputElement, pos1: number, pos2: number) {
        if (element) {
            if (element.setSelectionRange) {
                element.setSelectionRange(pos1, pos2);
            } else if (element.selectionStart) {
                element.selectionStart = pos1;
                element.selectionEnd = pos2;
            }
            element.focus();
        }
    }
}
const elementReference = new ElementReference();

export function addEventListener(
    element: Element,
    dotNetRef: DotNet.DotNetObject,
    event: string,
    callback: string,
    spec: Record<string, any>[],
    stopPropagation: boolean) {
    return elementReference.addEventListener(
        element,
        dotNetRef,
        event,
        callback,
        spec,
        stopPropagation);
}

export function changeCssClassName(element: Element, className: string) {
    elementReference.changeCssClassName(element, className);
}

export function changeCssVariable(element: HTMLElement, name: string, newValue: string) {
    elementReference.changeCssVariable(element, name, newValue);
}

export function focusFirstElement(element: HTMLElement, skip = 0, min = 0) {
    elementReference.focusFirst(element, skip, min);
}

export function focusLastElement(element: HTMLElement, skip = 0, min = 0) {
    elementReference.focusLast(element, skip, min);
}

export function getBoundingClientRect(element: HTMLElement) {
    return elementReference.getBoundingClientRect(element);
}

export function getClientRectFromFirstChild(element: HTMLElement) {
    return elementReference.getClientRectFromFirstChild(element);
}

export function getClientRectFromParent(element: HTMLElement) {
    return elementReference.getClientRectFromParent(element);
}

export function getHeadings(className: string): HeadingData[] {
    const elements = document.getElementsByClassName(className);
    if (elements.length === 0) {
        return [];
    }

    let ids = [] as HeadingData[];
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].id) {
            let title = elements[i].getAttribute("data-title");
            if (!title) {
                title = elements[i].textContent;
            }
            if (title) {
                let level = 0;
                if (elements[i].tagName.startsWith('H')
                    && elements[i].tagName.length === 2) {
                    level = Number.parseInt(elements[i].tagName[1]);
                }
                ids.push({
                    id: elements[i].id,
                    isActive: elements[i].classList.contains("scroll-active"),
                    level,
                    title,
                });
            }
        }
    }

    return ids;
}

export function elementHasFixedAncestors(element: Node | null) {
    return elementReference.hasFixedAncestors(element);
}

export function removeEventListener(element: Element, event: string, eventId: number) {
    elementReference.removeEventListener(element, event, eventId);
}

export function restoreElementFocus(element: IFocusableElement) {
    elementReference.restoreFocus(element);
}

export function saveElementFocus(element: IFocusableElement) {
    elementReference.saveFocus(element);
}

export function select(element: HTMLInputElement) {
    elementReference.select(element);
}

export function selectRange(element: HTMLInputElement, pos1: number, pos2: number) {
    elementReference.selectRange(element, pos1, pos2);
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
        "input:not([disabled]):not([tabindex='-1']):not([type='hidden'])," +
        "select:not([disabled]):not([tabindex='-1'])," +
        "textarea:not([disabled]):not([tabindex='-1'])," +
        "iframe:not([tabindex='-1'])," +
        "details:not([tabindex='-1'])," +
        "[tabindex]:not([tabindex='-1'])," +
        "[contentEditable=true]:not([tabindex='-1']"
    );
}

function serializeParameter(data: any, spec: any) {
    if (typeof data == "undefined" ||
        data === null) {
        return null;
    }
    if (typeof data === "number" ||
        typeof data === "string" ||
        typeof data == "boolean") {
        return data;
    }

    let res: any = (Array.isArray(data)) ? [] : {};
    if (!spec) {
        spec = "*";
    }

    for (let i in data) {
        let currentMember = data[i];

        if (typeof currentMember === 'function' || currentMember === null) {
            continue;
        }

        let currentMemberSpec;
        if (spec != "*") {
            currentMemberSpec = Array.isArray(data) ? spec : spec[i];
            if (!currentMemberSpec) {
                continue;
            }
        } else {
            currentMemberSpec = "*"
        }

        if (typeof currentMember === 'object') {
            if (Array.isArray(currentMember) || currentMember.length) {
                res[i] = [];
                for (let j = 0; j < currentMember.length; j++) {
                    const arrayItem = currentMember[j];
                    if (typeof arrayItem === 'object') {
                        res[i].push(serializeParameter(arrayItem, currentMemberSpec));
                    } else {
                        res[i].push(arrayItem);
                    }
                }
            } else {
                //the browser provides some member (like plugins) as hash with index as key, if length == 0 we shall not convert it
                if (currentMember.length === 0) {
                    res[i] = [];
                } else {
                    res[i] = serializeParameter(currentMember, currentMemberSpec);
                }
            }


        } else {
            // string, number or boolean
            if (currentMember === Infinity) { //inifity is not serialized by JSON.stringify
                currentMember = "Infinity";
            }
            if (currentMember !== null) { //needed because the default json serializer in jsinterop serialize null values
                res[i] = currentMember;
            }
        }
    }

    return res;
}
