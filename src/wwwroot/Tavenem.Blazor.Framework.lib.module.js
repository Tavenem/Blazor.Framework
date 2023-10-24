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