import { ShapeModule } from "@common/painter/modules/shape";
import { wrapTranslate } from "@common/utils/ctxWrapper";
import { moduleTestWrapper } from "@utils/util";

moduleTestWrapper(1200, 800, true, async (canvas) => {
    const module = new ShapeModule();
    const ctx = canvas.getContext("2d");

    // Anchored at (100, 100) like a painter does, extends from (600, 400) to the bottom right corner of the canvas.
    const offset = { x: 100, y: 100 };
    await wrapTranslate(ctx, offset.x, offset.y, () =>
        module.draw(
            ctx,
            undefined,
            { type: "shape", x: 500, y: 300, fill: "#bbdefa", shape: { kind: "rectangle", width: "canvas", height: "canvas" } },
            undefined,
            { canvas: { width: canvas.width, height: canvas.height }, offset },
        ),
    );
    // Without a resolved layout, an extent of canvas draws nothing.
    await module.draw(ctx, undefined, { type: "shape", x: 0, y: 0, fill: "#ff0000", shape: { kind: "rectangle", width: "canvas", height: 100 } });

    await module.draw(ctx, undefined, {
        type: "shape",
        x: 40,
        y: 40,
        fill: "#98ebbe",
        stroke: { color: "#048b41", width: 6 },
        shape: { kind: "rectangle", width: 300, height: 200, radius: 24 },
    });
    await module.draw(ctx, undefined, {
        type: "shape",
        x: 500,
        y: 140,
        fill: "#ff4a5a",
        stroke: { color: "#ffffff", width: 4 },
        shape: { kind: "circle", radius: 100 },
    });
    await module.draw(ctx, undefined, {
        type: "shape",
        x: 850,
        y: 140,
        fill: "#a04fda",
        opacity: 0.5,
        shape: { kind: "ellipse", radiusX: 180, radiusY: 80 },
    });
    await module.draw(ctx, undefined, {
        type: "shape",
        x: 40,
        y: 300,
        stroke: { color: "#ffbb00", width: 10 },
        shape: { kind: "line", to: { x: 400, y: 150 } },
    });
    await module.draw(ctx, undefined, {
        type: "shape",
        x: 40,
        y: 500,
        fill: "#70e262",
        stroke: { color: "#226180", width: 4 },
        shape: {
            kind: "polygon",
            points: [
                { x: 100, y: 0 },
                { x: 200, y: 200 },
                { x: 0, y: 200 },
            ],
        },
    });
    await module.draw(ctx, undefined, {
        type: "shape",
        x: 300,
        y: 500,
        stroke: { color: "#000000", width: 3 },
        shape: { kind: "rectangle", width: 200, height: 200 },
    });
    return canvas;
});
