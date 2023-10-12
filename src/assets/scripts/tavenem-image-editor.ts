import {
    ALPHA_MODES,
    Application,
    Assets,
    BLEND_MODES,
    BlurFilter,
    Container,
    DisplayObject,
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

interface DotNetStreamReference {
    arrayBuffer(): Promise<ArrayBuffer>;
}

const enum DrawingMode {
    None,
    Brush,
}

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
        for (let i = 0; i < this.sprites.length; i++)
            this.sprites[i].destroy();
    }
}

class ImageEditor {
    readonly editor: Application;
    backgroundImage: Sprite | undefined;
    drawingMode = DrawingMode.None;
    originalHeight: number;
    originalSrc: string | undefined;
    originalWidth: number;
    private _brushBuffer = new Container();
    private _brushCanvasTexture: RenderTexture | undefined;
    private _brushColor = "#000000";
    private _brushCursor: Sprite | undefined;
    private _brushGenerator: BrushGenerator;
    private _brushSize = 12;
    private _brushTexture: RenderTexture | undefined;
    private _cropAspectRatio: number | undefined;
    private _cropRect: Sprite | undefined;
    private _cropTransformer: Transformer | undefined;
    private _currentState: string | undefined;
    private _drawing = false;
    private _drawn: Sprite | undefined;
    private _editedText: Text | undefined;
    private _heightLimit: number | undefined;
    private _isErasing = false;
    private _lastPosition: { x: number, y: number } | undefined;
    private _maxCount = 100;
    private _redoStack: string[] = [];
    private _spritePool = new SpritePool();
    private _textColor = "#000000";
    private _textTapped = false;
    private _textDoubleTapped: number | undefined;
    private _textTransformer: Transformer | undefined;
    private _undoStack: string[] = [];
    private _widthLimit: number | undefined;

    constructor(
        private readonly dotNetObjectReference: DotNet.DotNetObject,
        width: number,
        height: number,
        widthLimit: number | undefined,
        heightLimit: number | undefined) {
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
        this.editor.stage.interactive = true;
        this.editor.stage.interactiveChildren = false;
        this.editor.stage.hitArea = this.editor.screen;
        this.editor.stage.cursor = 'crosshair';
        this.editor.stage.on('pointerdown', this.onPointerDown, this);
        this.editor.stage.on('pointermove', this.onPointerMove, this);
        this.editor.stage.on('pointerup', this.onPointerUp, this);
        this.editor.stage.on('pointerupoutside', this.onPointerUp, this);
    }

