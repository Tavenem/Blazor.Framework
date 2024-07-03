interface DotNetStreamReference {
    arrayBuffer(): Promise<ArrayBuffer>;
}

export function clear(id: string) {
    const editor = document.getElementById(id) as any;
    if (editor && typeof editor.clear === 'function') {
        editor.clear();
    }
}

export async function destroy(id: string) {
    const editor = document.getElementById(id) as any;
    if (editor && typeof editor.destroy === 'function') {
        await editor.destroy(false);
    }
}

export async function setImage(id: string, imageUrl?: string) {
    const editor = document.getElementById(id) as any;
    if (editor && typeof editor.setImage === 'function') {
        await editor.setImage(imageUrl);
    }
}

export async function setImageFromStream(id: string, imageStream?: DotNetStreamReference) {
    const editor = document.getElementById(id) as any;
    if (editor && typeof editor.setImageFromStream === 'function') {
        await editor.setImageFromStream(imageStream);
    }
}

export async function startCrop(id: string) {
    const editor = document.getElementById(id) as any;
    if (editor && typeof editor.startCrop === 'function') {
        await editor.startCrop();
    }
}

export async function startEdit(id: string) {
    const editor = document.getElementById(id) as any;
    if (editor && typeof editor.startEdit === 'function') {
        await editor.startEdit();
    }
}

export function undo(id: string) {
    const editor = document.getElementById(id) as any;
    if (editor && typeof editor.undo === 'function') {
        editor.undo();
    }
}