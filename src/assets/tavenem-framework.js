window.tavenem = window.tavenem || {};
window.tavenem.framework = window.tavenem.framework || {};
export function cancelScrollListener(selector) {
    const element = selector
        ? document.querySelector(selector)
        : document.documentElement;
    if (element instanceof HTMLElement) {
        element.removeEventListener('scroll', throttleScrollHandler);
    }
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
                ids.push({
                    id: elements[i].id,
                    title,
                });
            }
        }
    }
    return ids;
}
export function getPreferredColorScheme() {
    if (window.tavenem.framework._manualColorTheme
        && window.tavenem.framework._theme) {
        return window.tavenem.framework._theme;
    }
    const local = localStorage.getItem('tavenem-theme');
    if (local) {
        const theme = parseInt(local);
        if (theme === 1 || theme === 2) {
            return theme;
        }
    }
    if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 2;
        }
        else {
            return 1;
        }
    }
    return 1;
}
export function listenForScroll(dotnetReference, selector) {
    const element = selector
        ? document.querySelector(selector)
        : document;
    if (!element) {
        return;
    }
    element.addEventListener('scroll', throttleScrollHandler.bind(this, dotnetReference), false);
}
export function scrollSpy(className) {
    window.tavenem.framework._spy = handleScrollSpy.bind(this, className);
    document.addEventListener('scroll', window.tavenem.framework._spy, true);
    window.addEventListener('resize', window.tavenem.framework._spy, true);
}
export function scrollToId(elementId) {
    let element = elementId
        ? document.getElementById(elementId)
        : document.documentElement;
    if (!element) {
        element = document.documentElement;
    }
    if (element instanceof HTMLElement) {
        element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
        });
        if (elementId) {
            history.replaceState(null, '', window.location.pathname + "#" + elementId);
        }
        else {
            history.replaceState(null, '', window.location.pathname);
        }
    }
}
export function setColorScheme(theme, manual) {
    if (manual) {
        window.tavenem.framework._manualColorTheme = (theme !== 0);
    }
    else {
        localStorage.removeItem('tavenem-theme');
        if (window.tavenem.framework._manualColorTheme) {
            return;
        }
    }
    window.tavenem.framework._theme = theme;
    if (theme === 0) {
        theme = getPreferredColorScheme();
    }
    if (theme === 2) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    if (manual) {
        localStorage.setItem('tavenem-theme', theme.toString());
    }
}
function clearLastScrolled() {
    const lastElement = document.getElementById(window.tavenem.framework._lastElement);
    if (lastElement) {
        lastElement.classList.remove("scroll-active");
    }
}
function handleScroll(dotnetReference, event) {
    try {
        const element = event.target;
        if (!(element instanceof HTMLElement)) {
            return;
        }
        const firstChild = element.firstElementChild;
        if (!firstChild) {
            return;
        }
        const firstChildBoundingClientRect = firstChild.getBoundingClientRect();
        const scrollLeft = element.scrollLeft;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const scrollWidth = element.scrollWidth;
        const nodeName = element.nodeName;
        dotnetReference.invokeMethodAsync('RaiseOnScroll', {
            firstChildBoundingClientRect,
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth,
            nodeName,
        });
    }
    catch (error) {
        console.log('Error in handleScroll: ', { error });
    }
}
function handleScrollSpy(className, event) {
    const elements = document.getElementsByClassName(className);
    if (elements.length === 0) {
        clearLastScrolled();
        return;
    }
    const center = window.innerHeight / 2.0;
    let minDifference = Number.MAX_SAFE_INTEGER;
    let elementId = '';
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const rect = element.getBoundingClientRect();
        const diff = Math.abs(rect.top - center);
        if (diff < minDifference) {
            minDifference = diff;
            elementId = element.id;
        }
    }
    const element = document.getElementById(elementId);
    if (!element) {
        clearLastScrolled();
        return;
    }
    if (element.getBoundingClientRect().top < window.innerHeight * 0.8 === false) {
        return;
    }
    if (elementId != window.tavenem.framework._lastElement) {
        clearLastScrolled();
        window.tavenem.framework._lastElement = elementId;
        element.classList.add("scroll-active");
    }
}
function setPreferredColorScheme() {
    setColorScheme(getPreferredColorScheme());
}
function throttleScrollHandler(dotnetReference, event) {
    clearTimeout(window.tavenem.framework._throttleScrollHandlerId);
    window.tavenem.framework._throttleScrollHandlerId = window.setTimeout(handleScroll.bind(this, dotnetReference, event), 100);
}
if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', setPreferredColorScheme);
}
const currentScheme = getPreferredColorScheme();
if (currentScheme === 2) {
    setColorScheme(currentScheme);
}
//# sourceMappingURL=tavenem-framework.js.map