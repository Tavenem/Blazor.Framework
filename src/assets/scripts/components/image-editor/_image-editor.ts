import {
    ALPHA_MODES,
    Application,
    Assets,
    BLEND_MODES,
    BlurFilter,
    Container,
    DisplayObject,
    FederatedEventTarget,
    FederatedPointerEvent,
    Graphics,
    ICanvas,
    IRenderer,
    Point,
    Rectangle,
    RenderTexture,
    settings,
    Sprite,
    Text,
    Texture,
} from 'pixi.js';
import { Sprite as PictureSprite } from '@pixi/picture';
import { Transformer, TransformerHandle } from '@pixi-essentials/transformer';
import { Dialog, initialize as initializeDialog, showModal } from '../../tavenem-dialog';
import { TavenemInputFieldHtmlElement } from '../_input-field';
import { randomUUID } from '../../tavenem-utility';
import { Transform } from 'prosemirror-transform';

export const DrawingMode = {
    None: 0,
    Brush: 1,
} as const;
export type DrawingMode = typeof DrawingMode[keyof typeof DrawingMode];

class BrushGenerator {
    private readonly graphicsTexture: Texture;
    private readonly sprite: Sprite;

    constructor(private readonly renderer: IRenderer<ICanvas>) {
        const g = new Graphics();
        g.beginFill(0xFFFFFF);
        g.drawCircle(0, 0, 100);
        this.graphicsTexture = this.renderer.generateTexture(g);

        const filter = new BlurFilter(2);
        filter.padding = 2;

        this.sprite = new Sprite(this.graphicsTexture);
        this.sprite.filters = [filter];
    }

    get(size: number, color: string) {
        const texture = RenderTexture.create({ width: size, height: size });
        texture.baseTexture.alphaMode = ALPHA_MODES.PREMULTIPLIED_ALPHA;

        this.sprite.tint = colorHexToNumber(color);
        this.sprite.scale.set(size / 200, size / 200);

        this.renderer.render(this.sprite, {
            renderTexture: texture,
            clear: false,
        });

        return texture;
    }
}

class SpritePool {
    private index: number = 0;
    private readonly sprites: PictureSprite[] = [];

    constructor() { }

    get() {
        if (this.index < this.sprites.length) {
            return this.sprites[this.index++];
        }

        const sprite = new PictureSprite();
        sprite.anchor.set(0.5);
        this.sprites.push(sprite);

        return sprite;
    }

    reset() {
        this.index = 0;
    }

    destroy() {
        for (let i = 0; i < this.sprites.length; i++) {
            this.sprites[i].destroy();
        }
        this.sprites.length = 0;
    }
}

export class ImageEditor {
    readonly editor: Application;
    backgroundImage?: Sprite;
    cropAspectRatio?: number | null;
    drawingMode: DrawingMode = DrawingMode.None;
    originalHeight: number;
    originalSrc?: string;
    originalWidth: number;
    private _brushBuffer = new Container();
    private _brushHistoryBuffer = new Container();
    private _brushHistory: DisplayObject[] = [];
    private _brushCanvasTexture?: RenderTexture;
    private _brushColor = "#000000";
    private _brushCursor?: Sprite;
    private _brushGenerator: BrushGenerator;
    private _brushSize = 12;
    private _brushTexture?: RenderTexture;
    private _container?: Container;
    private _cropRect?: Sprite;
    private _cropTransformer?: Transformer;
    private _drawing = false;
    private _drawn?: Sprite;
    private _editedText?: Text;
    private _heightLimit?: number;
    private _isErasing = false;
    private _lastPosition?: { x: number, y: number };
    private _maxCount = 100;
    private _redoStack: Function[] = [];
    private _spritePool = new SpritePool();
    private _textColor = "#000000";
    private _textTapped = false;
    private _textDialog?: HTMLDialogElement;
    private _textDoubleTapped?: number;
    private _textTransformer?: Transformer;
    private _undoStack: Function[] = [];
    private _widthLimit?: number;

