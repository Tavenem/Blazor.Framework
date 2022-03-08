export function cancelDragListener(elementId) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }
    if (element instanceof HTMLElement) {
        if (element.dragstartListener) {
            element.removeEventListener('dragstart', element.dragstartListener);
        }
        if (element.dragendListener) {
            element.removeEventListener('dragend', element.dragendListener);
        }
    }
}
export function cancelDropListener(elementId) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }
    if (element instanceof HTMLElement) {
        if (element.dragstartListener) {
            element.removeEventListener('dragstart', element.dragstartListener);
        }
        if (element.dragenterListener) {
            element.removeEventListener('dragenter', element.dragenterListener);
        }
        if (element.dragleaveListener) {
            element.removeEventListener('dragleave', element.dragleaveListener);
        }
        if (element.dragoverListener) {
            element.removeEventListener('dragover', element.dragoverListener);
        }
        if (element.dropListener) {
            element.removeEventListener('drop', element.dropListener);
        }
    }
}
export function listenForDrag(dotnetReference, elementId) {
    if (!dotnetReference || !elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }
    element.dragstartListener = getDragData.bind(this, dotnetReference);
    element.dragendListener = droppedHandler.bind(this, dotnetReference);
    element.addEventListener('dragstart', element.dragstartListener);
    element.addEventListener('dragend', element.dragendListener);
}
export function listenForDrop(dotnetReference, elementId, effect) {
    if (!dotnetReference || !elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }
    element.dragstartListener = dragStartHandler.bind(this);
    element.dragenterListener = dragEnterHandler.bind(this, dotnetReference, effect);
    element.dragleaveListener = dragLeaveHandler.bind(this, dotnetReference, elementId);
    element.dragoverListener = dragOverHandler.bind(this);
    element.dropListener = dropHandler.bind(this, dotnetReference);
    element.addEventListener('dragstart', element.dragstartListener);
    element.addEventListener('dragenter', element.dragenterListener);
    element.addEventListener('dragleave', element.dragleaveListener);
    element.addEventListener('dragover', element.dragoverListener);
    element.addEventListener('drop', element.dropListener);
}
async function dragEnterHandler(dotnetReference, effect, event) {
    if (!event.dataTransfer) {
        return;
    }
    if (effect) {
        event.dataTransfer.dropEffect = effect;
    }
    if (effect === "none") {
        return;
    }
    try {
        effect = dotnetReference.invokeMethod('GetDropEffect', event.dataTransfer.types);
        if (effect) {
            event.dataTransfer.dropEffect = effect;
        }
    }
    catch (error) {
        console.error('Error in dragEnterHandler: ', { error });
    }
    if (effect !== "none") {
        event.preventDefault();
    }
    try {
        dotnetReference.invokeMethod('SetDropValid', effect !== "none");
    }
    catch (error) {
        console.error('Error in dragEnterHandler: ', { error });
    }
}
async function dragLeaveHandler(dotnetReference, elementId, event) {
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)
        || !(event.relatedTarget instanceof HTMLElement)
        || (event.relatedTarget.id !== elementId
            && !element.contains(event.relatedTarget))) {
        try {
            dotnetReference.invokeMethod('SetDropValid', null);
        }
        catch (error) {
            console.error('Error in dragEnterHandler: ', { error });
        }
    }
}
function dragOverHandler(event) {
    event.preventDefault();
    if (!event.dataTransfer) {
        return;
    }
    if (event.ctrlKey
        && (event.dataTransfer.effectAllowed === "copy"
            || event.dataTransfer.effectAllowed === "copyLink"
            || event.dataTransfer.effectAllowed === "copyMove")) {
        event.dataTransfer.dropEffect = "copy";
    }
    else if (event.altKey
        && (event.dataTransfer.effectAllowed === "link"
            || event.dataTransfer.effectAllowed === "copyLink"
            || event.dataTransfer.effectAllowed === "linkMove")) {
        event.dataTransfer.dropEffect = "link";
    }
    else {
        event.dataTransfer.dropEffect = "move";
    }
}
function dragStartHandler(event) {
    if (event.dataTransfer
        && event.target instanceof HTMLElement) {
        event.dataTransfer.setData('', event.target.id);
    }
}
function dropHandler(dotnetReference, event) {
    if (!event.dataTransfer) {
        return;
    }
    event.preventDefault();
    let count = 0;
    const data = [];
    for (const type of event.dataTransfer.types) {
        if (type !== "Files") {
            data.push({
                key: type,
                value: event.dataTransfer.getData(type),
            });
            count++;
        }
    }
    if (count > 0) {
        try {
            dotnetReference.invokeMethodAsync('DropHandled', data);
        }
        catch (error) {
            console.error('Error in dropHandler: ', { error });
        }
    }
}
function droppedHandler(dotnetReference, event) {
    if (!event.dataTransfer) {
        return;
    }
    try {
        dotnetReference.invokeMethodAsync('DroppedHandled', getEffect(event));
    }
    catch (error) {
        console.error('Error in droppedHandler: ', { error });
    }
}
async function getDragData(dotnetReference, event) {
    if (!event.dataTransfer) {
        return;
    }
    try {
        const data = dotnetReference.invokeMethod('GetDragData');
        if (!data || !data.data) {
            return;
        }
        if (data.effectAllowed) {
            event.dataTransfer.effectAllowed = data.effectAllowed;
        }
        for (const pair of data.data) {
            if (typeof (pair.value) !== "string"
                || !pair.value.length) {
                continue;
            }
            event.dataTransfer.setData(pair.key, pair.value);
        }
    }
    catch (error) {
        console.error('Error in getDragData: ', { error });
    }
}
function getEffect(event) {
    if (!event.dataTransfer) {
        return 0;
    }
    switch (event.dataTransfer.dropEffect) {
        case "none":
            return 0;
        case "copy":
            return 1;
        case "link":
            return 1 << 1;
        case "move":
            return 1 << 2;
    }
}
//# sourceMappingURL=tavenem-dragdrop.js.map