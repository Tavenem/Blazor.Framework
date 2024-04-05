let afterStartedComplete = false;
let beforeStartComplete = false;
let tfLocation = window.location.protocol + '//' + window.location.host + window.location.pathname;

function tavenemBlazorFrameworkAfterStarted(blazor, web) {
    if (afterStartedComplete) {
        return;
    }
    afterStartedComplete = true;

    blazor.registerCustomEventType('enter', {
        createEventArgs: () => {
            return {};
        }
    });
    blazor.registerCustomEventType('focuslost', {
        createEventArgs: (event) => {
            return {
                parentId: event instanceof CustomEvent
                    && event.detail
                    ? event.detail.parentId
                    : undefined
            };
        }
    });
    blazor.registerCustomEventType('dropdowntoggle', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    && event.detail.value
            };
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
    style.href = "_content/Tavenem.Blazor.Framework/css/framework.css";
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.type = 'module';
    script.src = './_content/Tavenem.Blazor.Framework/tavenem-framework.js';
    script.async = true;
    document.head.appendChild(script);

}

function fixCheckboxes() {
    const cbs = document.querySelectorAll('.checkbox label > .btn > input:is([type="checkbox"])');
    for (var cb of cbs) {
        cb.indeterminate = true;
    }
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
    fixCheckboxes();
}

Blazor.addEventListener('enhancedload', onEnhancedLoad);