    constructor(
        width: number,
        height: number,
        widthLimit: number | undefined,
        heightLimit: number | undefined,
        private setCropping: (value: boolean) => void,
        private updateRedo: (value: boolean) => void,
        private updateUndo: (value: boolean) => void) {
        this.originalHeight = height;
        this.originalWidth = width;
        this._heightLimit = heightLimit;
        this._widthLimit = widthLimit;
        this.editor = new Application({
            width,
            height,
            backgroundAlpha: 0,
        });
        if (this.editor.view instanceof HTMLCanvasElement) {
            this.editor.view.style.userSelect = 'none';
            this.editor.view.style.width = '100%';
            this.editor.view.style.height = '100%';
            this.editor.view.style.objectFit = 'scale-down';
        }
        this.editor.ticker.add(() => {
            this.renderPoints();
        });
        this._brushGenerator = new BrushGenerator(this.editor.renderer);
        this.editor.stage.eventMode = 'static';
        this.editor.stage.hitArea = this.editor.screen;
        this.editor.stage.cursor = 'crosshair';
        this.editor.stage.on('pointerdown', this.onPointerDown, this);
        this.editor.stage.on('pointermove', this.onPointerMove, this);
        this.editor.stage.on('pointerup', this.onPointerUp, this);
        this.editor.stage.on('pointerupoutside', this.onPointerUp, this);
    }

    addText(text: string) {
        this.saveState(this.addTextInner.bind(this, text));
    }

    cancelOngoingOperations(withoutNotify?: boolean) {
        delete this._editedText;
        if (this._textTransformer) {
            this.editor.stage.removeChild(this._textTransformer);
            this._textTransformer.destroy(true);
            delete this._textTransformer;
        }
        if (this._cropTransformer) {
            this.editor.stage.removeChild(this._cropTransformer);
            this._cropTransformer.destroy(true);
            delete this._cropTransformer;
        }
        if (this._cropRect) {
            this.editor.stage.removeChild(this._cropRect);
            this._cropRect.destroy(true);
            delete this._cropRect;
        }
        if (!withoutNotify) {
            this.setCropping(false);
        }
    }

    async clear() {
        this.cancelOngoingOperations();

        if (this._brushTexture) {
            this._brushTexture.destroy(true);
            delete this._brushTexture;
        }

        if (this.backgroundImage
            && this.backgroundImage.texture.baseTexture.resource.src) {
            await Assets.unload(this.backgroundImage.texture.baseTexture.resource.src);
        }
        delete this.backgroundImage;

        if (this._container) {
            this._container.destroy(true);
        }

        this._container = new Container();
        this._container.pivot = new Point(this.editor.view.width / 2, this.editor.view.height / 2);
        this._container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
        this.editor.stage.addChildAt(this._container, 0);

        this._brushCanvasTexture = RenderTexture.create({
            width: this.editor.view.width,
            height: this.editor.view.height,
        });
        this._drawn = new Sprite(this._brushCanvasTexture);
        this._container.addChild(this._drawn);
    }

    async crop() {
        if (!this._cropRect
            || this._cropRect.height <= 0
            || this._cropRect.width <= 0
            || this.editor.stage.children.length < 1) {
            return new Rectangle(0, 0, 0, 0);
        }
        const region = new Rectangle(
            this._cropRect.x - (this._cropRect.width / 2),
            this._cropRect.y - (this._cropRect.height / 2),
            this._cropRect.width,
            this._cropRect.height);
        await this.saveStateAsync(this.cropInner.bind(this, region));
        this.setCropping(false);
        return region;
    }

    delete() {
        if (!this._textTransformer) {
            return;
        }

        const group: DisplayObject[] = [];
        while (this._textTransformer.group.length > 0) {
            const text = this._textTransformer.group.pop();
            if (text) {
                group.push(text);

                if (this._editedText === text) {
                    delete this._editedText;
                }
            }
        }

        this._textTransformer.destroy(true);
        delete this._textTransformer;

        for (let i = 0; i < group.length; i++) {
            group[i].destroy(true);
        }
    }

