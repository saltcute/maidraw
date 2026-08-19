import { type Bounds, PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { safeLoadImage } from "@common/utils/loadImage";
import { truncate } from "@common/utils/number";
import { drawText } from "@common/utils/textDraw/drawText";
import { color } from "@common/utils/zod";
import { AchievementTypes, ComboLamp, type Folder, FolderLamp, type Score, SyncLamp } from "@maimai/lib/types";
import { getDxStar, getMaxDxScore } from "@maimai/lib/util";
import type { CanvasGradient, CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Chart, type Database, Difficulty } from "gcm-database/maimai";
import z from "zod/v4";

export interface FolderModulePainterContext {
    folders: Folder[];
    /**
     * Scores of the player, indexed by chart identifier and difficulty.
     * A chart without a score is drawn without a lamp.
     */
    scores: Partial<Record<string, Partial<Record<Difficulty, Score>>>>;
}

const RAINBOW = ["#e81416", "#ffa500", "#faeb36", "#79c314", "#487de7", "#4b369d", "#70369d"];

export class FolderModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("folder"),
        /**
         * Minimum width of the card. The card grows with the jacket grid.
         */
        width: z.number().min(1),
        /**
         * Minimum height of the card. The card grows with the amount of folders and jackets.
         */
        height: z.number().min(1),
        margin: z.number().min(0),
        /**
         * Gap between two folders.
         */
        gap: z.number().min(0),
        /**
         * Amount of jackets on every row.
         */
        horizontalSize: z.number().min(1),
        color: z.object({
            card: color(),
        }),
        title: z.object({
            size: z.number().min(1),
            gap: z.number().min(0),
            borderColor: color(),
        }),
        jacket: z.object({
            size: z.number().min(1),
            gap: z.number().min(0),
            margin: z.number().min(0),
        }),
        bubble: z.object({
            color: z.object({
                basic: color(),
                advanced: color(),
                expert: color(),
                master: color(),
                remaster: color(),
                utage: color(),
            }),
        }),
        sprites: z.object({
            achievement: z.object({
                d: z.string(),
                c: z.string(),
                b: z.string(),
                bb: z.string(),
                bbb: z.string(),
                a: z.string(),
                aa: z.string(),
                aaa: z.string(),
                s: z.string(),
                sp: z.string(),
                ss: z.string(),
                ssp: z.string(),
                sss: z.string(),
                sssp: z.string(),
            }),
            milestone: z.object({
                ap: z.string(),
                app: z.string(),
                fc: z.string(),
                fcp: z.string(),
                fdx: z.string(),
                fdxp: z.string(),
                fs: z.string(),
                fsp: z.string(),
                sync: z.string(),
                none: z.string(),
            }),
        }),
    });
    constructor(private database: Database<Chart>) {
        super();
    }
    private getBubbleColorByDifficulty(element: z.infer<typeof FolderModule.SCHEMA>, chart: Chart) {
        const colorMap = {
            [Difficulty.EASY]: element.bubble.color.basic,
            [Difficulty.BASIC]: element.bubble.color.basic,
            [Difficulty.ADVANCED]: element.bubble.color.advanced,
            [Difficulty.EXPERT]: element.bubble.color.expert,
            [Difficulty.MASTER]: element.bubble.color.master,
            [Difficulty.RE_MASTER]: element.bubble.color.remaster,
            [Difficulty.UTAGE]: element.bubble.color.utage,
        } as const;
        return colorMap[chart.difficulty];
    }
    private getAchievementRankImagePath(element: z.infer<typeof FolderModule.SCHEMA>, score: Score) {
        const map = {
            [AchievementTypes.D]: element.sprites.achievement.d,
            [AchievementTypes.C]: element.sprites.achievement.c,
            [AchievementTypes.B]: element.sprites.achievement.b,
            [AchievementTypes.BB]: element.sprites.achievement.bb,
            [AchievementTypes.BBB]: element.sprites.achievement.bbb,
            [AchievementTypes.A]: element.sprites.achievement.a,
            [AchievementTypes.AA]: element.sprites.achievement.aa,
            [AchievementTypes.AAA]: element.sprites.achievement.aaa,
            [AchievementTypes.S]: element.sprites.achievement.s,
            [AchievementTypes.SP]: element.sprites.achievement.sp,
            [AchievementTypes.SS]: element.sprites.achievement.ss,
            [AchievementTypes.SSP]: element.sprites.achievement.ssp,
            [AchievementTypes.SSS]: element.sprites.achievement.sss,
            [AchievementTypes.SSSP]: element.sprites.achievement.sssp,
        } as const;
        return map[score.achievementRank];
    }
    private getComboLampImagePath(element: z.infer<typeof FolderModule.SCHEMA>, score: Score) {
        const map = {
            [ComboLamp.NONE]: element.sprites.milestone.none,
            [ComboLamp.FULL_COMBO]: element.sprites.milestone.fc,
            [ComboLamp.FULL_COMBO_PLUS]: element.sprites.milestone.fcp,
            [ComboLamp.ALL_PERFECT]: element.sprites.milestone.ap,
            [ComboLamp.ALL_PERFECT_PLUS]: element.sprites.milestone.app,
        } as const;
        return map[score.combo];
    }
    private getSyncLampImagePath(element: z.infer<typeof FolderModule.SCHEMA>, score: Score) {
        const map = {
            [SyncLamp.NONE]: element.sprites.milestone.none,
            [SyncLamp.SYNC_PLAY]: element.sprites.milestone.sync,
            [SyncLamp.FULL_SYNC]: element.sprites.milestone.fs,
            [SyncLamp.FULL_SYNC_PLUS]: element.sprites.milestone.fsp,
            [SyncLamp.FULL_SYNC_DX]: element.sprites.milestone.fdx,
            [SyncLamp.FULL_SYNC_DX_PLUS]: element.sprites.milestone.fdxp,
        } as const;
        return map[score.sync];
    }
    private getGridWidth(element: z.infer<typeof FolderModule.SCHEMA>) {
        return element.horizontalSize * element.jacket.size + (element.horizontalSize - 1) * element.jacket.gap;
    }
    private getFolderHeight(element: z.infer<typeof FolderModule.SCHEMA>, folder: Folder) {
        const rows = Math.max(1, Math.ceil(folder.elements.length / element.horizontalSize));
        return element.title.size + element.title.gap + rows * element.jacket.size + (rows - 1) * element.jacket.gap;
    }
    private getContentHeight(element: z.infer<typeof FolderModule.SCHEMA>, folders: Folder[]) {
        if (folders.length <= 0) return 0;
        return folders.reduce((sum, folder) => sum + this.getFolderHeight(element, folder), 0) + (folders.length - 1) * element.gap;
    }
    private async drawJacket(ctx: CanvasRenderingContext2D, element: z.infer<typeof FolderModule.SCHEMA>, chart: Chart) {
        const jacket = await (async () => {
            const { data, err } = await this.database.getJacket(chart.identifier);
            if (err === undefined) return data;
            const { data: dummy, err: dummyErr } = await this.database.getJacket("dummy");
            if (dummyErr === undefined) return dummy;
        })();
        if (jacket) {
            ctx.drawImage(await safeLoadImage(jacket), 0, 0, element.jacket.size, element.jacket.size);
        } else {
            ctx.fillStyle = "#b6ffab";
            ctx.fillRect(0, 0, element.jacket.size, element.jacket.size);
        }
    }
    /**
     * Darken the bottom of the jacket, so that a lamp stays readable on top of a bright jacket.
     */
    private drawLampScrim(ctx: CanvasRenderingContext2D, element: z.infer<typeof FolderModule.SCHEMA>) {
        const scrimHeight = element.jacket.size * 0.45;
        const scrim = ctx.createLinearGradient(0, element.jacket.size - scrimHeight, 0, element.jacket.size);
        scrim.addColorStop(0, "#00000000");
        scrim.addColorStop(1, "#000000a6");
        ctx.fillStyle = scrim;
        ctx.fillRect(0, element.jacket.size - scrimHeight, element.jacket.size, scrimHeight);
    }
    private async drawAchievementRank(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof FolderModule.SCHEMA>,
        path: string,
    ) {
        const sprite = await safeLoadImage(theme.getFile(path));
        const width = element.jacket.size * 0.72;
        const height = (width / sprite.width) * sprite.height;
        ctx.drawImage(sprite, (element.jacket.size - width) / 2, element.jacket.size - element.jacket.margin - height, width, height);
    }
    private async drawLampSprite(ctx: CanvasRenderingContext2D, theme: Theme<unknown>, element: z.infer<typeof FolderModule.SCHEMA>, path: string) {
        const sprite = await safeLoadImage(theme.getFile(path));
        const width = element.jacket.size * 0.36;
        const height = (width / sprite.width) * sprite.height;
        ctx.drawImage(sprite, (element.jacket.size - width) / 2, element.jacket.size - element.jacket.margin - height, width, height);
    }
    private drawLampText(
        ctx: CanvasRenderingContext2D,
        element: z.infer<typeof FolderModule.SCHEMA>,
        content: string,
        curColor: string,
        borderStyle?: string | CanvasGradient,
    ) {
        const margin = element.jacket.margin * 2;
        const fontSize = element.jacket.size * 0.16;
        drawText(ctx, content, element.jacket.size - margin, element.jacket.size - margin, fontSize, fontSize * 0.28, {
            maxWidth: element.jacket.size - margin * 2,
            textAlign: "right",
            mainColor: "white",
            borderColor: borderStyle ?? new Color(curColor).darken(0.3).hexa(),
            widthConstraintType: "shrink-cut",
            shrinkMinFontSize: fontSize * 0.7,
        });
    }
    private async drawLamp(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof FolderModule.SCHEMA>,
        lamp: FolderLamp,
        score: Score,
        curColor: string,
    ) {
        switch (lamp) {
            case FolderLamp.ACHIEVEMENT_RANK:
                this.drawLampScrim(ctx, element);
                return this.drawAchievementRank(ctx, theme, element, this.getAchievementRankImagePath(element, score));
            case FolderLamp.COMBO:
                this.drawLampScrim(ctx, element);
                return this.drawLampSprite(ctx, theme, element, this.getComboLampImagePath(element, score));
            case FolderLamp.SYNC:
                this.drawLampScrim(ctx, element);
                return this.drawLampSprite(ctx, theme, element, this.getSyncLampImagePath(element, score));
            case FolderLamp.ACHIEVEMENT_RATE:
                this.drawLampScrim(ctx, element);
                return this.drawLampText(ctx, element, `${truncate(score.achievement, 2)}%`, curColor);
            case FolderLamp.DX_SCORE: {
                const maxDxScore = getMaxDxScore(score.chart);
                const star = maxDxScore > 0 ? getDxStar(score.dxScore / maxDxScore) : 0;
                if (star <= 0) return;
                const margin = element.jacket.margin * 2;
                const rainbow = ctx.createLinearGradient(margin, 0, element.jacket.size - margin, 0);
                RAINBOW.forEach((v, i, arr) => {
                    rainbow.addColorStop(i / (arr.length - 1), v);
                });
                this.drawLampScrim(ctx, element);
                return this.drawLampText(ctx, element, `★${star}`, curColor, star >= 5 ? rainbow : undefined);
            }
            case FolderLamp.NONE:
                return;
        }
    }
    private async drawCell(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof FolderModule.SCHEMA>,
        painterCtx: FolderModulePainterContext,
        lamp: FolderLamp,
        chart: Chart,
    ) {
        const curColor = this.getBubbleColorByDifficulty(element, chart);
        const score = painterCtx.scores[chart.identifier]?.[chart.difficulty];
        const cellDimensions = [0, 0, element.jacket.size, element.jacket.size, element.jacket.size / 7] as const;
        return wrapBorder(
            ctx,
            new Color(curColor).darken(0.3).hexa(),
            element.jacket.margin / 3,
            () =>
                wrapBackground(
                    ctx,
                    curColor,
                    () =>
                        wrapClip(
                            ctx,
                            async () => {
                                await this.drawJacket(ctx, element, chart);
                                if (score) await this.drawLamp(ctx, theme, element, lamp, score, curColor);
                            },
                            ...cellDimensions,
                        ),
                    ...cellDimensions,
                ),
            ...cellDimensions,
        );
    }
    private async drawFolder(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof FolderModule.SCHEMA>,
        painterCtx: FolderModulePainterContext,
        folder: Folder,
    ) {
        drawText(ctx, folder.title, 16, element.title.size, element.title.size, element.title.size / 3.5, {
            maxWidth: this.getGridWidth(element),
            textAlign: "left",
            mainColor: "white",
            borderColor: element.title.borderColor,
        });
        const top = element.title.size + element.title.gap;
        for (let i = 0; i < folder.elements.length; ++i) {
            const chart = folder.elements[i];
            const x = (i % element.horizontalSize) * (element.jacket.size + element.jacket.gap);
            const y = top + Math.trunc(i / element.horizontalSize) * (element.jacket.size + element.jacket.gap);
            await wrapTranslate(ctx, x, y, () => this.drawCell(ctx, theme, element, painterCtx, folder.lamp, chart));
        }
    }
    public async getBounds(
        _ctx: CanvasRenderingContext2D,
        _theme: Theme<unknown>,
        element: z.infer<typeof FolderModule.SCHEMA>,
        painterCtx: FolderModulePainterContext,
    ): Promise<Bounds> {
        const folders = painterCtx?.folders ?? [];
        return {
            x: element.x,
            y: element.y,
            width: Math.max(element.width, element.margin * 2 + this.getGridWidth(element)),
            height: Math.max(element.height, element.margin * 2 + this.getContentHeight(element, folders)),
        };
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof FolderModule.SCHEMA>,
        painterCtx: FolderModulePainterContext,
    ): Promise<void> {
        const bounds = await this.getBounds(ctx, theme, element, painterCtx);
        const borderRadius = Math.min(bounds.width, bounds.height) * (3 / 128);
        const cardDimensions = [0, 0, bounds.width, bounds.height, borderRadius] as const;

        return wrapTranslate(ctx, element.x, element.y, async () =>
            wrapBorder(
                ctx,
                new Color(element.color.card).darken(0.5).hex(),
                borderRadius / 4,
                async () =>
                    wrapBackground(
                        ctx,
                        element.color.card,
                        async () => {
                            let y = element.margin;
                            for (const folder of painterCtx.folders) {
                                await wrapTranslate(ctx, element.margin, y, () => this.drawFolder(ctx, theme, element, painterCtx, folder));
                                y += this.getFolderHeight(element, folder) + element.gap;
                            }
                        },
                        ...cardDimensions,
                    ),
                ...cardDimensions,
            ),
        );
    }
}
