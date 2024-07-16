export interface Dialog extends HTMLDialogElement {
    dragStartX: number | undefined;
    dragStartY: number | undefined;
    dragCurrentX: number | undefined;
    dragCurrentY: number | undefined;
    dragFinalX: number | undefined;
    dragFinalY: number | undefined;
    dragInertiaOvercome: boolean | undefined;
}

let draggedDialog: Dialog | undefined;

export function initialize(dialog: HTMLDialogElement) {
    if (!dialog) {
        return;
    }
    const headers = dialog.getElementsByClassName('header');
    if (!headers
        || !headers.length
        || !(headers[0] instanceof HTMLElement)) {
        return;
    }

    headers[0].addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', stopDragging);
    document.addEventListener('pointermove', drag);
    position(dialog);
}

export function initializeId(id: string) {
    const dialog = document.getElementById(id);
    if (dialog instanceof HTMLDialogElement) {
        initialize(dialog);
    }
}

export function showModal(dialog: HTMLDialogElement) {
    dialog.showModal();
    position(dialog);
}

function drag(e: PointerEvent) {
    if (!draggedDialog
        || draggedDialog.dragStartX == null
        || draggedDialog.dragStartY == null) {
        return;
    }

    e.preventDefault();

    if (!draggedDialog.dragInertiaOvercome) {
        if (Math.abs(e.clientX - draggedDialog.dragStartX) > 10
            || Math.abs(e.clientY - draggedDialog.dragStartY) > 10) {
            draggedDialog.dragInertiaOvercome = true;
        } else {
            return;
        }
    }

    const containerWidth = draggedDialog.offsetParent?.clientWidth || window.innerWidth;
    const dialogWidth = draggedDialog.clientWidth;
    const containerHeight = draggedDialog.offsetParent?.clientHeight || window.innerHeight;
    const dialogHeight = draggedDialog.clientHeight;

    const left = Math.min(
        Math.max(
            0,
            (draggedDialog.dragFinalX || 0) + (e.clientX - draggedDialog.dragStartX)),
        containerWidth - dialogWidth);

    const top = Math.min(
        Math.max(
            0,
            (draggedDialog.dragFinalY || 0) + (e.clientY - draggedDialog.dragStartY)),
        containerHeight - dialogHeight);

    draggedDialog.dragCurrentX = left;
    draggedDialog.dragCurrentY = top;

    draggedDialog.style.left = left + 'px';
    draggedDialog.style.top = top + 'px';
}

function onPointerDown(e: PointerEvent) {
    if (!(e.target instanceof Element)
        || e.target instanceof HTMLAnchorElement
        || e.target instanceof HTMLButtonElement
        || e.target instanceof HTMLInputElement
        || e.target instanceof HTMLSelectElement
        || e.target instanceof HTMLTextAreaElement) {
        return;
    }
    if (e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
    }
    if (!(e.currentTarget instanceof HTMLElement)
        || !(e.currentTarget.parentElement instanceof HTMLElement)
        || !(e.currentTarget.parentElement.parentElement instanceof HTMLDialogElement)) {
        return;
    }
    e.preventDefault();
    draggedDialog = e.currentTarget.parentElement.parentElement as Dialog;
    draggedDialog.dragStartX = e.clientX;
    draggedDialog.dragStartY = e.clientY;
}

function position(dialog: HTMLDialogElement) {
    if (!dialog) {
        return;
    }
    const d = dialog as Dialog;
    const boundingRect = d.getBoundingClientRect();
    d.dragFinalX = (window.visualViewport?.offsetLeft || window.document.documentElement.offsetLeft)
        + ((window.visualViewport?.width || window.document.documentElement.clientWidth) / 2)
        - (boundingRect.width / 2);
    d.dragFinalY = (window.visualViewport?.offsetTop || window.document.documentElement.offsetTop)
        + ((window.visualViewport?.height || window.document.documentElement.clientHeight) / 2)
        - (boundingRect.height / 2);
    d.style.left = `${d.dragFinalX}px`;
    d.style.top = `${d.dragFinalY}px`;
}

function stopDragging() {
    if (draggedDialog) {
        draggedDialog.dragFinalX = draggedDialog.dragCurrentX;
        draggedDialog.dragFinalY = draggedDialog.dragCurrentY;
        delete draggedDialog.dragStartX;
        delete draggedDialog.dragStartY;
        delete draggedDialog.dragCurrentX;
        delete draggedDialog.dragCurrentY;
        draggedDialog = undefined;
    }
}