    async destroy() {
        this.cancelOngoingOperations(true);
        if (this.editor.view instanceof HTMLCanvasElement
            && this.editor.view.parentElement) {
            const image = document.createElement('img');
            image.height = this.originalHeight;
            image.width = this.originalWidth;
            image.style.width = '100%';
            image.style.height = '100%';
            image.style.objectFit = 'scale-down';
            if (this.originalSrc) {
                image.src = this.originalSrc;
            }
            this.editor.view.parentElement.appendChild(image);
        }
        if (this.backgroundImage
            && this.backgroundImage.texture.baseTexture.resource.src) {
            await Assets.unload(this.backgroundImage.texture.baseTexture.resource.src);
        }
        this.editor.destroy(true, true);
        this._spritePool.destroy();
        delete this.backgroundImage;
        delete this._brushCursor;
        delete this._brushCanvasTexture;
        delete this._brushTexture;
        delete this._drawn;
    }

    editText(text?: string) {
        this.saveState(this.editTextInner.bind(this, text));
    }

    exportImage(type: string, quality?: number) {
        const renderTexture = RenderTexture.create({
            width: this.editor.view.width,
            height: this.editor.view.height
        });
        this.editor.renderer.render(this.editor.stage, { renderTexture });
        const canvas = this.editor.renderer.extract.canvas(renderTexture) as HTMLCanvasElement;
        renderTexture.destroy(true);
        return canvas.toDataURL(type, quality).replace(type, 'image/octet-stream');
    }

    flip(vertical?: boolean) {
        this.saveState(this.flipInner.bind(this, vertical));
    }

    getTextDialogResponse(text?: string | null) {
        if (!this._textDialog) {
            this._textDialog = this.getDialog(text);
        } else {
            const container = this._textDialog.closest<HTMLElement>('.dialog-container');
            if (container) {
                const urlInput = container.querySelector<TavenemInputFieldHtmlElement>('.text-input');
                if (urlInput) {
                    if (text) {
                        urlInput.setAttribute('value', text);
                        urlInput.value = text;
                    } else {
                        urlInput.removeAttribute('value');
                        urlInput.value = '';
                    }
                }
            }
        }

        showModal(this._textDialog);
    }

    async redo() {
        this.cancelOngoingOperations();

        if (this._redoStack.length === 0) {
            return;
        }

        const step = this._redoStack.pop()!;
        step();
        this._undoStack.push(step);

        if (this._undoStack.length > 0) {
            this.updateUndo(true);
        }
        if (this._redoStack.length === 0) {
            this.updateRedo(false);
        }
    }

    rotate(angle: number) {
        this.saveState(this.rotateInner.bind(this, angle));
    }

    async save(type?: string, quality?: number | null) {
        type = type || "image/png";
        quality = quality || 0.92;
        this.cancelOngoingOperations(true);
        const renderTexture = RenderTexture.create({
            width: this.editor.view.width,
            height: this.editor.view.height,
        });
        this.editor.renderer.render(this.editor.stage, {
            renderTexture
        });
        if (this.editor.view instanceof HTMLCanvasElement
            && this.editor.view.parentElement) {
            const image = await this.editor.renderer.extract.image(renderTexture);

            image.style.width = '100%';
            image.style.height = '100%';
            image.style.objectFit = 'scale-down';
            this.editor.view.parentElement.appendChild(image);
        }
        const canvas = this.editor.renderer.extract.canvas(renderTexture) as HTMLCanvasElement;
        renderTexture.destroy(true);
        if (this.backgroundImage
            && this.backgroundImage.texture.baseTexture.resource.src) {
            await Assets.unload(this.backgroundImage.texture.baseTexture.resource.src);
        }
        this.editor.destroy(true, true);
        delete this.backgroundImage;
        delete this._brushCursor;
        delete this._brushCanvasTexture;
        delete this._brushTexture;
        delete this._drawn;
        return await new Promise((resolve: BlobCallback) => canvas.toBlob(resolve, type, quality));
    }

