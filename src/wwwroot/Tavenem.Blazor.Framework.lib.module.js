let afterStartedComplete = false;
let beforeStartComplete = false;

function tavenemBlazorFrameworkAfterStarted(blazor, web) {
    if (afterStartedComplete) {
        return;
    }
    afterStartedComplete = true;

    blazor.registerCustomEventType('focuslost', {
        createEventArgs: (event) => {
            return event;
        }
});
    blazor.registerCustomEventType('dropdowntoggle', {
        createEventArgs: (event) => {
            return {
                value: event instanceof CustomEvent
                    && event.detail
                    && event.detail.value
            }
        }
    });

    console.log(`Tavenem.Blazor.Framework${web ? ' web app' : ''} initialized`);
}

function tavenemBlazorFrameworkBeforeStart(web) {
    if (beforeStartComplete) {
        return;
    }
    beforeStartComplete = true;
    console.log(`Initializing Tavenem.Blazor.Framework${web ? ' web app' : ''}...`);

    const script = document.createElement('script');
    script.type = 'module';
    script.src = './_content/Tavenem.Blazor.Framework/tavenem-framework.js';
    script.async = true;
    document.head.appendChild(script);

    const fontPreconnect = document.createElement('link');
    fontPreconnect.rel = 'preconnect';
    fontPreconnect.href = "https://fonts.googleapis.com";
    document.head.appendChild(fontPreconnect);

    const fontPreconnectCrossorigin = document.createElement('link');
    fontPreconnectCrossorigin.rel = 'preconnect';
    fontPreconnectCrossorigin.href = "https://fonts.gstatic.com";
    fontPreconnectCrossorigin.crossOrigin = '';
    document.head.appendChild(fontPreconnectCrossorigin);

    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.type = 'text/css';
    font.href = "https://fonts.googleapis.com/css2?family=Encode+Sans+SC:wdth,wght@75,100..900&family=Recursive:slnt,wght,CASL,MONO@-15..0,300..1000,0..1,0..1&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0..1,-25..0&display=swap";
    document.head.appendChild(font);

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = "_content/Tavenem.Blazor.Framework/framework.css";
    document.head.appendChild(style);
}

export function beforeStart() { tavenemBlazorFrameworkBeforeStart(false); }

export function beforeWebStart() { tavenemBlazorFrameworkBeforeStart(true); }

export function afterStarted(blazor) { tavenemBlazorFrameworkAfterStarted(blazor, false); }

export function afterWebStarted(blazor) { tavenemBlazorFrameworkAfterStarted(blazor, false); }