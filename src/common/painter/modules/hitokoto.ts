import type { CanvasRenderingContext2D } from "canvas";
import z from "zod/v4";
import { PainterModule } from "../painter";
import type { Theme } from "../theme";
import { TextModule } from "./text";

export interface HitokotoModulePainterContext {
    probability?: number;
    customLines?: Record<string, string>;
    blocklist?: string[];
}

export class HitokotoModule extends PainterModule {
    public static readonly SCHEMA = TextModule.SCHEMA.omit({ content: true }).extend({
        type: z.literal("hitokoto"),
        probability: z.number().min(0).max(1).optional(),
        customLines: z.union([z.string(), z.array(z.string())]).optional(),
    });
    private textPainter: TextModule;
    constructor() {
        super();
        this.textPainter = new TextModule();
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof HitokotoModule.SCHEMA>,
        painterCtx: HitokotoModulePainterContext = {},
    ) {
        const probability = painterCtx.probability ?? element.probability ?? 0;
        function getRandomMemberFromArray<T>(array: T[], probability: number) {
            const r = Math.random();
            if (probability <= 0 || r > probability) return null;
            return array[Math.floor((r / probability) * array.length)];
        }
        let localLines = {};
        if (element.customLines !== undefined) {
            for (const path of Array.isArray(element.customLines) ? element.customLines : [element.customLines]) {
                try {
                    localLines = {
                        ...localLines,
                        ...JSON.parse(theme.getFile(path).toString()),
                    };
                } catch {}
            }
        }
        const lines: Record<string, string> = {
            ...localLines,
            ...painterCtx.customLines,
        };
        const availableLines = Object.entries(lines)
            .filter(([k]) => !painterCtx.blocklist?.includes(k))
            .map(([_, v]) => v);
        const content = getRandomMemberFromArray(availableLines, probability);
        if (content) {
            return this.textPainter.draw(ctx, theme, {
                ...element,
                type: "text",
                content,
            });
        }
    }
}