    async setBackgroundImage(imageUrl?: string | null, preserveHistory: boolean = false) {
        this.cancelOngoingOperations();
        await this.clear();
        if (!this._container) {
            return;
        }

        if (imageUrl) {
            this.originalSrc = imageUrl;
            let texture: Texture;
            if (imageUrl.startsWith("blob")) {
                texture = await Texture.fromURL(imageUrl);
            } else {
                texture = await Assets.load(imageUrl) as Texture;
            }
            this.backgroundImage = Sprite.from(texture);
            this.backgroundImage.eventMode = 'none';
            let scale = 0;
            if (this._heightLimit
                && this.backgroundImage.height > this._heightLimit) {
                scale = this._heightLimit / this.backgroundImage.height;
            }
            if (this._widthLimit
                && this.backgroundImage.width > this._widthLimit) {
                scale = Math.min(scale, this._widthLimit / this.backgroundImage.width);
            }
            if (scale != 0) {
                this.backgroundImage.scale.x = scale;
                this.backgroundImage.scale.y = scale;
            }
            this.originalHeight = this.backgroundImage.height;
            this.originalWidth = this.backgroundImage.width;
            this.editor.renderer.resize(this.originalWidth, this.originalHeight);
            if (this._brushCanvasTexture) {
                this._brushCanvasTexture.resize(this.editor.view.width, this.editor.view.height);
            }
            this._container.pivot = new Point(this.editor.view.width / 2, this.editor.view.height / 2);
            this._container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
            this._container.addChildAt(this.backgroundImage, 0);
        }
        if (!preserveHistory) {
            this.clearHistory();
        }
    }

    setBrushColor(color?: string) {
        this._brushColor = color || "#000000";
        if (this._brushCursor) {
            this._brushCursor.tint = colorHexToNumber(this._brushColor);
            this._brushCursor.alpha = 1;
        }
        this.updateBrush();
    }

    setBrushSize(size?: number) {
        this._brushSize = Math.max(1, size || 12);
        if (this._brushCursor) {
            this._brushCursor.scale.set(this._brushSize / 200, this._brushSize / 200);
        }
        this.updateBrush();
    }

    setCropAspectRatio(ratio?: number | null) {
        this.cropAspectRatio = ratio;
        if (this._cropTransformer) {
            this._cropTransformer.lockAspectRatio = this.cropAspectRatio != null && this.cropAspectRatio != 0;
        }
        if (!this.cropAspectRatio
            || this.editor.stage.children.length < 1) {
            return;
        }
        if (this._cropRect) {
            let width = this._cropRect.width;
            let height;
            if (this.cropAspectRatio < 0) {
                height = width / (this.originalWidth / this.originalHeight);
            } else {
                height = width / this.cropAspectRatio;
            }
            if (this._container
                && height > this._container.height) {
                height = this._container.height;
                width = height * this.cropAspectRatio!;
            }
            this._cropRect.scale.set(width / 16, height / 16);
        }
    }

    setDrawingMode(mode: DrawingMode) {
        this.drawingMode = mode;
        if (this.drawingMode == DrawingMode.Brush) {
            this.cancelOngoingOperations();

            this.editor.stage.eventMode = 'static';
            this.editor.stage.cursor = 'crosshair';
            if (!this._brushCursor) {
                const g = new Graphics();
                g.beginFill(0xFFFFFF);
                g.drawCircle(0, 0, 100);
                const tex = this.editor.renderer.generateTexture(g);
                this._brushCursor = new Sprite(tex);
                const filter = new BlurFilter(2);
                filter.padding = 2;
                this._brushCursor.filters = [filter];
                this._brushCursor.tint = this._isErasing
                    ? 0xFFFFFF
                    : colorHexToNumber(this._brushColor);
                this._brushCursor.alpha = this._isErasing
                    ? 0.0
                    : 1;
                this._brushCursor.scale.set(this._brushSize / 200, this._brushSize / 200);
                this._brushCursor.anchor.set(0.5, 0.5);
                this.editor.stage.addChild(this._brushCursor);
            } else if (this._brushCursor.parent != this.editor.stage) {
                this.editor.stage.addChild(this._brushCursor);
            }
        } else {
            this.editor.stage.cursor = 'default';
            this.editor.stage.eventMode = 'none';
            if (this._brushCursor) {
                this.editor.stage.removeChild(this._brushCursor);
            }
            this._isErasing = false;
        }
    }

    setIsErasing(value: boolean) {
        this._isErasing = value;
        if (this._brushCursor) {
            this._brushCursor.tint = value
                ? 0xFFFFFF
                : colorHexToNumber(this._brushColor);
            this._brushCursor.alpha = value
                ? 0.1
                : 1;
        }
        this.updateBrush();
    }

