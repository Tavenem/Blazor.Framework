export function cancelDragListener(elementId) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }
    if (element instanceof HTMLElement) {
        element.removeEventListener('dragstart', getDragData);
        element.removeEventListener('dragend', getDragData);
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
        element.removeEventListener('dragstart', dragStartHandler);
        element.removeEventListener('dragenter', dragEnterHandler);
        element.removeEventListener('dragleave', dragLeaveHandler);
        element.removeEventListener('dragover', dragOverHandler);
        element.removeEventListener('drop', dropHandler);
    }
}
export function listenForDrag(dotnetReference, elementId, dragClass) {
    if (!dotnetReference || !elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }
    element.addEventListener('dragstart', getDragData.bind(this, dotnetReference, elementId, dragClass));
    element.addEventListener('dragend', droppedHandler.bind(this, dotnetReference, elementId, dragClass));
}
export function listenForDrop(dotnetReference, elementId, effect, dropClass, noDropClass) {
    if (!dotnetReference || !elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }
    element.addEventListener('dragstart', dragStartHandler.bind(this));
    element.addEventListener('dragenter', dragEnterHandler.bind(this, { dotnetReference, elementId, effect, dropClass, noDropClass }));
    element.addEventListener('dragleave', dragLeaveHandler.bind(this, elementId, dropClass, noDropClass));
    element.addEventListener('dragover', dragOverHandler.bind(this));
    element.addEventListener('drop', dropHandler.bind(this, dotnetReference));
}
async function dragEnterHandler(args, event) {
    if (!event.dataTransfer) {
        return;
    }
    if (args.effect) {
        event.dataTransfer.dropEffect = args.effect;
    }
    if (args.effect === "none") {
        return;
    }
    try {
        args.effect = await args.dotnetReference.invokeMethodAsync('GetDropEffect', event.dataTransfer.types);
        if (args.effect) {
            event.dataTransfer.dropEffect = args.effect;
        }
    }
    catch (error) {
        console.error('Error in dragEnterHandler: ', { error });
    }
    if (args.effect !== "none") {
        event.preventDefault();
    }
    if (!args.elementId
        || (!args.dropClass && !args.noDropClass)) {
        return;
    }
    const element = document.getElementById(args.elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }
    if (args.effect === "none") {
        if (args.noDropClass) {
            element.classList.add(args.noDropClass);
        }
    }
    else if (args.dropClass) {
        element.classList.add(args.dropClass);
    }
}
async function dragLeaveHandler(elementId, dropClass, noDropClass, event) {
    if (!elementId
        || (!dropClass && !noDropClass)) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }
    if (dropClass) {
        element.classList.remove(dropClass);
    }
    if (noDropClass) {
        element.classList.remove(noDropClass);
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
            dotnetReference.invokeMethodAsync('DropHandled', {
                data,
                effect: getEffect(event),
            });
        }
        catch (error) {
            console.error('Error in dropHandler: ', { error });
        }
    }
}
function droppedHandler(dotnetReference, elementId, dragClass, event) {
    if (!event.dataTransfer) {
        return;
    }
    try {
        dotnetReference.invokeMethodAsync('DroppedHandled', getEffect(event));
    }
    catch (error) {
        console.error('Error in droppedHandler: ', { error });
    }
    if (!elementId || !dragClass) {
        return;
    }
    const element = document.getElementById(elementId);
    if (element instanceof HTMLElement) {
        element.classList.remove(dragClass);
    }
}
async function getDragData(dotnetReference, elementId, dragClass, event) {
    if (!event.dataTransfer) {
        return;
    }
    try {
        const data = dotnetReference.invokeMethod('GetDragData');
        if (!data || !data.data) {
            return;
        }
        let setAny = false;
        for (const pair of data.data) {
            if (typeof (pair.value) !== "string"
                || !pair.value.length) {
                continue;
            }
            event.dataTransfer.setData(pair.key, pair.value);
            setAny = true;
        }
        if (setAny) {
            if (data.effectAllowed) {
                event.dataTransfer.effectAllowed = data.effectAllowed;
            }
            if (event.dataTransfer.effectAllowed !== "none"
                && elementId
                && dragClass) {
                const element = document.getElementById(elementId);
                if (element instanceof HTMLElement) {
                    element.classList.add(dragClass);
                }
            }
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