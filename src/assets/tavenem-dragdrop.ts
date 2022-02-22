type DropEffect = "none" | "copy" | "link" | "move" | null | undefined;

interface IKeyValuePair {
    key: string;
    value: any;
}

interface IDragStartData {
    data: IKeyValuePair[] | null | undefined;
    effectAllowed: "none" | "copy" | "copyLink" | "copyMove" | "link" | "linkMove" | "move" | "all" | null | undefined;
}

interface IDragEnterArgs {
    dotnetReference: DotNet.DotNetObject;
    elementId: string;
    effect: DropEffect | null | undefined;
    dropClass: string | null | undefined;
    noDropClass: string | null | undefined;
}

export function cancelDragListener(elementId: string) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }

    if (element instanceof HTMLElement) {
        element.removeEventListener('dragstart', getDragData as any);
        element.removeEventListener('dragend', getDragData as any);
    }
}

export function cancelDropListener(elementId: string) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }

    if (element instanceof HTMLElement) {
        element.removeEventListener('dragstart', dragStartHandler as any);
        element.removeEventListener('dragenter', dragEnterHandler as any);
        element.removeEventListener('dragleave', dragLeaveHandler as any);
        element.removeEventListener('dragover', dragOverHandler as any);
        element.removeEventListener('drop', dropHandler as any);
    }
}

export function listenForDrag(
    this: any,
    dotnetReference: DotNet.DotNetObject | null | undefined,
    elementId: string | null | undefined,
    dragClass: string | null | undefined) {
    if (!dotnetReference || !elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }

    element.addEventListener(
        'dragstart',
        getDragData.bind(this, dotnetReference, elementId, dragClass));

    element.addEventListener(
        'dragend',
        droppedHandler.bind(this, dotnetReference, elementId, dragClass));
}

export function listenForDrop(
    this: any,
    dotnetReference: DotNet.DotNetObject | null | undefined,
    elementId: string | null | undefined,
    effect: DropEffect | null | undefined,
    dropClass: string | null | undefined,
    noDropClass: string | null | undefined) {
    if (!dotnetReference || !elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) {
        return;
    }

    element.addEventListener(
        'dragstart',
        dragStartHandler.bind(this));

    element.addEventListener(
        'dragenter',
        dragEnterHandler.bind(this, { dotnetReference, elementId, effect, dropClass, noDropClass }));

    element.addEventListener(
        'dragleave',
        dragLeaveHandler.bind(this, elementId, dropClass, noDropClass));

    element.addEventListener(
        'dragover',
        dragOverHandler.bind(this));

    element.addEventListener(
        'drop',
        dropHandler.bind(this, dotnetReference));
}

async function dragEnterHandler(
    this: any,
    args: IDragEnterArgs,
    event: DragEvent) {
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
        args.effect = await args.dotnetReference.invokeMethodAsync<DropEffect | null | undefined>('GetDropEffect', event.dataTransfer.types);
        if (args.effect) {
            event.dataTransfer.dropEffect = args.effect;
        }
    } catch (error) {
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
    } else if (args.dropClass) {
        element.classList.add(args.dropClass);
    }
}

async function dragLeaveHandler(
    this: any,
    elementId: string | null | undefined,
    dropClass: string | null | undefined,
    noDropClass: string | null | undefined,
    event: DragEvent) {
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

function dragOverHandler(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) {
        return;
    }
    if (event.ctrlKey
        && (event.dataTransfer.effectAllowed === "copy"
            || event.dataTransfer.effectAllowed === "copyLink"
            || event.dataTransfer.effectAllowed === "copyMove")) {
        event.dataTransfer.dropEffect = "copy";
    } else if (event.altKey
        && (event.dataTransfer.effectAllowed === "link"
            || event.dataTransfer.effectAllowed === "copyLink"
            || event.dataTransfer.effectAllowed === "linkMove")) {
        event.dataTransfer.dropEffect = "link";
    } else {
        event.dataTransfer.dropEffect = "move";
    }
}

function dragStartHandler(event: DragEvent) {
    if (event.dataTransfer
        && event.target instanceof HTMLElement) {
        event.dataTransfer.setData('', event.target.id);
    }
}

function dropHandler(this: any, dotnetReference: DotNet.DotNetObject, event: DragEvent) {
    if (!event.dataTransfer) {
        return;
    }

    event.preventDefault();

    let count = 0;
    const data: IKeyValuePair[] = [];
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
        } catch (error) {
            console.error('Error in dropHandler: ', { error });
        }
    }
}

function droppedHandler(
    this: any,
    dotnetReference: DotNet.DotNetObject,
    elementId: string | null | undefined,
    dragClass: string | null | undefined,
    event: DragEvent) {
    if (!event.dataTransfer) {
        return;
    }

    try {
        dotnetReference.invokeMethodAsync('DroppedHandled', getEffect(event));
    } catch (error) {
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

async function getDragData(
    this: any,
    dotnetReference: DotNet.DotNetObject,
    elementId: string | null | undefined,
    dragClass: string | null | undefined,
    event: DragEvent) {
    if (!event.dataTransfer) {
        return;
    }

    try {
        const data = dotnetReference.invokeMethod<IDragStartData | null | undefined>('GetDragData');
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
    } catch (error) {
        console.error('Error in getDragData: ', { error });
    }
}

function getEffect(event: DragEvent) {
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