    setTextColor(color?: string) {
        this._textColor = color || "#000000";
        if (this._editedText) {
            this._editedText.style.fill = this._textColor;
        }
    }

    startCrop() {
        if (this._cropRect) {
            return;
        }
        let width = this.editor.view.width / 2;
        let height;
        if (!this.cropAspectRatio
            || this.cropAspectRatio < 0) {
            height = this.editor.view.height / 2;
        } else {
            height = width / this.cropAspectRatio;
        }
        if (height > this.editor.view.height) {
            height = this.editor.view.height;
            width = height * this.cropAspectRatio!;
        }
        this._cropRect = new Sprite(Texture.WHITE);
        this._cropRect.anchor.set(0.5, 0.5);
        this._cropRect.renderable = false;
        this._cropRect.scale.set(width / 16, height / 16);
        this._cropRect.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
        this.editor.stage.addChild(this._cropRect);

        this._cropTransformer = new Transformer({
            boxScalingEnabled: true,
            boundingBoxes: 'groupOnly',
            group: [this._cropRect],
            lockAspectRatio: this.cropAspectRatio != null && this.cropAspectRatio != 0,
        });
        this._cropTransformer.enabledHandles = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        this._cropTransformer.rotateEnabled = false;
        this.editor.stage.addChild(this._cropTransformer);
        this.setCropping(true);
    }

    async undo() {
        if (this._undoStack.length === 0) {
            this.cancelOngoingOperations();
            return;
        }

        await this.setBackgroundImage(this.originalSrc, true);
        this.setDrawingMode(this.drawingMode);

        this._redoStack.push(this._undoStack.pop()!);

        for (let i = 0; i < this._undoStack.length; i++) {
            const step = this._undoStack[i];
            step();
        }

        if (this._redoStack.length > 0) {
            this.updateRedo(true);
        }
        if (this._undoStack.length === 0) {
            this.updateUndo(false);
        }
    }

    private addTextInner(text: string) {
        this.cancelOngoingOperations();
        if (!this._container) {
            return;
        }
        const t = new Text(text, {
            fill: this._textColor,
            fontSize: this.editor.view.height,
        });
        t.anchor.set(0.5, 0.5);
        t.x = this.editor.view.width / 2;
        t.y = this.editor.view.height / 2;
        t.scale.set(0.3);
        t.eventMode = 'static';
        t.on('pointertap', this.onTextPointerTap, this);
        this._container.addChild(t);
        this._textTransformer = new Transformer({
            boxRotationEnabled: true,
            boxScalingEnabled: true,
            boundingBoxes: 'groupOnly',
            group: [t],
            lockAspectRatio: true,
            skewEnabled: true,
            stage: this.editor.stage,
        });
        this._textTransformer.on('pointertap', this.onTextPointerTap, this);
        this.editor.stage.addChild(this._textTransformer);
    }

    private clearHistory() {
        this.cancelOngoingOperations();
        this._redoStack = [];
        this._undoStack = [];
        this._brushHistory.forEach(x => x.destroy());
        this._brushHistory = [];
        this._spritePool.reset();
        this.updateRedo(false);
        this.updateUndo(false);
    }

    private async cropInner(region: Rectangle) {
        if (this._cropTransformer) {
            this.editor.stage.removeChild(this._cropTransformer);
            this._cropTransformer.destroy(true);
            delete this._cropTransformer;
        }
        const texture = this.editor.renderer.generateTexture(this.editor.stage, {
            region,
        });
        const canvas = this.editor.renderer.extract.canvas(texture) as HTMLCanvasElement;
        await this.clear();
        if (this.backgroundImage) {
            if (this.backgroundImage.texture.baseTexture.resource.src) {
                await Assets.unload(this.backgroundImage.texture.baseTexture.resource.src);
            }
            this.backgroundImage.destroy(true);
        }
        if (!this._container) {
            return;
        }
        this.backgroundImage = Sprite.from(canvas);
        this.backgroundImage.eventMode = 'none';
        this.editor.renderer.resize(this.backgroundImage.width, this.backgroundImage.height);
        if (this._brushCanvasTexture) {
            this._brushCanvasTexture.resize(this.editor.view.width, this.editor.view.height);
        }
        this._container.pivot = new Point(this.editor.view.width / 2, this.editor.view.height / 2);
        this._container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
        this.backgroundImage.setParent(this._container);
        texture.destroy(true);
    }

