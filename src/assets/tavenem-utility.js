class ElementReference {
    constructor() {
        this.eventListeners = {};
        this.listenerId = 0;
    }
    addEventListener(element, dotNetRef, event, callback, spec, stopPropagation) {
        const listener = function (e) {
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
    changeCssClassName(element, className) {
        if (element) {
            element.className = className;
        }
    }
    changeCssVariable(element, name, newValue) {
        if (element) {
            element.style.setProperty(name, newValue);
        }
    }
    focus(element) {
        if (element) {
            element.focus();
        }
    }
    focusFirst(element, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            }
            else {
                const tabbable = tabbables[skip];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }
    focusLast(element, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            }
            else {
                const tabbable = tabbables[tabbables.length - skip - 1];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }
    getBoundingClientRect(element) {
        if (!element) {
            return;
        }
        const rect = JSON.parse(JSON.stringify(element.getBoundingClientRect()));
        rect.scrollY = window.scrollY || document.documentElement.scrollTop;
        rect.scrollX = window.scrollX || document.documentElement.scrollLeft;
        rect.windowHeight = window.innerHeight;
        rect.windowWidth = window.innerWidth;
        return rect;
    }
    getClientRectFromFirstChild(element) {
        if (!element) {
            return;
        }
        const child = element.children && element.children[0];
        if (!child || !(child instanceof HTMLElement)) {
            return;
        }
        return this.getBoundingClientRect(child);
    }
    getClientRectFromParent(element) {
        if (!element) {
            return;
        }
        const parent = element.parentElement;
        if (!parent) {
            return;
        }
        return this.getBoundingClientRect(parent);
    }
    hasFixedAncestors(element) {
        for (; element && element instanceof Element; element = element.parentNode) {
            if (window.getComputedStyle(element).getPropertyValue("position") === "fixed") {
                return true;
            }
        }
        return false;
    }
    removeEventListener(element, event, eventId) {
        element.removeEventListener(event, this.eventListeners[eventId]);
        delete this.eventListeners[eventId];
    }
    restoreFocus(element) {
        if (element) {
            let previous = element.savedFocus;
            delete element.savedFocus;
            if (previous) {
                previous.focus();
            }
        }
    }
    saveFocus(element) {
        if (element && document.activeElement instanceof HTMLElement) {
            element.savedFocus = document.activeElement;
        }
    }
    select(element) {
        if (element) {
            element.select();
        }
    }
    selectRange(element, pos1, pos2) {
        if (element) {
            if (element.setSelectionRange) {
                element.setSelectionRange(pos1, pos2);
            }
            else if (element.selectionStart) {
                element.selectionStart = pos1;
                element.selectionEnd = pos2;
            }
            element.focus();
        }
    }
}
const elementReference = new ElementReference();
export function addEventListener(element, dotNetRef, event, callback, spec, stopPropagation) {
    return elementReference.addEventListener(element, dotNetRef, event, callback, spec, stopPropagation);
}
export function changeCssClassName(element, className) {
    elementReference.changeCssClassName(element, className);
}
export function changeCssVariable(element, name, newValue) {
    elementReference.changeCssVariable(element, name, newValue);
}
export function focusFirstElement(element, skip = 0, min = 0) {
    elementReference.focusFirst(element, skip, min);
}
export function focusLastElement(element, skip = 0, min = 0) {
    elementReference.focusLast(element, skip, min);
}
export function getBoundingClientRect(element) {
    return elementReference.getBoundingClientRect(element);
}
export function getClientRectFromFirstChild(element) {
    return elementReference.getClientRectFromFirstChild(element);
}
export function getClientRectFromParent(element) {
    return elementReference.getClientRectFromParent(element);
}
export function getHeadings(className) {
    const elements = document.getElementsByClassName(className);
    if (elements.length === 0) {
        return [];
    }
    let ids = [];
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
export function elementHasFixedAncestors(element) {
    return elementReference.hasFixedAncestors(element);
}
export function removeEventListener(element, event, eventId) {
    elementReference.removeEventListener(element, event, eventId);
}
export function restoreElementFocus(element) {
    elementReference.restoreFocus(element);
}
export function saveElementFocus(element) {
    elementReference.saveFocus(element);
}
export function select(element) {
    elementReference.select(element);
}
export function selectRange(element, pos1, pos2) {
    elementReference.selectRange(element, pos1, pos2);
}
export function shake(elementId) {
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
function getTabbableElements(element) {
    return element.querySelectorAll("a[href]:not([tabindex='-1'])," +
        "area[href]:not([tabindex='-1'])," +
        "button:not([disabled]):not([tabindex='-1'])," +
        "input:not([disabled]):not([tabindex='-1']):not([type='hidden'])," +
        "select:not([disabled]):not([tabindex='-1'])," +
        "textarea:not([disabled]):not([tabindex='-1'])," +
        "iframe:not([tabindex='-1'])," +
        "details:not([tabindex='-1'])," +
        "[tabindex]:not([tabindex='-1'])," +
        "[contentEditable=true]:not([tabindex='-1']");
}
function serializeParameter(data, spec) {
    if (typeof data == "undefined" ||
        data === null) {
        return null;
    }
    if (typeof data === "number" ||
        typeof data === "string" ||
        typeof data == "boolean") {
        return data;
    }
    let res = (Array.isArray(data)) ? [] : {};
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
        }
        else {
            currentMemberSpec = "*";
        }
        if (typeof currentMember === 'object') {
            if (Array.isArray(currentMember) || currentMember.length) {
                res[i] = [];
                for (let j = 0; j < currentMember.length; j++) {
                    const arrayItem = currentMember[j];
                    if (typeof arrayItem === 'object') {
                        res[i].push(serializeParameter(arrayItem, currentMemberSpec));
                    }
                    else {
                        res[i].push(arrayItem);
                    }
                }
            }
            else {
                if (currentMember.length === 0) {
                    res[i] = [];
                }
                else {
                    res[i] = serializeParameter(currentMember, currentMemberSpec);
                }
            }
        }
        else {
            if (currentMember === Infinity) {
                currentMember = "Infinity";
            }
            if (currentMember !== null) {
                res[i] = currentMember;
            }
        }
    }
    return res;
}
//# sourceMappingURL=tavenem-utility.js.map