    addText(text: string) {
        if (this.editor.stage.children.length < 1) {
            return;
        }
        this.cancelOngoingOperations();
        const container = this.editor.stage.children[0] as Container;
        const t = new Text(text, {
            fill: this._textColor,
            fontSize: this.editor.view.height,
        });
        t.anchor.set(0.5, 0.5);
        t.x = this.editor.view.width / 2;
        t.y = this.editor.view.height / 2;
        t.scale.set(0.3);
        t.interactive = true;
        t.on('pointertap', this.onTextPointerTap, this);
        container.addChild(t);
        this.saveState();
        this._textTransformer = new Transformer({
            boxRotationEnabled: true,
            boxScalingEnabled: true,
            boundingBoxes: 'groupOnly',
            group: [t],
            lockAspectRatio: true,
            skewEnabled: true,
        });
        this._textTransformer.on('pointertap', this.onTextPointerTap, this);
        this.editor.stage.addChild(this._textTransformer);
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
            this.dotNetObjectReference.invokeMethodAsync('NotifyCancel');
        }
    }

    clear() {
        this.cancelOngoingOperations();
        if (this.editor.stage.children.length > 0) {
            const container = this.editor.stage.children[0];
            container.destroy(true);
            delete this.backgroundImage;
            delete this._brushCanvasTexture;
            delete this._drawn;
            this._brushTexture?.destroy(true);
            delete this._brushTexture;
        }
        this.resetContainer();
    }

    clearHistory() {
        this.cancelOngoingOperations();
        this._redoStack = [];
        this._undoStack = [];
        this._currentState = this.snapshot();
        this.dotNetObjectReference.invokeMethodAsync('NotifyRedoHistory', false);
        this.dotNetObjectReference.invokeMethodAsync('NotifyUndoHistory', false);
    }

    crop() {
        if (!this._cropRect
            || this._cropRect.height <= 0
            || this._cropRect.width <= 0
            || this.editor.stage.children.length < 1) {
            return;
        }
        if (this._cropTransformer) {
            this.editor.stage.removeChild(this._cropTransformer);
            this._cropTransformer.destroy(true);
            delete this._cropTransformer;
        }
        const texture = this.editor.renderer.generateTexture(this.editor.stage, {
            region: new Rectangle(
                this._cropRect.x - (this._cropRect.width / 2),
                this._cropRect.y - (this._cropRect.height / 2),
                this._cropRect.width,
                this._cropRect.height),
        });
        const canvas = this.editor.renderer.extract.canvas(texture) as HTMLCanvasElement;
        this.clear();
        const container = this.editor.stage.children[0] as Container;
        this.backgroundImage = Sprite.from(canvas);
        this.backgroundImage.interactive = false;
        this.editor.renderer.resize(this.backgroundImage.width, this.backgroundImage.height);
        if (this._brushCanvasTexture) {
            this._brushCanvasTexture.resize(this.editor.view.width, this.editor.view.height);
        }
        container.pivot = new Point(this.editor.view.width / 2, this.editor.view.height / 2);
        container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
        this.backgroundImage.setParent(container);
        texture.destroy(true);
        this.saveState();
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

    destroy() {
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
        this.editor.destroy(true, true);
        delete this.backgroundImage;
        delete this._brushCursor;
        delete this._brushCanvasTexture;
        delete this._brushTexture;
        delete this._drawn;
    }

    editText(text?: string) {
        if (!this._editedText) {
            return;
        }
        if (!text || text.length == 0) {
            this._editedText.destroy(true);
        } else {
            this._editedText.text = text;
        }
        this.saveState();
        if (text && text.length > 0) {
            if (!this._textTransformer) {
                this._textTransformer = new Transformer({
                    boxRotationEnabled: true,
                    boxScalingEnabled: true,
                    boundingBoxes: 'groupOnly',
                    group: [this._editedText],
                    lockAspectRatio: true,
                    skewEnabled: true,
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

    flip(vertical?: boolean) {
        this.cancelOngoingOperations();
        if (this.editor.stage.children.length < 1) {
            return;
        }
        const container = this.editor.stage.children[0] as Container;
        if (container.angle % 180 != 0) {
            vertical = !vertical;
        }
        container.scale.set(
            vertical ? container.scale.x : -container.scale.x,
            vertical ? -container.scale.y : container.scale.y);
        this.saveState();
    }

    getCropBounds() {
        if (!this._cropRect
            || this._cropRect.height <= 0
            || this._cropRect.width <= 0
            || this.editor.stage.children.length < 1) {
            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
        }
        return {
            x: this._cropRect.x - (this._cropRect.width / 2),
            y: this._cropRect.y - (this._cropRect.height / 2),
            width: this._cropRect.width,
            height: this._cropRect.height,
        };
    }

    async getStream(type?: string, quality?: number) {
        type = type || "image/png";
        quality = quality || 0.92;
        this.cancelOngoingOperations();
        const renderTexture = RenderTexture.create({
            width: this.editor.view.width,
            height: this.editor.view.height
        });
        this.editor.renderer.render(this.editor.stage, {
            renderTexture
        });
        const canvas = this.editor.renderer.extract.canvas(renderTexture) as HTMLCanvasElement;
        renderTexture.destroy(true);
        return await new Promise(resolve => canvas.toBlob(resolve, type, quality));
    }

    redo(callback?: Function) {
        this.cancelOngoingOperations();
        if (this._redoStack.length === 0) {
            return;
        }
        this._currentState = this._redoStack.pop();
        const snapshot = this.snapshot();
        if (snapshot) {
            this._undoStack.push(snapshot);
        }

        this.restoreSnapshot(this._currentState!);
        if (typeof callback === 'function') {
            callback();
        }

        if (this._undoStack.length > 0) {
            this.dotNetObjectReference.invokeMethodAsync('NotifyUndoHistory', true);
        }
        if (this._redoStack.length === 0) {
            this.dotNetObjectReference.invokeMethodAsync('NotifyRedoHistory', false);
        }
    }

    resetContainer() {
        const container = new Container();
        container.pivot = new Point(this.editor.view.width / 2, this.editor.view.height / 2);
        container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
        this.editor.stage.addChild(container);

        if (this._brushCanvasTexture) {
            this._brushCanvasTexture.destroy(true);
        }
        this._brushCanvasTexture = RenderTexture.create({
            width: this.editor.view.width,
            height: this.editor.view.height,
        });
        this._drawn = new Sprite(this._brushCanvasTexture);
        container.addChild(this._drawn);
    }

    rotate(angle: number) {
        this.cancelOngoingOperations();
        if (this.editor.stage.children.length < 1) {
            return;
        }
        const container = this.editor.stage.children[0] as Container;

        const newAngle = (container.angle + angle) % 360;
        if (Math.abs(newAngle - container.angle) % 180 == 90) {
            this.editor.renderer.resize(this.editor.view.height, this.editor.view.width);
            if (this._brushCanvasTexture) {
                this._brushCanvasTexture.resize(this.editor.view.width, this.editor.view.height);
            }
            container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
        }
        container.angle = newAngle;
        this.saveState();
    }

    async save(type?: string, quality?: number) {
        this.cancelOngoingOperations(true);
        type = type || "image/png";
        quality = quality || 0.92;
        if (this.editor.view instanceof HTMLCanvasElement
            && this.editor.view.parentElement) {
            const renderTexture = RenderTexture.create({
                width: this.editor.view.width,
                height: this.editor.view.height,
            });
            this.editor.renderer.render(this.editor.stage, {
                renderTexture
            });
            const image = await this.editor.renderer.extract.image(renderTexture);
            renderTexture.destroy(true);
            let height = image.height;
            let width = image.width;

            if (this.editor.stage.children.length > 0) {
                const container = this.editor.stage.children[0] as Container;
                if (Math.abs(container.angle) % 180 == 90) {
                    height = image.width;
                    width = image.height;
                }
            }

            image.style.width = '100%';
            image.style.height = '100%';
            image.style.objectFit = 'scale-down';
            this.editor.view.parentElement.appendChild(image);
        }
        this.editor.destroy(true, true);
        delete this.backgroundImage;
        delete this._brushCursor;
        delete this._brushCanvasTexture;
        delete this._brushTexture;
        delete this._drawn;
    }

    async setBackgroundImage(imageUrl?: string) {
        this.cancelOngoingOperations();
        this.clear();
        const container = this.editor.stage.children[0] as Container;

        if (this.backgroundImage) {
            container.removeChild(this.backgroundImage);
            this.backgroundImage.destroy(true);
            this.backgroundImage = undefined;
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
            this.backgroundImage.interactive = false;
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
            container.pivot = new Point(this.editor.view.width / 2, this.editor.view.height / 2);
            container.position.set(this.editor.view.width / 2, this.editor.view.height / 2);
            container.addChildAt(this.backgroundImage, 0);
        }
        this.clearHistory();
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

    setCropAspectRatio(ratio?: number) {
        this._cropAspectRatio = ratio;
        if (this._cropTransformer) {
            this._cropTransformer.lockAspectRatio = this._cropAspectRatio != null && this._cropAspectRatio != 0;
        }
        if (!this._cropAspectRatio
            || this.editor.stage.children.length < 1) {
            return;
        }
        if (this._cropRect) {
            let width = this._cropRect.width;
            let height;
            if (this._cropAspectRatio < 0) {
                height = width / (this.originalWidth / this.originalHeight);
            } else {
                height = width / this._cropAspectRatio;
            }
            const container = this.editor.stage.children[0] as Container;
            if (height > container.height) {
                height = container.height;
                width = height * this._cropAspectRatio!;
            }
            this._cropRect.scale.set(width / 16, height / 16);
        }
    }

    setDrawingMode(mode: DrawingMode) {
        this.drawingMode = mode;
        if (this.drawingMode == DrawingMode.Brush) {
            this.cancelOngoingOperations();

            this.editor.stage.interactive = true;
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
            } else {
                this.editor.stage.addChild(this._brushCursor);
            }
        } else {
            this.editor.stage.cursor = 'default';
            this.editor.stage.interactive = false;
            if (this._brushCursor) {
                this.editor.stage.removeChild(this._brushCursor);
            }
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
        if (!this._cropAspectRatio
            || this._cropAspectRatio < 0) {
            height = this.editor.view.height / 2;
        } else {
            height = width / this._cropAspectRatio;
        }
        if (height > this.editor.view.height) {
            height = this.editor.view.height;
            width = height * this._cropAspectRatio!;
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
            lockAspectRatio: this._cropAspectRatio != null && this._cropAspectRatio != 0,
        });
        this._cropTransformer.enabledHandles = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        this._cropTransformer.rotateEnabled = false;
        this.editor.stage.addChild(this._cropTransformer);
    }

    undo(callback?: Function) {
        this.cancelOngoingOperations();
        if (this._undoStack.length === 0) {
            return;
        }
        this._currentState = this._undoStack.pop();
        const snapshot = this.snapshot();
        if (snapshot) {
            this._redoStack.push(snapshot);
        }

        this.restoreSnapshot(this._currentState!);
        if (typeof callback === 'function') {
            callback();
        }

        if (this._redoStack.length > 0) {
            this.dotNetObjectReference.invokeMethodAsync('NotifyRedoHistory', true);
        }
        if (this._undoStack.length === 0) {
            this.dotNetObjectReference.invokeMethodAsync('NotifyUndoHistory', false);
        }
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
        } else {
            sprite.blendMode = BLEND_MODES.NORMAL;
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
            const transformer = e.target as unknown as Transformer;
            if (transformer && transformer.group.length) {
                text = transformer.group.find(x => x instanceof Text) as Text | undefined;
            }
        }

        if (text && this._textTapped) {
            this._textTapped = false;
            clearTimeout(this._textDoubleTapped);
            this.cancelOngoingOperations();
            this._editedText = text;
            this.dotNetObjectReference.invokeMethodAsync('NotifyEditText', text.text);
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
        if (this._brushBuffer.children.length === 0) {
            return;
        }
        this.editor.renderer.render(this._brushBuffer, {
            renderTexture: this._brushCanvasTexture,
            clear: false,
        });
        this._brushBuffer.removeChildren();
        if (!this._drawing) {
            this.saveState();
        }
    }

    private restoreSnapshot(snapshot: string) {
        if (this.editor.stage.children.length < 1) {
            return;
        }
        const children = JSON.parse(snapshot) as DisplayObject[];
        this.clear();
        const container = this.editor.stage.children[0] as Container;
        for (const child of children) {
            child.setParent(container);
        }
    }

    private snapshot() {
        if (this.editor.stage.children.length < 1) {
            return;
        }
        const container = this.editor.stage.children[0] as Container;

        return JSON.stringify(container.children, (key, value) => {
            const exclude = ['scope', 'parent'];
            if (key.substring(0, 1) !== '_'
                && exclude.indexOf(key) == -1) {
                return value;
            }
        });
    }

    private saveState() {
        if (this._undoStack.length >= this._maxCount) {
            this._undoStack.shift();
        }
        if (this._currentState) {
            this._undoStack.push(this._currentState);
        }
        this._currentState = this.snapshot();
        this._redoStack = [];
        this.dotNetObjectReference.invokeMethodAsync('NotifyRedoHistory', false);
        if (this._undoStack.length > 0) {
            this.dotNetObjectReference.invokeMethodAsync('NotifyUndoHistory', true);
        }
    }

    private updateBrush() {
        this._brushTexture = this._brushGenerator.get(
            this._brushSize,
            this._brushColor,
        );
    }
}

settings.RENDER_OPTIONS!.hello = false;

const editors: Record<string, ImageEditor> = {};

export function addText(containerId: string, text: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.addText(text);
    }
}

export function cancel(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.cancelOngoingOperations();
    }
}

export function clear(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.clear();
    }
}

export function crop(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.crop();
    }
}

export function destroy(containerId: string, withRevoke: boolean) {
    const editor = editors[containerId];
    if (editor) {
        editor.destroy();
    }
    delete editors[containerId];

    const container = document.getElementById(containerId);
    if (!(container instanceof HTMLElement)) {
        return;
    }

    if (withRevoke) {
        const imageElement = container.querySelector('img');
        if (imageElement
            && imageElement.src
            && imageElement.src.startsWith("blob")) {
            URL.revokeObjectURL(imageElement.src);
        }
    }
}

export function editText(containerId: string, text?: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.editText(text);
    }
}