    private drawPoint(x: number, y: number) {
        const sprite = this._spritePool.get();
        sprite.x = x;
        sprite.y = y;
        if (!this._brushTexture) {
            this.updateBrush();
        }
        sprite.texture = this._brushTexture!;
        if (this._isErasing) {
            sprite.blendMode = BLEND_MODES.ERASE;
        }
        this._brushBuffer.addChild(sprite);
    }

    private drawPointLine(
        start: { x: number, y: number },
        end: { x: number, y: number }) {
        const delta = {
            x: start.x - end.x,
            y: start.y - end.y,
        };
        const deltaLength = Math.sqrt((delta.x ** 2) + (delta.y ** 2));
        this.drawPoint(end.x, end.y);
        if (deltaLength >= this._brushSize / 8) {
            const additionalPoints = Math.ceil(deltaLength / (this._brushSize / 8));
            for (let i = 0; i < additionalPoints; i++) {
                const pos = {
                    x: end.x + (delta.x * (i / additionalPoints)),
                    y: end.y + (delta.y * (i / additionalPoints)),
                };
                this.drawPoint(pos.x, pos.y);
            }
        }
    }

    private editTextInner(text?: string) {
        if (!this._editedText) {
            if (text && text.length) {
                this.addText(text);
            }
            return;
        }
        if (!text || text.length == 0) {
            this._editedText.destroy(true);
        } else {
            this._editedText.text = text;
        }
        if (text && text.length > 0) {
            if (!this._textTransformer) {
                this._textTransformer = new Transformer({
                    boxRotationEnabled: true,
                    boxScalingEnabled: true,
                    boundingBoxes: 'groupOnly',
                    group: [this._editedText],
                    lockAspectRatio: true,
                    skewEnabled: true,
                    stage: this.editor.stage,
                });
                this._textTransformer.on('pointertap', this.onTextPointerTap, this);
                this.editor.stage.addChild(this._textTransformer);
            } else if (!this._textTransformer.group.includes(this._editedText)) {
                while (this._textTransformer.group.length > 0) {
                    this._textTransformer.group.pop();
                }
                this._textTransformer.group.push(this._editedText);
            }
        }
        delete this._editedText;
    }

    private flipInner(vertical?: boolean) {
        this.cancelOngoingOperations();
        if (!this._container) {
            return;
        }
        if (this._container.angle % 180 != 0) {
            vertical = !vertical;
        }
        this._container.scale.set(
            vertical ? this._container.scale.x : -this._container.scale.x,
            vertical ? -this._container.scale.y : this._container.scale.y);
    }

    private getDialog(text?: string | null) {
        const close = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();

            if (!(ev.target instanceof HTMLElement)) {
                return;
            }

            const dialog = ev.target.closest('dialog');
            if (dialog) {
                dialog.close();
            }
        };

        const container = document.createElement('div');
        container.classList.add('dialog-container');
        document.body.appendChild(container);

        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        container.appendChild(overlay);
        overlay.addEventListener('click', close);

        const dialog = document.createElement('dialog') as Dialog;
        dialog.id = randomUUID();
        dialog.classList.add('resizable');
        dialog.style.minWidth = 'fit-content';
        dialog.style.width = '50vw';
        container.appendChild(dialog);
        dialog.addEventListener('close', ev => {
            if (!(ev.target instanceof HTMLDialogElement)) {
                return;
            }

            const form = ev.target.querySelector('form');
            if (!form) {
                return;
            }
            if (ev.target.returnValue === 'ok') {
                if (!form.checkValidity()) {
                    return;
                }

                const textInput = form.querySelector<TavenemInputFieldHtmlElement>('.text-input');
                const value = textInput?.value;

                if (!value
                    || !value.length) {
                    return;
                }

                this.editText(value);
            }
            form.reset();
        });

        const dialogInner = document.createElement('div');
        dialog.appendChild(dialogInner);

        const header = document.createElement('div');
        header.classList.add('header', 'draggable');
        dialogInner.appendChild(header);

