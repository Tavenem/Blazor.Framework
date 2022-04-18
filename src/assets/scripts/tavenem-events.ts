interface IEventInfo {
    [property: string]: boolean | number | string | ((event: Event) => void) | string[] | DotNet.DotNetObject | undefined;
    correctOffset?: boolean;
    delay?: number;
    elementId?: string;
    eventName?: string;
    handler?: (event: Event) => void;
    offsetX?: number;
    offsetY?: number;
    properties?: string[];
    reference?: DotNet.DotNetObject;
    debounce?: boolean;
}

class ThrottledEventManager {
    eventMap: Record<string, IEventInfo>;

    constructor() {
        this.eventMap = {};
    }

    subscribe(
        eventName: string,
        elementId: string,
        correctOffset: boolean,
        throttle: number,
        key: string,
        properties: string[],
        dotNetReference: DotNet.DotNetObject) {
        const handlerRef = this.throttleEventHandler.bind(this, key);

        const elem = document.getElementById(elementId);
        if (!elem) {
            return;
        }

        elem.addEventListener(eventName, handlerRef, false);

        this.eventMap[key] = {
            correctOffset: correctOffset,
            delay: throttle,
            elementId: elementId,
            eventName: eventName,
            handler: handlerRef,
            properties: properties,
            reference: dotNetReference,
        };
    }

    unsubscribe(key: string) {
        const entry = this.eventMap[key];
        if (!entry
            || !entry.elementId
            || !entry.eventName
            || !entry.handler) {
            return;
        }

        delete entry.reference;

        const element = document.getElementById(entry.elementId);
        if (element) {
            element.removeEventListener(entry.eventName, entry.handler, false);
        }

        delete this.eventMap[key];
    }

    private clearDebounce(key: string) {
        const entry = this.eventMap[key];
        if (entry && entry.debounce) {
            delete entry.debounce;
        }
    }

    private correctOffset(eventEntry: IEventInfo, event: Event) {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        if (event instanceof MouseEvent) {
            const offset = target.getBoundingClientRect();
            eventEntry.offsetX = event.clientX - offset.x;
            eventEntry.offsetY = event.clientY - offset.y;
        } else if (event instanceof TouchEvent
            && event.targetTouches.length > 0) {
            const touch = event.targetTouches[1];
            const offset = target.getBoundingClientRect();
            eventEntry.offsetX = touch.clientX - offset.x;
            eventEntry.offsetY = touch.clientY - offset.y;
        }
    }

    private throttleEventHandler(key: string, event: Event) {
        const entry = this.eventMap[key];
        if (!entry
            || entry.debounce
            || !entry.elementId
            || !entry.reference
            || !entry.properties) {
            return;
        }

        const element = document.getElementById(entry.elementId);
        if (element != event.srcElement) {
            return;
        }

        entry.debounce = true;

        const eventEntry: IEventInfo = {};
        for (var i = 0; i < entry.properties.length; i++) {
            eventEntry[entry.properties[i]] = (event as any)[entry.properties[i]];
        }

        if (entry.correctOffset) {
            this.correctOffset(eventEntry, event);
        }

        entry.reference.invokeMethodAsync('OnEventOccur', key, JSON.stringify(eventEntry));

        window.setTimeout(
            this.clearDebounce.bind(this, key),
            entry.delay);
    }
}
const throttledEventManager = new ThrottledEventManager();

export function subscribe(
    eventName: string,
    elementId: string,
    correctOffset: boolean,
    throttle: number,
    key: string,
    properties: string[],
    dotNetReference: DotNet.DotNetObject) {
    throttledEventManager.subscribe(
        eventName,
        elementId,
        correctOffset,
        throttle,
        key,
        properties,
        dotNetReference);
}

export function unsubscribe(key: string) {
    throttledEventManager.unsubscribe(key);
}