export function exportImage(containerId: string, type?: string, quality?: number) {
    type = type || "image/png";
    quality = quality || 0.92;
    const link = document.createElement('a');
    const filename = type.replace('/', '.');
    link.download = filename;
    const editor = editors[containerId];
    if (editor) {
        const renderTexture = RenderTexture.create({
            width: editor.editor.view.width,
            height: editor.editor.view.height
        });
        editor.editor.renderer.render(editor.editor.stage, {
            renderTexture
        });
        const canvas = editor.editor.renderer.extract.canvas(renderTexture) as HTMLCanvasElement;
        renderTexture.destroy(true);
        link.href = canvas.toDataURL(type, quality).replace(type, 'image/octet-stream');
        link.click();
    } else {
        const container = document.getElementById(containerId);
        if (container instanceof HTMLElement) {
            const img = container.querySelector('img');
            if (img && img.src) {
                link.href = img.src;
                link.click();
            }
        }
    }
}

export function flipHorizontal(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.flip();
    }
}

export function flipVertical(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.flip(true);
    }
}

export function getCropBounds(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        return editor.getCropBounds();
    } else {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
    }
}

export function getStream(containerId: string, type?: string, quality?: number) {
    const editor = editors[containerId];
    if (editor) {
        return editor.getStream(type, quality);
    }
}