        const heading = document.createElement('h6');
        heading.textContent = 'Edit text';
        header.appendChild(heading);

        const closeButton = document.createElement('tf-close');
        header.appendChild(closeButton);
        closeButton.addEventListener('click', close);

        const body = document.createElement('div');
        body.classList.add('body');
        dialogInner.appendChild(body);

        const form = document.createElement('form');
        form.id = randomUUID();
        body.appendChild(form);

        const validate = (ev: Event) => {
            if (!(ev.target instanceof HTMLElement)) {
                return;
            }

            const form = ev.target.closest('form');
            if (!form) {
                return;
            }

            const okButton = ev.target.closest('dialog')?.querySelector<HTMLButtonElement>('.ok-button');
            if (okButton) {
                okButton.disabled = !form.checkValidity();
            }
        };

        const urlInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        urlInput.classList.add('text-input');
        urlInput.setAttribute('name', 'text');
        urlInput.setAttribute('placeholder', "Enter your text here");
        urlInput.setAttribute('required', '');
        urlInput.setAttribute('type', 'text');
        if (text) {
            urlInput.setAttribute('value', text);
        }
        form.appendChild(urlInput);
        urlInput.addEventListener('valueinput', validate);
        urlInput.addEventListener('valuechange', validate);

        const footer = document.createElement('div');
        footer.classList.add('footer');
        dialogInner.appendChild(footer);

        const buttons = document.createElement('div');
        buttons.classList.add('message-box-buttons');
        footer.appendChild(buttons);

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('btn', 'btn-text');
        cancelButton.textContent = 'Cancel';
        buttons.appendChild(cancelButton);
        cancelButton.addEventListener('click', close);

        const okButton = document.createElement('button');
        okButton.classList.add('btn', 'btn-text', 'primary', 'ok-button');
        okButton.disabled = true;
        okButton.value = 'ok';
        okButton.formMethod = 'dialog';
        okButton.textContent = 'OK';
        okButton.setAttribute('form', form.id);
        buttons.appendChild(okButton);

        initializeDialog(dialog);
        return dialog;
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (!e.isPrimary
            || !e.global) {
            return;
        }

        if (!(e.target instanceof Transformer)
            && !(e.target instanceof TransformerHandle)
            && this._textTransformer) {
            this.cancelOngoingOperations();
        }

