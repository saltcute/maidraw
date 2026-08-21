import type { HitokotoModule } from "@common/painter/modules/hitokoto";
import type { ImageModule } from "@common/painter/modules/image";
import type { TextModule } from "@common/painter/modules/text";
import type { ThemeContext } from "@theme-tools/lib/context";
import type { z } from "zod/v4";

export type ImageElement = z.input<typeof ImageModule.SCHEMA>;
export type TextElement = z.input<typeof TextModule.SCHEMA>;
export type HitokotoElement = z.input<typeof HitokotoModule.SCHEMA>;

export type ImageOptions = Omit<ImageElement, "type" | "path"> & {
    /**
     * Path of the image, relative to `assets/`.
     */
    path: string;
};

/**
 * Element factories exist so that key order stays consistent across every generated manifest.
 * `JSON.stringify` drops undefined values, so an omitted option leaves no trace in the output.
 */
export function image(ctx: ThemeContext, options: ImageOptions): ImageElement {
    return {
        type: "image",
        x: options.x,
        y: options.y,
        align: options.align,
        width: options.width,
        height: options.height,
        path: ctx.ref(options.path),
        id: options.id,
        anchor: options.anchor,
    };
}

export function text(options: Omit<TextElement, "type">): TextElement {
    return {
        type: "text",
        size: options.size,
        x: options.x,
        y: options.y,
        color: options.color,
        borderColor: options.borderColor,
        align: options.align,
        width: options.width,
        height: options.height,
        linebreak: options.linebreak,
        font: options.font,
        content: options.content,
        id: options.id,
        anchor: options.anchor,
    };
}

export type HitokotoOptions = Omit<HitokotoElement, "type" | "customLines"> & {
    /**
     * Paths of the line sources, relative to `assets/`.
     */
    customLines?: string[];
};

export function hitokoto(ctx: ThemeContext, options: HitokotoOptions): HitokotoElement {
    return {
        type: "hitokoto",
        size: options.size,
        x: options.x,
        y: options.y,
        color: options.color,
        borderColor: options.borderColor,
        align: options.align,
        width: options.width,
        height: options.height,
        linebreak: options.linebreak,
        font: options.font,
        probability: options.probability,
        customLines: options.customLines?.map((line) => ctx.ref(line)),
        id: options.id,
        anchor: options.anchor,
    };
}
