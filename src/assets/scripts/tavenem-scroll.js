let _lastElement;
let _spy;
let _throttleScrollHandlerId;
export function cancelScrollListener(selector) {
    const element = selector
        ? document.querySelector(selector)
        : document.documentElement;
    if (element instanceof HTMLElement) {
        element.removeEventListener('scroll', throttleScrollHandler);
    }
}
export function listenForScroll(dotnetReference, selector) {
    const element = selector
        ? document.querySelector(selector)
        : document;
    if (!element) {
        return;
    }
    element.addEventListener('scroll', throttleScrollHandler.bind(this, dotnetReference));
}
export function scrollSpy(dotnetReference, className) {
    _spy = handleScrollSpy.bind(this, dotnetReference, className);
    document.addEventListener('scroll', _spy, true);
    window.addEventListener('resize', _spy, true);
    _spy(null);
}
export function scrollToId(elementId, block) {
    let element = elementId
        ? document.getElementById(elementId)
        : document.documentElement;
    if (!element) {
        element = document.documentElement;
    }
    if (element instanceof HTMLElement) {
        element.scrollIntoView({
            behavior: "smooth",
            block: block || "start",
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
export function scrollToTop(selector) {
    const element = selector
        ? document.querySelector(selector)
        : document;
    if (!element) {
        return;
    }
    if (element instanceof Document) {
        window.scroll({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }
    else if (element instanceof HTMLElement) {
        element.scroll({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }
}
function clearLastScrolled() {
    const lastElement = document.getElementById(_lastElement);
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
        console.error('Error in handleScroll: ', { error });
    }
}
function handleScrollSpy(dotnetReference, className, event) {
    const elements = document.getElementsByClassName(className);
    if (elements.length === 0) {
        clearLastScrolled();
        return;
    }
    let lowest = Number.MAX_SAFE_INTEGER;
    let lowestAboveZero = Number.MAX_SAFE_INTEGER;
    let lowestElementId = '';
    let lowestElementIdAboveZero = '';
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const rect = element.getBoundingClientRect();
        if (rect.top < lowest) {
            lowest = rect.top;
            lowestElementId = element.id;
        }
        if (rect.top > 0
            && rect.top < lowestAboveZero) {
            lowestAboveZero = rect.top;
            lowestElementIdAboveZero = element.id;
        }
    }
    const element = document.getElementById(lowestElementIdAboveZero)
        ?? document.getElementById(lowestElementId);
    if (!element) {
        clearLastScrolled();
        return;
    }
    if (element.getBoundingClientRect().top < window.innerHeight * 0.8 === false) {
        return;
    }
    const elementId = element.id;
    if (elementId != _lastElement) {
        clearLastScrolled();
        _lastElement = elementId;
        element.classList.add("scroll-active");
        dotnetReference.invokeMethodAsync('RaiseOnScrollSpy', elementId);
    }
}
function throttleScrollHandler(dotnetReference, event) {
    clearTimeout(_throttleScrollHandlerId);
    _throttleScrollHandlerId = window.setTimeout(handleScroll.bind(this, dotnetReference, event), 100);
}
//# sourceMappingURL=tavenem-scroll.js.map