        if (this.drawingMode == DrawingMode.Brush
            && this._drawn) {
            this._lastPosition = e.getLocalPosition(this._drawn);
            this._drawing = true;
        }
    }

    private onPointerMove(e: FederatedPointerEvent) {
        if (!e.isPrimary || !e.global) {
            return;
        }

        if (this._brushCursor) {
            this._brushCursor.position.copyFrom(e.global);
        }

        if (this._drawing
            && this.drawingMode == DrawingMode.Brush
            && this._drawn) {
            const position = e.getLocalPosition(this._drawn);
            if (this._lastPosition) {
                this.drawPointLine(this._lastPosition, position)
            }
            this._lastPosition = position;
        }
    }

    private onTextPointerTap(e: FederatedPointerEvent) {
        if (this.editor.stage.children.length < 1) {
            return;
        }
        this.simulateTap(e);
        let text: Text | undefined;
        if (e.target instanceof Text) {
            text = e.target;
        }
        if (text) {
            if (!this._textTransformer) {
                this._textTransformer = new Transformer({
                    boxRotationEnabled: true,
                    boxScalingEnabled: true,
                    boundingBoxes: 'groupOnly',
                    group: [text],
                    lockAspectRatio: true,
                    skewEnabled: true,
                });
                this._textTransformer.on('pointertap', this.onTextPointerTap, this);
                this.editor.stage.addChild(this._textTransformer);
            }
        } else {
            let transformer: Transformer | null = null;
            let current: FederatedEventTarget | undefined = e.target;
            while (transformer == null && current) {
                if (current instanceof Transformer) {
                    transformer = current;
                } else {
                    current = current.parent;
                }
            }
            if (transformer && transformer.group.length) {
                text = transformer.group.find(x => x instanceof Text) as Text | undefined;
            }
        }

        if (text && this._textTapped) {
            this._textTapped = false;
            clearTimeout(this._textDoubleTapped);
            this.cancelOngoingOperations();
            this._editedText = text;
            this.getTextDialogResponse(text.text);
            return;
        }

        this._textTapped = false;
        clearTimeout(this._textDoubleTapped);

        if (text) {
            this._textTapped = true;
            this._textDoubleTapped = setTimeout(() => { this._textTapped = false; }, 600);
        }
    }

    private onPointerUp(e: FederatedPointerEvent) {
        if (e.isPrimary
            && this.drawingMode == DrawingMode.Brush) {
            if (this._drawing
                && this._drawn) {
                const position = e.getLocalPosition(this._drawn);
                if (this._lastPosition) {
                    this.drawPointLine(this._lastPosition, position)
                }
                this._lastPosition = position;
            }
            this._drawing = false;
        }
    }

    private renderPoints() {
        if (this._drawing) {
            if (this._brushBuffer.children.length === 0) {
                return;
            }
            this.editor.renderer.render(this._brushBuffer, {
                renderTexture: this._brushCanvasTexture,
                clear: false,
            });
            this._brushBuffer.children.forEach(x => x.setParent(this._brushHistoryBuffer));
            return;
        }

        this._brushBuffer.children.forEach(x => x.setParent(this._brushHistoryBuffer));

        if (this._brushHistoryBuffer.children.length === 0) {
            return;
        }

        this._brushHistory.push(this._brushHistoryBuffer);
        this.saveState(this.renderPointsInner.bind(this, this._brushHistoryBuffer), true);
        this._brushHistoryBuffer = new Container();
        this.updateBrush();
    }

    private renderPointsInner(buffer: Container) {
        this.editor.renderer.render(buffer, {
            renderTexture: this._brushCanvasTexture,
            clear: false,
        });
    }

    private rotateInner(angle: number) {
        this.cancelOngoingOperations();
        if (!this._container) {
            return;
        }

        const newAngle = (this._container.angle + angle) % 360;
        if (Math.abs(newAngle - this._container.angle) % 180 == 90) {
            this.editor.renderer.resize(this.editor.view.height, this.editor.view.width);
            if (this._brushCanvasTexture) {
                this._brushCanvasTexture.resize(this.editor.view.width, this.editor.view.height);
            }
            this._container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
        }
        this._container.angle = newAngle;
    }

    private saveState(step: Function, skipExecute: boolean = false) {
        if (this._undoStack.length >= this._maxCount) {
            this._undoStack.shift();
        }
        this._undoStack.push(step);
        this._redoStack = [];

        if (!skipExecute) {
            step();
        }

        this.updateRedo(false);
        if (this._undoStack.length > 0) {
            this.updateUndo(true);
        }
    }

    private async saveStateAsync(step: () => Promise<void>, skipExecute: boolean = false) {
        if (this._undoStack.length >= this._maxCount) {
            this._undoStack.shift();
        }
        this._undoStack.push(step);
        this._redoStack = [];

        if (!skipExecute) {
            await step();
        }

        this.updateRedo(false);
        if (this._undoStack.length > 0) {
            this.updateUndo(true);
        }
    }

    private simulatedTap(e: PointerEventInit) {
        e.view = window;
        this.editor.renderer.view.dispatchEvent(new PointerEvent('pointerdown', e));
    }

    private simulateTap(e: FederatedPointerEvent) {
        const eventInitDict: PointerEventInit = {
            bubbles: true,
            cancelable: true,
            button: 0,
            buttons: 1,
            isPrimary: true,
            pointerType: 'mouse',
            clientX: e.clientX,
            clientY: e.clientY,
        };
        this.saveState(this.simulatedTap.bind(this, eventInitDict), true);
    }

    private updateBrush() {
        this._brushTexture = this._brushGenerator.get(
            this._brushSize,
            this._brushColor,
        );
    }
}

settings.RENDER_OPTIONS!.hello = false;

function colorHexToNumber(color: string) {
    if (color.startsWith('#')) {
        if (color.length === 7 || color.length === 9) {
            return parseInt(color.substring(1, 7), 16);
        } else if (color.length === 4) {
            return parseInt(color.substring(1).split('').map(function (hex) {
                return hex + hex;
            }).join(''), 16);
        }
    }
    return 0x000000;
}