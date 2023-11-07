let _lastElement: string;
let _spy: (event: Event) => void;

export function scrollSpy(this: any, dotnetReference: DotNet.DotNetObject, selector: string) {
    _spy = handleScrollSpy.bind(this, dotnetReference, selector);
    document.addEventListener('scroll', _spy, true);
    window.addEventListener('resize', _spy, true);
    _spy(null as any);
}

export function scrollToHeading(
    contentsId: string,
    level: number,
    title: string | null,
    block: ScrollLogicalPosition | null,
    setHistory?: boolean) {
    const contents = document.getElementById(contentsId);
    if (!contents) {
        return [];
    }
    const parent = contents.parentNode || document;

    let matches = level <= 0
        ? []
        : Array
            .from(parent.querySelectorAll(`h${level}`))
            .filter(x => x.closest('.editor') == null);
    if (matches.length == 0) {
        matches = Array
            .from(parent.querySelectorAll('.tav-heading'))
            .filter(x => Number.parseInt(x.getAttribute('data-heading-level') || '0') == level
                && x.closest('.editor') == null);
    }
    if (matches.length == 0) {
        return;
    }
    let found: Element | null = null;
    for (var match of matches) {
        if ((title?.length || 0) == 0) {
            if ((!match.hasAttribute('data-heading-title')
                || match.getAttribute('data-heading-title')?.length == 0)
                && (match.textContent?.length || 0) == 0) {
                found = match;
                break;
            }
        } else {
            const matchTitle = match.getAttribute('data-heading-title')
                || match.textContent;
            if (matchTitle == title) {
                found = match;
                break;
            }
        }
    }
    if (found) {
        found.scrollIntoView({
            behavior: "smooth",
            block: block || "start",
            inline: "nearest"
        });
        if (setHistory
            && window.location.hash
            && window.location.hash.length) {
            history.replaceState(null, '', window.location.pathname);
        }
    }
}

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

function clearLastScrolled() {
    const lastElement = document.getElementById(_lastElement);
    if (lastElement) {
        lastElement.classList.remove("scroll-active");
    }
}

function handleScrollSpy(dotnetReference: DotNet.DotNetObject, selector: string, event: Event) {
    const elements = document.querySelectorAll(selector);
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