export async function loadEditor(
    dotNetObjectReference: DotNet.DotNetObject,
    containerId: string,
    imageUrl?: string,
    cropAspectRatio?: number) {
    let editor = editors[containerId];
    if (!editor) {
        const container = document.getElementById(containerId);
        if (!(container instanceof HTMLElement)) {
            return;
        }
        const imageElement = container.querySelector('img');
        const widthLimit = container.clientWidth;
        const heightLimit = container.clientHeight;
        let width, height;
        if (imageElement) {
            if (!imageUrl) {
                imageUrl = imageElement.src;
            }
            width = imageElement.naturalWidth;
            height = imageElement.naturalHeight;
        } else {
            width = widthLimit;
            height = heightLimit;
        }
        if (height <= 0) {
            height = 100;
        }
        if (width <= 0) {
            width = 100;
        }
        editor = new ImageEditor(dotNetObjectReference, width, height, widthLimit, heightLimit);
        if (!(editor.editor.view instanceof HTMLCanvasElement)) {
            return;
        }
        editors[containerId] = editor;
        container.appendChild(editor.editor.view);
        if (imageElement) {
            imageElement.remove();
        }
        if (!imageUrl) {
            editor.resetContainer();
        }
    } else if (!imageUrl) {
        const container = document.getElementById(containerId);
        if (container instanceof HTMLElement) {
            const imageElement = container.querySelector('img');
            if (imageElement) {
                imageUrl = imageElement.src;
            }
        }
    }
    if (imageUrl) {
        await editor.setBackgroundImage(imageUrl);
    }
    if (cropAspectRatio) {
        editor.setCropAspectRatio(cropAspectRatio);
    }
}

