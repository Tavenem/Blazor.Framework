export function focusEditor(elementId: string) {
    const editor = document.getElementById(elementId) as any;
    if (editor
        && typeof editor.focusInnerEditor === 'function') {
        editor.focusInnerEditor();
    }
}

export function getSelectedText(elementId: string): { position: number, rawTextPosition: number, text: string | null } {
    const editor = document.getElementById(elementId) as any;
    if (editor
        && typeof editor.getSelectedText === 'function') {
        return editor.getSelectedText();
    } else {
        return { position: -1, rawTextPosition: -1, text: null };
    }
}

export function updateSelectedText(elementId: string, value?: string | null) {
    const editor = document.getElementById(elementId) as any;
    if (editor
        && typeof editor.updateSelectedText === 'function') {
        editor.updateSelectedText(value);
    }
}