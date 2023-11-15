export function scrollToId(elementId: string | null, block: ScrollLogicalPosition | null, setHistory?: boolean) {
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
        if (setHistory) {
            if (elementId) {
                history.replaceState(null, '', window.location.pathname + "#" + elementId);
            } else {
                history.replaceState(null, '', window.location.pathname);
            }
        }
    }
}

export function scrollToTop(selector: string | null) {
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
    } else if (element instanceof HTMLElement) {
        element.scroll({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }
}