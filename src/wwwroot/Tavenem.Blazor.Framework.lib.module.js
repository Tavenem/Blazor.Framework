let afterStartedComplete = false;
let beforeStartComplete = false;
let tfLocation = window.location.protocol + '//' + window.location.host + window.location.pathname;

function tavenemBlazorFrameworkAfterStarted(blazor, web) {
    if (afterStartedComplete) {
        return;
    }
    afterStartedComplete = true;

    blazor.registerCustomEventType('crop', {
        createEventArgs: (event) => {
            if (event instanceof CustomEvent
                && event.detail) {
                return {
                    x: event.detail.x == null ? 0 : event.detail.x,
                    y: event.detail.y == null ? 0 : event.detail.y,
                    width: event.detail.width == null ? 0 : event.detail.width,
                    height: event.detail.height == null ? 0 : event.detail.height,
                };
            } else {
                return {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                };
            }
        }
    });
    blazor.registerCustomEventType('delete', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    ? event.detail.value
                    : undefined
            };
        }
    });
    blazor.registerCustomEventType('enter', {
        createEventArgs: () => {
            return {};
        }
    });
    blazor.registerCustomEventType('inputtoggle', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    ? event.detail.value
                    : null
            };
        }
    });
    blazor.registerCustomEventType('lastpage', {
        createEventArgs: () => {
            return {};
        }
    });
    blazor.registerCustomEventType('nextpage', {
        createEventArgs: () => {
            return {};
        }
    });
    blazor.registerCustomEventType('searchinput', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    && event.detail.value
            };
        }
    });
    blazor.registerCustomEventType('stream', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    && event.detail.value
            };
        }
    });
    blazor.registerCustomEventType('valuechange', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    && event.detail.value
            };
        }
    });
    blazor.registerCustomEventType('valueinput', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    && event.detail.value
            };
        }
    });
}

function tavenemBlazorFrameworkBeforeStart(web) {
    if (beforeStartComplete) {
        return;
    }
    beforeStartComplete = true;

    addHeadContent();
}

export function beforeStart() { tavenemBlazorFrameworkBeforeStart(false); }

export function beforeWebStart() { tavenemBlazorFrameworkBeforeStart(true); }

export function afterStarted(blazor) { tavenemBlazorFrameworkAfterStarted(blazor, false); }

export function afterWebStarted(blazor) { tavenemBlazorFrameworkAfterStarted(blazor, false); }

function addHeadContent() {
    const fontPreconnect = document.createElement('link');
    fontPreconnect.rel = 'preconnect';
    fontPreconnect.href = "https://fonts.googleapis.com";
    document.head.appendChild(fontPreconnect);

    const fontPreconnectCrossorigin = document.createElement('link');
    fontPreconnectCrossorigin.rel = 'preconnect';
    fontPreconnectCrossorigin.href = "https://fonts.gstatic.com";
    fontPreconnectCrossorigin.crossOrigin = '';
    document.head.appendChild(fontPreconnectCrossorigin);

    const fallbackFont = document.createElement('link');
    fallbackFont.rel = 'stylesheet';
    fallbackFont.type = 'text/css';
    fallbackFont.href = "https://fonts.googleapis.com/css2?family=Encode+Sans+SC:wdth,wght@75,100..900&family=Recursive:slnt,wght,CASL,MONO@-15..0,300..1000,0..1,0..1&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0..1,-25..0&family=Noto+Color+Emoji&display=block";
    document.head.appendChild(fallbackFont);

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = "_content/Tavenem.Blazor.Framework/tavenem-framework.css";
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.type = 'module';
    script.src = './_content/Tavenem.Blazor.Framework/tavenem-framework.js';
    script.async = true;
    document.head.appendChild(script);

}

function fixTablesOfContents() {
    document
        .querySelectorAll('tf-contents')
        .forEach(x => x.refresh());
}

function scrollToTopOnLoad() {
    const path = window.location.protocol + '//' + window.location.host + window.location.pathname;
    if (path != tfLocation)
    {
        tfLocation = path;

        setTimeout(() => {
            const main = document.querySelector('main');
            if (main) {
                main.scroll({
                    top: 0,
                    left: 0,
                });
            }
        }, 50);
    }
}

function onEnhancedLoad() {
    addHeadContent();
    fixTablesOfContents();
    scrollToTopOnLoad();
}

document.addEventListener('DOMContentLoaded', () => {
    Blazor.addEventListener('enhancedload', onEnhancedLoad);
});