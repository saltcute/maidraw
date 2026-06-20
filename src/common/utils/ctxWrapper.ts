import type { CanvasGradient, CanvasPattern, CanvasRenderingContext2D } from "canvas";

function runAfterOrWaitForPromise<T>(process: () => T, after: () => void) {
    const result = process();
    if (result instanceof Promise) {
        return result.then((r) => {
            after();
            return r;
        }) as T;
    } else {
        after();
        return result;
    }
}

export function wrapContext<T>(ctx: CanvasRenderingContext2D, callback: () => T): T {
    ctx.save();
    return runAfterOrWaitForPromise(callback, () => {
        ctx.restore();
    });
}

export function wrapTranslate<T>(ctx: CanvasRenderingContext2D, x: number, y: number, callback: () => T) {
    return wrapContext(ctx, () => {
        ctx.translate(x, y);
        return callback();
    });
}

export function wrapBorder<T>(
    ctx: CanvasRenderingContext2D,
    style: string | CanvasGradient | CanvasPattern,
    lineWidth: number,
    callback: () => T,
    ...args: Parameters<CanvasRenderingContext2D["roundRect"]>
) {
    wrapContext(ctx, () => {
        ctx.beginPath();
        ctx.roundRect(...args);
        ctx.strokeStyle = style;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    });
    return callback();
}

export function wrapBackground<T>(
    ctx: CanvasRenderingContext2D,
    style: string | CanvasGradient | CanvasPattern,
    callback: () => T,
    ...args: Parameters<CanvasRenderingContext2D["roundRect"]>
) {
    wrapContext(ctx, () => {
        ctx.beginPath();
        ctx.roundRect(...args);
        ctx.fillStyle = style;
        ctx.fill();
    });
    return callback();
}

export function wrapClip<T>(ctx: CanvasRenderingContext2D, callback: () => T, ...args: Parameters<CanvasRenderingContext2D["roundRect"]>) {
    return wrapContext(ctx, () => {
        ctx.beginPath();
        ctx.roundRect(...args);
        ctx.clip();
        return callback();
    });
}
