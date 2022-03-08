class ResizeObserverInternal {
    constructor(dotNetRef) {
        this._dotNetRef = dotNetRef;
        this._observervedElements = [];
        this._throttleResizeHandlerId = -1;
        this._resizeObserver = new ResizeObserver(entries => {
            const changes = [];
            for (const entry of entries) {
                const target = entry.target;
                const affectedObservedElement = this._observervedElements.find((x) => x.element == target);
                if (affectedObservedElement) {
                    if (affectedObservedElement.isInitilized) {
                        changes.push({
                            id: affectedObservedElement.id,
                            size: entry.target.getBoundingClientRect(),
                        });
                    }
                    else {
                        affectedObservedElement.isInitilized = true;
                    }
                }
            }
            if (changes.length > 0) {
                if (this._throttleResizeHandlerId >= 0) {
                    clearTimeout(this._throttleResizeHandlerId);
                }
                this._throttleResizeHandlerId = window.setTimeout(this.resizeHandler.bind(this, changes), 200);
            }
        });
    }
    resizeHandler(changes) {
        if (this._dotNetRef) {
            try {
                this._dotNetRef.invokeMethodAsync("OnSizeChanged", changes);
            }
            catch (error) {
                console.error("Error in OnSizeChanged handler:", { error });
            }
        }
    }
    connect(elements, elementIds) {
        const results = [];
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const elementId = elementIds[i];
            results.push(element.getBoundingClientRect());
            if (this._observervedElements.findIndex(v => v.id === elementId) !== -1) {
                continue;
            }
            this._observervedElements.push({
                element: element,
                id: elementId,
                isInitilized: false,
            });
            this._resizeObserver.observe(element);
        }
        return results;
    }
    disconnect(elementId) {
        const affectedObservedElement = this._observervedElements.find((x) => x.id == elementId);
        if (affectedObservedElement) {
            const element = affectedObservedElement.element;
            this._resizeObserver.unobserve(element);
            const index = this._observervedElements.indexOf(affectedObservedElement);
            this._observervedElements.splice(index, 1);
        }
    }
    dispose() {
        this._resizeObserver.disconnect();
        this._dotNetRef = undefined;
    }
}
const _observers = {};
export function connect(id, dotNetRef, elements, elementIds) {
    const existingEntry = _observers[id];
    if (!existingEntry) {
        const observer = new ResizeObserverInternal(dotNetRef);
        _observers[id] = observer;
    }
    return _observers[id].connect(elements, elementIds);
}
export function disconnect(id, elementId) {
    const existingEntry = _observers[id];
    if (existingEntry) {
        existingEntry.disconnect(elementId);
    }
}
export function dispose(id) {
    const existingEntry = _observers[id];
    if (existingEntry) {
        existingEntry.dispose();
        delete _observers[id];
    }
}
//# sourceMappingURL=tavenem-resize.js.map