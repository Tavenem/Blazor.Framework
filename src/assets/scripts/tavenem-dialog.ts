interface Dialog extends HTMLDialogElement {
    dragStartX: number | undefined;
    dragStartY: number | undefined;
    dragCurrentX: number | undefined;
    dragCurrentY: number | undefined;
    dragFinalX: number | undefined;
    dragFinalY: number | undefined;
    dragInertiaOvercome: boolean | undefined;
}

let draggedDialog: Dialog | undefined;

export function initialize(elementId: string) {
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }

    element.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', stopDragging);
    document.addEventListener('pointermove', drag);
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

    const containerWidth = (draggedDialog.offsetParent?.clientWidth || window.innerWidth) / 2;
    const dialogWidth = (draggedDialog.clientWidth / 2);
    const containerHeight = (draggedDialog.offsetParent?.clientHeight || window.innerHeight) / 2;
    const dialogHeight = (draggedDialog.clientHeight / 2);

    const left = Math.min(
        Math.max(
            -containerWidth + dialogWidth,
            (draggedDialog.dragFinalX || 0) + (e.clientX - draggedDialog.dragStartX)),
        containerWidth - dialogWidth);

    const top = Math.min(
        Math.max(
            -containerHeight + dialogHeight,
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
    if (!(e.currentTarget instanceof HTMLDialogElement)) {
        return;
    }
    const boundingRect = e.currentTarget.getBoundingClientRect();
    if (e.clientX > boundingRect.left + boundingRect.width - 20
        || e.clientY > boundingRect.top + boundingRect.height - 20) {
        return; // ignore if may be over resize handler
    }
    e.preventDefault();
    draggedDialog = e.currentTarget as Dialog;
    draggedDialog.dragStartX = e.clientX;
    draggedDialog.dragStartY = e.clientY;
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