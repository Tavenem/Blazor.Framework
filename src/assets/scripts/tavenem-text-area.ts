export function init(id: string, dotNetHelper: { invokeMethodAsync: (methodName: string) => void }) {
    const textArea = document.getElementById(id) as HTMLTextAreaElement;
    if (textArea) {
        textArea.addEventListener('keydown', onKeyDown.bind(dotNetHelper));
    }
}

/**
 * Handles the 'keydown' event for the text area.
 * @param {KeyboardEvent} event - The keyboard event.
 * @this {{ invokeMethodAsync: (methodName: string, event: KeyboardEvent) => void }}
 */
function onKeyDown(this: { invokeMethodAsync: (methodName: string) => void }, event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        const suppressEnter = (event.currentTarget as HTMLTextAreaElement)?.hasAttribute('suppressEnter') ?? false;
        if (suppressEnter) {
            event.preventDefault();
            event.stopPropagation();
        }
        (event.currentTarget as HTMLTextAreaElement)?.blur();
        return this.invokeMethodAsync('OnEnterAsync');
    }
}