export function loadImage(containerId: string, imageUrl?: string) {
    let editor = editors[containerId];
    if (editor) {
        destroy(containerId, true);
    }
    const container = document.getElementById(containerId);
    if (!(container instanceof HTMLElement)) {
        return;
    }

    let imageElement = container.querySelector('img');
    if (imageElement
        && imageElement.src
        && imageElement.src.startsWith("blob")) {
        URL.revokeObjectURL(imageElement.src);
    }

    if (!imageElement) {
        imageElement = document.createElement('img');
        imageElement.style.width = '100%';
        imageElement.style.height = '100%';
        imageElement.style.objectFit = 'scale-down';
        container.appendChild(imageElement);
    }

    if (imageUrl) {
        imageElement.src = imageUrl;
    }
}

export async function loadImageFromStream(containerId: string, imageStream?: DotNetStreamReference) {
    if (!imageStream) {
        loadImage(containerId);
        return;
    }

    let editor = editors[containerId];
    if (editor) {
        destroy(containerId, true);
    }
    const container = document.getElementById(containerId);
    if (!(container instanceof HTMLElement)) {
        return;
    }

    let imageElement = container.querySelector('img');
    if (imageElement
        && imageElement.src
        && imageElement.src.startsWith("blob")) {
        URL.revokeObjectURL(imageElement.src);
    }

    const buffer: ArrayBuffer = await imageStream.arrayBuffer();
    const blob = new Blob([buffer]);
    const imageUrl = URL.createObjectURL(blob);

    if (!imageElement) {
        imageElement = document.createElement('img');
        imageElement.style.width = '100%';
        imageElement.style.height = '100%';
        imageElement.style.objectFit = 'scale-down';
        container.appendChild(imageElement);
    }
    if (imageUrl) {
        imageElement.src = imageUrl;
    }
}

export function redo(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.redo();
    }
}

export function rotateClockwise(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.rotate(90);
    }
}

export function rotateCounterClockwise(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.rotate(-90);
    }
}

export function save(containerId: string, type?: string, quality?: number) {
    const editor = editors[containerId];
    if (editor) {
        editor.save(type, quality);
    }
    delete editors[containerId];
}

export async function setBackgroundImage(containerId: string, imageUrl?: string) {
    const editor = editors[containerId];
    if (editor) {
        await editor.setBackgroundImage(imageUrl);
    }
}

export async function setBackgroundImageFromStream(containerId: string, imageStream?: DotNetStreamReference) {
    if (!imageStream) {
        setBackgroundImage(containerId);
        return;
    }

    const editor = editors[containerId];
    if (editor) {
        const buffer: ArrayBuffer = await imageStream.arrayBuffer();
        const blob = new Blob([buffer]);
        const imageUrl = URL.createObjectURL(blob);

        await editor.setBackgroundImage(imageUrl);

        URL.revokeObjectURL(imageUrl);
    }
}

export function setBrushColor(containerId: string, color?: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.setBrushColor(color);
        editor.setTextColor(color);
    }
}

export function setBrushSize(containerId: string, size?: number) {
    const editor = editors[containerId];
    if (editor) {
        editor.setBrushSize(size);
    }
}

export function setCropAspectRatio(containerId: string, ratio?: number) {
    const editor = editors[containerId];
    if (editor) {
        editor.setCropAspectRatio(ratio);
    }
}

export function setDrawingMode(containerId: string, mode?: DrawingMode) {
    const editor = editors[containerId];
    if (editor) {
        editor.setDrawingMode(mode || DrawingMode.None);
    }
}

export function setIsErasing(containerId: string, value: boolean) {
    const editor = editors[containerId];
    if (editor) {
        editor.setIsErasing(value);
    }
}

export function startCrop(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.startCrop();
    }
}

export function undo(containerId: string) {
    const editor = editors[containerId];
    if (editor) {
        editor.undo();
    }
}

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

window.addEventListener('keydown', ev => {
    if (ev.key === 'Delete'
        || ev.key === 'Backspace') {
        for (const key in editors) {
            const editor = editors[key];
            editor.delete();
        }
    }
});