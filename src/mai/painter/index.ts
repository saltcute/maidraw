import _ from "lodash";
import sharp from "sharp";
import Color from "color";
import { z } from "zod/v4";
import { Canvas, CanvasRenderingContext2D, Image } from "canvas";

import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    IScore,
} from "../type";
import ScoreTrackerAdapter from "../lib/adapter";

import { Util } from "@maidraw/lib/util";
import { Painter, Theme, ThemeManager } from "@maidraw/lib/painter";
import { Database } from "../lib/database";
import { MaimaiUtil } from "../lib/util";

export abstract class MaimaiPainter<
    Schema extends typeof ThemeManager.BaseObject,
> extends Painter<ScoreTrackerAdapter, Schema> {
    public constructor({
        theme: { schema, searchPaths, defaultTheme },
    }: {
        theme: {
            schema: Schema;
            searchPaths: string[];
            defaultTheme: string;
        };
    }) {
        super({ theme: { schema, searchPaths, defaultTheme } });
    }
}

export namespace MaimaiPainterModule {
    export namespace Profile {
        export const schema = ThemeManager.Element.extend({
            type: z.literal("profile"),
            height: z.number().min(1),
            sprites: z.object({
                dxRating: z.object({
                    white: z.string(),
                    blue: z.string(),
                    green: z.string(),
                    yellow: z.string(),
                    red: z.string(),
                    purple: z.string(),
                    bronze: z.string(),
                    silver: z.string(),
                    gold: z.string(),
                    platinum: z.string(),
                    rainbow: z.string(),
                }),
                dxRatingNumberMap: z.string(),
                profile: z.object({
                    nameplate: z.string(),
                    icon: z.string(),
                }),
            }),
        });
        export async function draw(
            ctx: CanvasRenderingContext2D,
            theme: Theme<any>,
            element: z.infer<typeof schema>,
            username: string,
            rating: number,
            profilePicture?: Buffer
        ) {
            const nameplate = new Image();
            nameplate.src = theme.getFile(element.sprites.profile.nameplate);
            ctx.drawImage(
                nameplate,
                element.x,
                element.y,
                element.height * 6.207,
                element.height
            );

            /* Begin Profile Picture Draw */
            {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(
                    element.x + element.height * 0.064,
                    element.y + element.height * 0.064,
                    element.height * 0.872,
                    element.height * 0.872,
                    (element.height * 0.872) / 16
                );
                ctx.clip();
                ctx.fillStyle = "white";
                ctx.fill();
                const icon = new Image();
                try {
                    sharp(profilePicture);
                } catch {
                    // Unknown profile picture binary
                    profilePicture = undefined;
                }
                const pfp =
                    profilePicture ||
                    theme.getFile(element.sprites.profile.icon);
                const { dominant } = await sharp(pfp).stats();
                icon.src = await sharp(pfp).png().toBuffer();

                const cropSize = Math.min(icon.width, icon.height);
                ctx.drawImage(
                    icon,
                    (icon.width - cropSize) / 2,
                    (icon.height - cropSize) / 2,
                    cropSize,
                    cropSize,
                    element.x + element.height * 0.064,
                    element.y + element.height * 0.064,
                    element.height * 0.872,
                    element.height * 0.872
                );

                if (profilePicture) {
                    ctx.beginPath();
                    ctx.roundRect(
                        element.x + element.height * 0.064,
                        element.y + element.height * 0.064,
                        element.height * 0.872,
                        element.height * 0.872,
                        (element.height * 0.872) / 16
                    );
                    ctx.strokeStyle = Color.rgb(dominant).darken(0.3).hex();
                    ctx.lineWidth = element.height / 30;
                    ctx.stroke();
                }
                ctx.restore();
            }
            /* End Profile Picture Draw */

            /* Begin DX Rating Draw */
            {
                const dxRating = new Image();
                let dxRatingImg: Buffer;
                switch (true) {
                    case rating >= 15000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.rainbow
                        );
                        break;
                    }
                    case rating >= 14500: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.platinum
                        );
                        break;
                    }
                    case rating >= 14000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.gold
                        );
                        break;
                    }
                    case rating >= 13000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.silver
                        );
                        break;
                    }
                    case rating >= 12000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.bronze
                        );
                        break;
                    }
                    case rating >= 10000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.purple
                        );
                        break;
                    }
                    case rating >= 8000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.red
                        );
                        break;
                    }
                    case rating >= 6000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.yellow
                        );
                        break;
                    }
                    case rating >= 4000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.green
                        );
                        break;
                    }
                    case rating >= 2000: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.blue
                        );
                        break;
                    }
                    default: {
                        dxRatingImg = theme.getFile(
                            element.sprites.dxRating.white
                        );
                        break;
                    }
                }
                dxRating.src = dxRatingImg;
                ctx.drawImage(
                    dxRating,
                    element.x + element.height,
                    element.y + element.height * 0.064,
                    (element.height / 3) * 5.108,
                    element.height / 3
                );
            }
            /* End DX Rating Draw */

            /* Begin Username Draw */
            {
                ctx.beginPath();
                ctx.roundRect(
                    element.x + element.height * (1 + 1 / 32),
                    element.y + element.height * (0.064 + 0.333 + 1 / 32),
                    ((element.height / 3) * 5.108 * 6) / 5,
                    (element.height * 7) / 24,
                    element.height / 20
                );
                ctx.fillStyle = "white";
                ctx.strokeStyle = Color.rgb(180, 180, 180).hex();
                ctx.lineWidth = element.height / 32;
                ctx.stroke();
                ctx.fill();

                const ratingImgBuffer = await getRatingNumber(
                    rating,
                    theme,
                    element
                );
                if (ratingImgBuffer) {
                    const { width, height } =
                        await sharp(ratingImgBuffer).metadata();
                    if (width && height) {
                        const aspectRatio = width / height;
                        const image = new Image();
                        image.src = ratingImgBuffer;
                        const drawHeight = (element.height * 7) / 32;
                        ctx.drawImage(
                            image,
                            element.x + element.height * 1.785,
                            element.y + element.height * 0.12,
                            drawHeight * aspectRatio * 0.8,
                            drawHeight
                        );
                    }
                }

                Util.drawText(
                    ctx,
                    Util.HalfFullWidthConvert.toFullWidth(username),
                    element.x + element.height * (1 + 1 / 16),
                    element.y + element.height * (0.064 + 0.333 + 1 / 4),
                    (element.height * 1) / 6,
                    0,
                    ((element.height / 3) * 5.108 * 6) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );
            }
            /* End Username Draw*/
        }

        async function getRatingNumber(
            num: number,
            theme: Theme<any>,
            element: z.infer<typeof schema>
        ) {
            async function getRatingDigit(
                map: Buffer,
                digit: number,
                unitWidth: number,
                unitHeight: number
            ) {
                digit = Math.trunc(digit % 10);
                return await sharp(map)
                    .extract({
                        left: (digit % 4) * unitWidth,
                        top: Math.trunc(digit / 4) * unitHeight,
                        width: unitWidth,
                        height: unitHeight,
                    })
                    .toBuffer();
            }
            const map = theme.getFile(element.sprites.dxRatingNumberMap);
            const { width, height } = await sharp(map).metadata();
            if (!(width && height)) return null;
            const unitWidth = width / 4,
                unitHeight = height / 4;
            let digits: (Buffer | null)[] = [];
            while (num > 0) {
                digits.push(
                    await getRatingDigit(map, num % 10, unitWidth, unitHeight)
                );
                num = Math.trunc(num / 10);
            }
            while (digits.length < 5) digits.push(null);
            digits = digits.reverse();
            const canvas = new Canvas(unitWidth * digits.length, unitHeight);
            const ctx = canvas.getContext("2d");
            for (let i = 0; i < digits.length; ++i) {
                const curDigit = digits[i];
                if (!curDigit) continue;
                const img = new Image();
                img.src = curDigit;
                ctx.drawImage(img, unitWidth * i * 0.88, 0);
            }
            return canvas.toBuffer();
        }
    }

    export namespace Best50 {
        export namespace ScoreGrid {
            export const schema = ThemeManager.Element.extend({
                type: z.literal("score-grid"),
                horizontalSize: z.number().min(1),
                verticalSize: z.number().min(1),
                region: z.enum(["new", "old"]),
                index: z.number().min(0),
                scoreBubble: z.object({
                    width: z.number().min(1),
                    height: z.number().min(1),
                    margin: z.number().min(0),
                    gap: z.number().min(0),
                    color: z.object({
                        basic: Util.z.color(),
                        advanced: Util.z.color(),
                        expert: Util.z.color(),
                        master: Util.z.color(),
                        remaster: Util.z.color(),
                        utage: Util.z.color(),
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
                    mode: z.object({
                        standard: z.string(),
                        dx: z.string(),
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
            export async function draw(
                ctx: CanvasRenderingContext2D,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                {
                    x,
                    y,
                    index,
                    score,
                    scale,
                }: {
                    x: number;
                    y: number;
                    index: number;
                    score: IScore;
                    scale?: number;
                }
            ) {
                let curColor = "#FFFFFF";
                switch (score.chart.difficulty) {
                    case EDifficulty.BASIC:
                        curColor = element.scoreBubble.color.basic;
                        break;
                    case EDifficulty.ADVANCED:
                        curColor = element.scoreBubble.color.advanced;
                        break;
                    case EDifficulty.EXPERT:
                        curColor = element.scoreBubble.color.expert;
                        break;
                    case EDifficulty.MASTER:
                        curColor = element.scoreBubble.color.master;
                        break;
                    case EDifficulty.REMASTER:
                        curColor = element.scoreBubble.color.remaster;
                        break;
                    case EDifficulty.UTAGE:
                        curColor = element.scoreBubble.color.utage;
                        break;
                }

                /** Begin Card Draw */
                ctx.save();
                ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
                ctx.beginPath();
                ctx.roundRect(
                    x,
                    y,
                    element.scoreBubble.width,
                    element.scoreBubble.height,
                    (element.scoreBubble.height * 0.806) / 7
                );
                ctx.strokeStyle = new Color(curColor).darken(0.3).hexa();
                ctx.lineWidth = element.scoreBubble.margin / 4;
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.roundRect(
                    x,
                    y,
                    element.scoreBubble.width,
                    element.scoreBubble.height,
                    (element.scoreBubble.height * 0.806) / 7
                );
                ctx.clip();

                /** Begin Main Content Draw */
                {
                    const cardRoundCornerRadius =
                        (element.scoreBubble.height * 0.806) / 7;
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(
                        x,
                        y,
                        element.scoreBubble.width,
                        element.scoreBubble.height * 0.742,
                        cardRoundCornerRadius
                    );
                    ctx.clip();
                    ctx.fillStyle = curColor;
                    ctx.fill();

                    /** Begin score "Freshness" draw */
                    if (scale) {
                        ctx.save();
                        ctx.beginPath();

                        /**
                         * Get a color representing freshness.
                         *
                         * @param status From 0 to 1, 0 means most fresh, 1 means most dead.
                         * @returns
                         */
                        function getStatusColor(status: number) {
                            const FRESHNESS_COLOUR = "#94E436";
                            const DEAD_COLOUR = "#F54932";
                            const NEUTRAL_COLOUR = "#c2c2c2";

                            if (status < 0.5) {
                                return new Color(FRESHNESS_COLOUR).mix(
                                    new Color(NEUTRAL_COLOUR),
                                    status / 0.5
                                );
                            } else {
                                return new Color(NEUTRAL_COLOUR).mix(
                                    new Color(DEAD_COLOUR),
                                    status / 0.5 - 1
                                );
                            }
                        }
                        ctx.fillStyle = getStatusColor(scale).hexa();
                        ctx.roundRect(
                            x +
                                element.scoreBubble.width -
                                cardRoundCornerRadius,
                            y - cardRoundCornerRadius,
                            cardRoundCornerRadius * 2,
                            cardRoundCornerRadius * 2,
                            cardRoundCornerRadius / 4
                        );
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    }
                    /** End score "Freshness" draw */

                    const jacketSize = Math.min(
                        element.scoreBubble.width,
                        element.scoreBubble.height * 0.742
                    );

                    const jacketMaskGrad = ctx.createLinearGradient(
                        x + jacketSize / 2,
                        y + jacketSize / 2,
                        x + jacketSize,
                        y + jacketSize / 2
                    );
                    jacketMaskGrad.addColorStop(
                        0,
                        new Color(curColor).alpha(0).hexa()
                    );
                    jacketMaskGrad.addColorStop(
                        0.25,
                        new Color(curColor).alpha(0.2).hexa()
                    );
                    jacketMaskGrad.addColorStop(
                        1,
                        new Color(curColor).alpha(1).hexa()
                    );
                    const jacketMaskGradDark = ctx.createLinearGradient(
                        x + jacketSize / 2,
                        y + jacketSize / 2,
                        x + jacketSize,
                        y + jacketSize / 2
                    );
                    jacketMaskGradDark.addColorStop(
                        0,
                        new Color(curColor).darken(0.3).alpha(0).hexa()
                    );
                    jacketMaskGradDark.addColorStop(
                        0.25,
                        new Color(curColor).darken(0.3).alpha(0.2).hexa()
                    );
                    jacketMaskGradDark.addColorStop(
                        1,
                        new Color(curColor).darken(0.3).alpha(1).hexa()
                    );

                    /** Begin Jacket Draw*/
                    let jacket = await Database.fetchJacket(score.chart.id);
                    if (!jacket) jacket = await Database.fetchJacket(0);
                    if (jacket) {
                        const img = new Image();
                        img.src = jacket;
                        ctx.drawImage(img, x, y, jacketSize, jacketSize);
                    } else {
                        ctx.fillStyle = "#b6ffab";
                        ctx.fillRect(x, y, jacketSize, jacketSize);
                    }
                    /** End Jacket Draw*/

                    /** Begin Jacket Gradient Mask Draw*/ {
                        ctx.fillStyle = jacketMaskGrad;
                        ctx.fillRect(
                            x + jacketSize / 2,
                            y,
                            (jacketSize * 3) / 4,
                            jacketSize
                        );
                    } /** End Jacket Gradient Mask Draw*/

                    ctx.beginPath();
                    ctx.roundRect(
                        x + element.scoreBubble.margin,
                        y + element.scoreBubble.margin,
                        element.scoreBubble.width -
                            element.scoreBubble.margin * 2,
                        element.scoreBubble.height * 0.806 -
                            element.scoreBubble.margin * 2,
                        (element.scoreBubble.height * 0.806 -
                            element.scoreBubble.margin * 2) /
                            7
                    );

                    /** Begin Title Draw */ {
                        Util.drawText(
                            ctx,
                            score.chart.name,
                            x + (jacketSize * 7) / 8,
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height * 0.806 * 0.144,
                            element.scoreBubble.height * 0.806 * 0.144,
                            element.scoreBubble.height * 0.806 * 0.04,
                            element.scoreBubble.width -
                                (jacketSize * 7) / 8 -
                                element.scoreBubble.margin,
                            "left",
                            "white",
                            jacketMaskGradDark
                        );
                    } /** End Title Draw */

                    /** Begin Separation Line Draw */ {
                        ctx.beginPath();
                        ctx.roundRect(
                            x + (jacketSize * 13) / 16,
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.144 + 0.072),
                            element.scoreBubble.width -
                                (jacketSize * 13) / 16 -
                                element.scoreBubble.margin * 2,
                            element.scoreBubble.height * 0.806 * 0.02,
                            element.scoreBubble.height * 0.806 * 0.16
                        );
                        ctx.fillStyle = jacketMaskGradDark;
                        ctx.fill();
                    } /** End Separation Line Draw */

                    /** Begin Achievement Rate Draw */
                    Util.drawText(
                        ctx,
                        `${Util.truncate(score.achievement, 4)}%`,
                        x -
                            element.scoreBubble.margin -
                            element.scoreBubble.height * 0.806 * 0.02 +
                            element.scoreBubble.width,
                        y +
                            element.scoreBubble.margin +
                            element.scoreBubble.height *
                                0.806 *
                                (0.144 + 0.144 + 0.208 - 0.04),
                        element.scoreBubble.height * 0.806 * 0.208,
                        element.scoreBubble.height * 0.806 * 0.04,
                        Infinity,
                        "right",
                        "white",
                        new Color(curColor).darken(0.3).hexa()
                    );
                    /** End Achievement Rate Draw */

                    /** Begin Achievement Rank Draw */
                    {
                        let rankImg: Buffer;
                        switch (score.achievementRank) {
                            case EAchievementTypes.D:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.d
                                );
                                break;
                            case EAchievementTypes.C:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.c
                                );
                                break;
                            case EAchievementTypes.B:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.b
                                );
                                break;
                            case EAchievementTypes.BB:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.bb
                                );
                                break;
                            case EAchievementTypes.BBB:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.bbb
                                );
                                break;
                            case EAchievementTypes.A:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.a
                                );
                                break;
                            case EAchievementTypes.AA:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.aa
                                );
                                break;
                            case EAchievementTypes.AAA:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.aaa
                                );
                                break;
                            case EAchievementTypes.S:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.s
                                );
                                break;
                            case EAchievementTypes.SP:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.sp
                                );
                                break;
                            case EAchievementTypes.SS:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.ss
                                );
                                break;
                            case EAchievementTypes.SSP:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.ssp
                                );
                                break;
                            case EAchievementTypes.SSS:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.sss
                                );
                                break;
                            default:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.sssp
                                );
                        }
                        const img = new Image();
                        img.src = rankImg;
                        ctx.drawImage(
                            img,
                            x + jacketSize,
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.144 + 0.144 + 0.208 + 0.02),
                            element.scoreBubble.height * 0.806 * 0.3 * 2.133,
                            element.scoreBubble.height * 0.806 * 0.3
                        );
                    }
                    /** End Achievement Rank Draw */

                    /** Begin Milestone Draw */
                    {
                        let comboImg: Buffer, syncImg: Buffer;
                        switch (score.combo) {
                            case EComboTypes.NONE:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.none
                                );
                                break;
                            case EComboTypes.FULL_COMBO:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.fc
                                );
                                break;
                            case EComboTypes.FULL_COMBO_PLUS:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.fcp
                                );
                                break;
                            case EComboTypes.ALL_PERFECT:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.ap
                                );
                                break;
                            case EComboTypes.ALL_PERFECT_PLUS:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.app
                                );
                                break;
                        }
                        switch (score.sync) {
                            case ESyncTypes.NONE:
                                syncImg = theme.getFile(
                                    element.sprites.milestone.none
                                );
                                break;
                            case ESyncTypes.SYNC_PLAY:
                                syncImg = theme.getFile(
                                    element.sprites.milestone.sync
                                );
                                break;
                            case ESyncTypes.FULL_SYNC:
                                syncImg = theme.getFile(
                                    element.sprites.milestone.fs
                                );
                                break;
                            case ESyncTypes.FULL_SYNC_PLUS:
                                syncImg = theme.getFile(
                                    element.sprites.milestone.fsp
                                );
                                break;
                            case ESyncTypes.FULL_SYNC_DX:
                                syncImg = theme.getFile(
                                    element.sprites.milestone.fdx
                                );
                                break;
                            case ESyncTypes.FULL_SYNC_DX_PLUS:
                                syncImg = theme.getFile(
                                    element.sprites.milestone.fdxp
                                );
                                break;
                        }
                        const combo = new Image();
                        combo.src = comboImg;
                        ctx.drawImage(
                            combo,
                            x +
                                (jacketSize * 7) / 8 +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.32 * 2.133 + 0.06),
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.144 + 0.144 + 0.208 + 0.01),
                            element.scoreBubble.height * 0.806 * 0.32,
                            element.scoreBubble.height * 0.806 * 0.32
                        );
                        const sync = new Image();
                        sync.src = syncImg;
                        ctx.drawImage(
                            sync,
                            x +
                                (jacketSize * 7) / 8 +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.32 * 2.133 + 0.04 + 0.32),
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.144 + 0.144 + 0.208 + 0.01),
                            element.scoreBubble.height * 0.806 * 0.32,
                            element.scoreBubble.height * 0.806 * 0.32
                        );
                    }
                    /** End Milestone Draw */

                    /** Begin Chart Mode Draw */
                    {
                        const mode = new Image();
                        const chartModeBadgeImg = theme.getFile(
                            score.chart.id > 10000
                                ? element.sprites.mode.dx
                                : element.sprites.mode.standard
                        );
                        const { width, height } =
                            await sharp(chartModeBadgeImg).metadata();
                        const aspectRatio = (width ?? 0) / (height ?? 1) || 3;
                        mode.src = chartModeBadgeImg;
                        const drawHeight = (jacketSize * 6) / 8;
                        ctx.drawImage(
                            mode,
                            x + ((jacketSize * 7) / 8 - drawHeight) / 2,
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height * 0.806 * 0.02,
                            drawHeight,
                            drawHeight / aspectRatio
                        );
                    }
                    /** End Chart Mode Draw */

                    /** Begin Bests Index Draw */
                    {
                        Util.drawText(
                            ctx,
                            `#${index + 1}`,
                            x + element.scoreBubble.margin * 2,
                            y + jacketSize - element.scoreBubble.margin * 2,
                            element.scoreBubble.height * 0.806 * 0.128,
                            element.scoreBubble.height * 0.806 * 0.04,
                            Infinity,
                            "left",
                            "white",
                            new Color(curColor).darken(0.3).hexa()
                        );
                    }
                    /** End Bests Index Draw */

                    ctx.restore();
                }
                /** End Main Content Draw */

                /** Begin Difficulty & DX Rating Draw */
                {
                    Util.drawText(
                        ctx,
                        `${Util.truncate(score.chart.level, 1)}  ↑${Util.truncate(score.dxRating, 0)}`,
                        x + element.scoreBubble.margin * 2,
                        y +
                            element.scoreBubble.height *
                                (0.806 + (1 - 0.806) / 2),
                        element.scoreBubble.height * 0.806 * 0.128,
                        element.scoreBubble.height * 0.806 * 0.04,
                        Infinity,
                        "left",
                        "white",
                        new Color(curColor).darken(0.3).hexa()
                    );

                    if (score.dxScore >= 0 && score.chart.maxDxScore > 0) {
                        Util.drawText(
                            ctx,
                            `${score.dxScore}/${score.chart.maxDxScore}`,
                            x +
                                element.scoreBubble.width -
                                element.scoreBubble.margin * 2,
                            y +
                                element.scoreBubble.height *
                                    (0.806 + (1 - 0.806) / 2),
                            element.scoreBubble.height * 0.806 * 0.128,
                            element.scoreBubble.height * 0.806 * 0.04,
                            Infinity,
                            "right",
                            "white",
                            new Color(curColor).darken(0.3).hexa()
                        );
                    }
                }
                /** End Difficulty & DX Rating Draw */

                ctx.restore();
                /** End Card Draw */
            }
        }
    }

    export namespace Chart {
        const DX_LATEST = 55;
        const EX_LATEST = 50;
        const CN_LATEST = 50;
        const MAIMAI_VERSIONS = [
            99, 95, 90, 85, 80, 70, 60, 50, 40, 30, 20, 10, 0,
        ] as const;
        const MAIMAIDX_VERSIONS = [
            55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0,
        ] as const;
        const WUMENGDX_VERSIONS = [50, 40, 30, 20, 10, 0] as const;
        function findVersion(v: number, isDX: boolean, isCN: boolean) {
            const target = isDX
                ? isCN
                    ? WUMENGDX_VERSIONS
                    : MAIMAIDX_VERSIONS
                : MAIMAI_VERSIONS;
            for (const version of target) {
                if (v >= version) return version;
            }
            return null;
        }

        export namespace ChartGrid {
            export const schema = ThemeManager.Element.extend({
                type: z.literal("chart-grid"),
                width: z.number().min(1),
                height: z.number().min(1),
                margin: z.number().min(0),
                gap: z.number().min(0),
                bubble: z.object({
                    margin: z.number().min(0),
                    color: z.object({
                        basic: Util.z.color(),
                        advanced: Util.z.color(),
                        expert: Util.z.color(),
                        master: Util.z.color(),
                        remaster: Util.z.color(),
                        utage: Util.z.color(),
                    }),
                }),
                color: z.object({
                    card: Util.z.color(),
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
                    versions: z.object({
                        OLD: z.object({
                            "0": z.string(),
                            "10": z.string(),
                            "20": z.string(),
                            "30": z.string(),
                            "40": z.string(),
                            "50": z.string(),
                            "60": z.string(),
                            "70": z.string(),
                            "80": z.string(),
                            "85": z.string(),
                            "90": z.string(),
                            "95": z.string(),
                            "99": z.string(),
                        }),
                        DX: z.object({
                            "0": z.string(),
                            "5": z.string(),
                            "10": z.string(),
                            "15": z.string(),
                            "20": z.string(),
                            "25": z.string(),
                            "30": z.string(),
                            "35": z.string(),
                            "40": z.string(),
                            "45": z.string(),
                            "50": z.string(),
                            "55": z.string(),
                        }),
                        EX: z.object({
                            "10": z.string(),
                            "15": z.string(),
                        }),
                        CN: z.object({
                            "0": z.string(),
                            "10": z.string(),
                            "20": z.string(),
                            "30": z.string(),
                            "40": z.string(),
                            "50": z.string(),
                        }),
                    }),
                }),
            });

            export async function draw(
                ctx: CanvasRenderingContext2D,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                chartId: number,
                scores: (IScore | null)[],
                region: "DX" | "EX" | "CN" = "DX"
            ) {
                /* Begin Background Draw */
                ctx.roundRect(
                    element.x,
                    element.y,
                    element.width,
                    element.height,
                    Math.min(theme.content.width, theme.content.height) *
                        (3 / 128)
                );
                ctx.fillStyle = element.color.card;
                ctx.strokeStyle = new Color(element.color.card)
                    .darken(0.6)
                    .hex();
                ctx.lineWidth =
                    Math.min(theme.content.width, theme.content.height) *
                    (3 / 512);
                ctx.stroke();
                ctx.fill();
                /* End Background Draw */

                const difficulties = [];
                for (
                    let i = EDifficulty.BASIC;
                    i <= EDifficulty.REMASTER;
                    ++i
                ) {
                    const chart = Database.getLocalChart(chartId, i);
                    if (chart) difficulties.push(chart);
                }

                const cardWidth = element.width - element.margin * 2;
                const cardHeight =
                    (element.height - element.margin * 2 - element.gap * 3) / 4;
                for (
                    let y = element.y + element.margin, i = 0;
                    i < difficulties.length;
                    ++i, y += cardHeight + element.gap
                ) {
                    const chart = difficulties[i];
                    if (chart)
                        if (difficulties.length > 4 && i == 0) {
                            await drawChartGridCard(
                                ctx,
                                theme,
                                element,
                                chart,
                                i,
                                element.x + element.margin,
                                y,
                                (cardWidth - element.margin) / 2,
                                cardHeight,
                                true,
                                region,
                                scores[i]
                            );
                            i++;
                            const chartA = difficulties[i];
                            if (chartA)
                                await drawChartGridCard(
                                    ctx,
                                    theme,
                                    element,
                                    chartA,
                                    i,
                                    element.x +
                                        element.margin +
                                        (cardWidth + element.margin) / 2,
                                    y,
                                    (cardWidth - element.margin) / 2,
                                    cardHeight,
                                    true,
                                    region,
                                    scores[i]
                                );
                        } else {
                            await drawChartGridCard(
                                ctx,
                                theme,
                                element,
                                chart,
                                i,
                                element.x + element.margin,
                                y,
                                cardWidth,
                                cardHeight,
                                false,
                                region,
                                scores[i]
                            );
                        }
                }
            }

            async function drawChartGridCard(
                ctx: CanvasRenderingContext2D,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                chart: Database.IChart,
                difficulty: EDifficulty,
                x: number,
                y: number,
                width: number,
                height: number,
                isShort: boolean,
                targetRegion: "DX" | "EX" | "CN" = "DX",
                score?: IScore | null
            ) {
                let curColor = "#FFFFFF";
                switch (difficulty) {
                    case EDifficulty.BASIC:
                        curColor = element.bubble.color.basic;
                        break;
                    case EDifficulty.ADVANCED:
                        curColor = element.bubble.color.advanced;
                        break;
                    case EDifficulty.EXPERT:
                        curColor = element.bubble.color.expert;
                        break;
                    case EDifficulty.MASTER:
                        curColor = element.bubble.color.master;
                        break;
                    case EDifficulty.REMASTER:
                        curColor = element.bubble.color.remaster;
                        break;
                    case EDifficulty.UTAGE:
                        curColor = element.bubble.color.utage;
                        break;
                }

                /** Begin Card Draw */
                ctx.save();
                ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, (height * 0.806) / 7);
                ctx.strokeStyle = new Color(curColor).darken(0.3).hexa();
                ctx.lineWidth = element.bubble.margin / 4;
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, (height * 0.806) / 7);
                ctx.clip();

                /** Begin Main Content Draw */
                {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, width, height);
                    ctx.clip();
                    ctx.fillStyle = curColor;
                    ctx.fill();

                    const titleSize = height * (47 / 256);
                    /** Begin Difficulty Text & Separation Line Draw */
                    {
                        let difficultiy = "";
                        switch (chart.difficulty) {
                            case EDifficulty.BASIC:
                                difficultiy = "BASIC";
                                break;
                            case EDifficulty.ADVANCED:
                                difficultiy = "ADVANCED";
                                break;
                            case EDifficulty.EXPERT:
                                difficultiy = "EXPERT";
                                break;
                            case EDifficulty.MASTER:
                                difficultiy = "MASTER";
                                break;
                            case EDifficulty.REMASTER:
                                difficultiy = "Re:MASTER";
                                break;
                            case EDifficulty.UTAGE:
                                difficultiy = "U·TA·GE";
                                break;
                        }
                        const levelTextSize = titleSize * (5 / 8);
                        Util.drawText(
                            ctx,
                            difficultiy,
                            x + element.bubble.margin,
                            y +
                                element.bubble.margin +
                                titleSize -
                                element.bubble.margin * (1 / 4),
                            titleSize,
                            height * 0.806 * 0.04,
                            Infinity,
                            "left",
                            "white",
                            new Color(curColor).darken(0.3).hexa()
                        );
                        const difficultyTextWidth = Util.measureText(
                            ctx,
                            difficultiy,
                            titleSize,
                            Infinity
                        ).width;
                        Util.drawText(
                            ctx,
                            `Lv. ${Util.truncate(chart.level, 1)}${score ? `　↑${Util.truncate(score.dxRating, 0)}` : ""}`,
                            x + element.bubble.margin * 2 + difficultyTextWidth,
                            y +
                                element.bubble.margin +
                                titleSize -
                                element.bubble.margin * (1 / 4),
                            levelTextSize,
                            height * 0.806 * 0.04,
                            Infinity,
                            "left",
                            "white",
                            new Color(curColor).darken(0.3).hexa()
                        );

                        ctx.beginPath();
                        ctx.roundRect(
                            x + element.bubble.margin,
                            y +
                                element.bubble.margin +
                                titleSize +
                                element.bubble.margin * (1 / 4),
                            height * 2 - element.bubble.margin * 2,
                            height * 0.806 * 0.02,
                            height * 0.806 * 0.16
                        );
                        ctx.fillStyle = new Color(curColor).darken(0.3).hex();
                        ctx.fill();
                    }
                    /** End Difficulty Text & Separation Line Draw */

                    /** Begin Achievement Rate Draw */
                    {
                        const scoreSize = height * 0.806 * 0.208;
                        Util.drawText(
                            ctx,
                            score
                                ? `${Util.truncate(score.achievement, 4)}%`
                                : "NO RECORD",
                            x +
                                height * 2 -
                                element.bubble.margin -
                                height * 0.806 * 0.02,
                            y +
                                element.bubble.margin +
                                titleSize +
                                element.bubble.margin * (5 / 8) +
                                scoreSize,
                            scoreSize,
                            height * 0.806 * 0.04,
                            Infinity,
                            "right",
                            "white",
                            new Color(curColor).darken(0.3).hexa()
                        );
                    }
                    /** End Achievement Rate Draw */

                    /** Begin Achievement Rank Draw */
                    {
                        if (score) {
                            let rankImg: Buffer;
                            switch (score.achievementRank) {
                                case EAchievementTypes.D:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.d
                                    );
                                    break;
                                case EAchievementTypes.C:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.c
                                    );
                                    break;
                                case EAchievementTypes.B:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.b
                                    );
                                    break;
                                case EAchievementTypes.BB:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.bb
                                    );
                                    break;
                                case EAchievementTypes.BBB:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.bbb
                                    );
                                    break;
                                case EAchievementTypes.A:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.a
                                    );
                                    break;
                                case EAchievementTypes.AA:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.aa
                                    );
                                    break;
                                case EAchievementTypes.AAA:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.aaa
                                    );
                                    break;
                                case EAchievementTypes.S:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.s
                                    );
                                    break;
                                case EAchievementTypes.SP:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.sp
                                    );
                                    break;
                                case EAchievementTypes.SS:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.ss
                                    );
                                    break;
                                case EAchievementTypes.SSP:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.ssp
                                    );
                                    break;
                                case EAchievementTypes.SSS:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.sss
                                    );
                                    break;
                                default:
                                    rankImg = theme.getFile(
                                        element.sprites.achievement.sssp
                                    );
                            }
                            const img = new Image();
                            img.src = rankImg;
                            ctx.drawImage(
                                img,
                                x + element.bubble.margin * (1 / 4),
                                y +
                                    element.bubble.margin +
                                    titleSize +
                                    element.bubble.margin * (1 / 2),
                                height * 0.806 * 0.3 * 2.133,
                                height * 0.806 * 0.3
                            );
                        }
                    }
                    /** End Achievement Rank Draw */

                    /** Begin Milestone Draw */
                    {
                        if (score) {
                            let comboImg: Buffer, syncImg: Buffer;
                            switch (score.combo) {
                                case EComboTypes.NONE:
                                    comboImg = theme.getFile(
                                        element.sprites.milestone.none
                                    );
                                    break;
                                case EComboTypes.FULL_COMBO:
                                    comboImg = theme.getFile(
                                        element.sprites.milestone.fc
                                    );
                                    break;
                                case EComboTypes.FULL_COMBO_PLUS:
                                    comboImg = theme.getFile(
                                        element.sprites.milestone.fcp
                                    );
                                    break;
                                case EComboTypes.ALL_PERFECT:
                                    comboImg = theme.getFile(
                                        element.sprites.milestone.ap
                                    );
                                    break;
                                case EComboTypes.ALL_PERFECT_PLUS:
                                    comboImg = theme.getFile(
                                        element.sprites.milestone.app
                                    );
                                    break;
                            }
                            switch (score.sync) {
                                case ESyncTypes.NONE:
                                    syncImg = theme.getFile(
                                        element.sprites.milestone.none
                                    );
                                    break;
                                case ESyncTypes.SYNC_PLAY:
                                    syncImg = theme.getFile(
                                        element.sprites.milestone.sync
                                    );
                                    break;
                                case ESyncTypes.FULL_SYNC:
                                    syncImg = theme.getFile(
                                        element.sprites.milestone.fs
                                    );
                                    break;
                                case ESyncTypes.FULL_SYNC_PLUS:
                                    syncImg = theme.getFile(
                                        element.sprites.milestone.fsp
                                    );
                                    break;
                                case ESyncTypes.FULL_SYNC_DX:
                                    syncImg = theme.getFile(
                                        element.sprites.milestone.fdx
                                    );
                                    break;
                                case ESyncTypes.FULL_SYNC_DX_PLUS:
                                    syncImg = theme.getFile(
                                        element.sprites.milestone.fdxp
                                    );
                                    break;
                            }
                            const combo = new Image();
                            combo.src = comboImg;
                            ctx.drawImage(
                                combo,
                                x +
                                    height *
                                        0.806 *
                                        (0.32 * 2.133 + 0.06 - 0.1),
                                y +
                                    element.bubble.margin +
                                    titleSize +
                                    element.bubble.margin * (1 / 2),
                                height * 0.806 * 0.32,
                                height * 0.806 * 0.32
                            );
                            const sync = new Image();
                            sync.src = syncImg;
                            ctx.drawImage(
                                sync,
                                x +
                                    height *
                                        0.806 *
                                        (0.32 * 2.133 + 0.04 + 0.32 - 0.1),
                                y +
                                    element.bubble.margin +
                                    titleSize +
                                    element.bubble.margin * (1 / 2),
                                height * 0.806 * 0.32,
                                height * 0.806 * 0.32
                            );
                        }
                    }
                    /** End Milestone Draw */

                    /** Begin Version Draw */
                    {
                        let versions: {
                            region: "OLD" | "DX" | "EX" | "CN";
                            version?: Database.IVersion;
                            EXAppend: boolean;
                        }[] = [];
                        for (let i = 0; i < 3; ++i) {
                            versions[i] = {
                                region: "DX",
                                version: undefined,
                                EXAppend: false,
                            };
                        }
                        const VER_DX =
                            chart.difficulty == EDifficulty.REMASTER
                                ? chart.events.find(
                                      (v) =>
                                          v.type == "existence" &&
                                          v.version.region == "DX"
                                  )?.version
                                : chart.addVersion.DX;
                        const VER_EX =
                            chart.difficulty == EDifficulty.REMASTER
                                ? chart.events.find(
                                      (v) =>
                                          v.type == "existence" &&
                                          v.version.region == "EX"
                                  )?.version
                                : chart.addVersion.EX;
                        const VER_CN =
                            chart.difficulty == EDifficulty.REMASTER
                                ? chart.events.find(
                                      (v) =>
                                          v.type == "existence" &&
                                          v.version.region == "CN"
                                  )?.version
                                : chart.addVersion.CN;
                        if (VER_DX) {
                            const version = versions[0];
                            version.version = VER_DX;
                            version.region = "DX";
                        }
                        if (VER_EX) {
                            for (let i = 0; i < 3; ++i) {
                                const version = versions[i];
                                if (version.version) {
                                    if (
                                        !(
                                            version.version.gameVersion.isDX &&
                                            version.version.gameVersion.minor >=
                                                10 &&
                                            version.version.gameVersion.minor <
                                                20
                                        ) &&
                                        _.isEqual(
                                            versions[i].version?.gameVersion,
                                            VER_EX.gameVersion
                                        )
                                    ) {
                                        versions[i].EXAppend = true;
                                        break;
                                    }
                                } else {
                                    version.version = VER_EX;
                                    version.region = "EX";
                                    break;
                                }
                            }
                        }
                        if (VER_CN) {
                            for (let i = 0; i < 3; ++i) {
                                const version = versions[i];
                                if (version.version) {
                                    if (
                                        !version.version.gameVersion.isDX &&
                                        _.isEqual(
                                            versions[i].version?.gameVersion,
                                            VER_CN.gameVersion
                                        )
                                    ) {
                                        break;
                                    }
                                } else {
                                    version.version = VER_CN;
                                    version.region = "CN";
                                    break;
                                }
                            }
                        }
                        let counter = 0;
                        for (const version of versions) {
                            if (version.version) {
                                counter++;
                                if (!version.version.gameVersion.isDX)
                                    version.region = "OLD";
                            }
                        }
                        const versionImageHeight =
                            (height - element.bubble.margin * 2) *
                            (isShort ? 1 / 3 : 3 / 8);
                        const versionImageWidth =
                            (versionImageHeight / 160) * 332;
                        const regionTextSize = versionImageHeight * (5 / 8);
                        for (
                            let i = 0,
                                curx = x + width - element.bubble.margin,
                                cury = y + element.bubble.margin;
                            i < versions.length;
                            ++i,
                                cury =
                                    isShort ||
                                    curx - versionImageWidth - regionTextSize <
                                        x + height * 2
                                        ? cury + versionImageHeight
                                        : cury,
                                curx =
                                    isShort ||
                                    curx - versionImageWidth - regionTextSize <
                                        x + height * 2
                                        ? x + width - element.bubble.margin
                                        : curx
                        ) {
                            const version = versions[i];
                            if (version.version) {
                                let region = version.region;
                                if (
                                    version.region == "EX" &&
                                    !(
                                        version.version.gameVersion.minor >=
                                            10 &&
                                        version.version.gameVersion.minor < 20
                                    )
                                ) {
                                    region = "DX";
                                }
                                const rawVersion = findVersion(
                                    version.version.gameVersion.minor,
                                    version.version.gameVersion.isDX,
                                    region == "CN"
                                );
                                if (rawVersion) {
                                    const versionImage = theme.getFile(
                                        element.sprites.versions[region][
                                            rawVersion as unknown as keyof z.infer<
                                                typeof schema
                                            >["sprites"]["versions"][typeof version.region]
                                        ]
                                    );
                                    try {
                                        sharp(versionImage);
                                        if (versionImage) {
                                            const versionImg = new Image();
                                            versionImg.src = versionImage;
                                            let text;
                                            switch (version.region) {
                                                case "DX":
                                                    if (version.EXAppend)
                                                        text = "🇯🇵🌏";
                                                    else text = "🇯🇵";
                                                    break;
                                                case "EX":
                                                    text = "🌏";
                                                    break;
                                                case "CN":
                                                    text = "🇨🇳";
                                                    break;
                                                default:
                                                    text = "";
                                            }
                                            ctx.drawImage(
                                                versionImg,
                                                (curx -= versionImageWidth),
                                                cury,
                                                versionImageWidth,
                                                versionImageHeight
                                            );
                                            if (version.region != "OLD") {
                                                await Util.drawEmojiOrGlyph(
                                                    ctx,
                                                    text,
                                                    curx,
                                                    cury +
                                                        regionTextSize +
                                                        (versionImageHeight -
                                                            regionTextSize) /
                                                            2,
                                                    regionTextSize,
                                                    Infinity,
                                                    "right"
                                                );
                                                curx -=
                                                    Util.visibleLength(text) *
                                                        regionTextSize +
                                                    element.bubble.margin;
                                            }
                                        }
                                    } catch {}
                                }
                            }
                        }
                        /** End Version Draw */

                        /** Begin Note Count Draw */
                        const noteCountTexts = Object.entries(
                            chart.meta.notes
                        ).map(([k, v]) => `${Util.capitalize(k)}: ${v}`);
                        const noteCountTextSize =
                            (height - element.bubble.margin * 4) /
                            noteCountTexts.length;
                        let noteCountLength = 0;
                        noteCountTexts.forEach((v, i) => {
                            Util.drawText(
                                ctx,
                                v,
                                x +
                                    element.bubble.margin * (3 / 2) +
                                    height * 2,
                                y +
                                    element.bubble.margin +
                                    noteCountTextSize +
                                    (noteCountTextSize +
                                        element.bubble.margin / 2) *
                                        i,
                                noteCountTextSize,
                                height * 0.806 * 0.04,
                                Infinity,
                                "left",
                                "white",
                                new Color(curColor).darken(0.3).hexa()
                            );
                            const length = Util.measureText(
                                ctx,
                                v,
                                noteCountTextSize,
                                Infinity
                            ).width;
                            if (length > noteCountLength)
                                noteCountLength = length;
                        });
                        /** End Note Count Draw */

                        /** Begin Internal Level Trend Draw */
                        if (!isShort) {
                            const CURRENT_MINOR = (() => {
                                switch (targetRegion) {
                                    case "EX":
                                        return EX_LATEST;
                                    case "CN":
                                        return CN_LATEST;
                                    case "DX":
                                    default:
                                        return DX_LATEST;
                                }
                            })();
                            const maxWidth =
                                width -
                                height * 2 -
                                element.bubble.margin * 4 -
                                noteCountLength;
                            const maxFitTrendCount = Math.trunc(
                                maxWidth / versionImageWidth
                            );
                            const trendEvents = chart.events.filter(
                                (v) =>
                                    v.type == "existence" &&
                                    v.version.region == targetRegion
                            ) as Database.Events.Existence[];
                            let actualEvents: Database.Events[] = _.uniqWith(
                                trendEvents,
                                (a, b) => {
                                    return _.isEqual(
                                        a.data.level,
                                        b.data.level
                                    );
                                }
                            );
                            if (actualEvents.length == maxFitTrendCount) {
                            } else if (actualEvents.length > maxFitTrendCount) {
                                while (actualEvents.length > maxFitTrendCount)
                                    actualEvents.shift();
                                actualEvents.shift();
                                actualEvents.shift();
                                actualEvents.unshift(trendEvents[0]);
                                actualEvents.push(
                                    trendEvents[trendEvents.length - 1]
                                );
                            } else if (trendEvents.length > maxFitTrendCount) {
                                actualEvents = _.filter(
                                    actualEvents,
                                    (v) =>
                                        !(
                                            _.isEqual(
                                                v.version.gameVersion,
                                                trendEvents[0].version
                                                    .gameVersion
                                            ) ||
                                            _.isEqual(
                                                v.version.gameVersion,
                                                trendEvents[
                                                    trendEvents.length - 1
                                                ].version.gameVersion
                                            )
                                        )
                                );
                                for (
                                    let i = trendEvents.length - 2;
                                    i > 0 &&
                                    actualEvents.length < maxFitTrendCount - 2;
                                    --i
                                ) {
                                    const event = trendEvents[i];
                                    if (event) actualEvents.push(event);
                                    actualEvents = _.uniqWith(
                                        actualEvents,
                                        (a, b) => {
                                            return (
                                                _.isEqual(
                                                    a.version.gameVersion.major,
                                                    b.version.gameVersion.major
                                                ) &&
                                                _.isEqual(
                                                    a.version.gameVersion.minor,
                                                    b.version.gameVersion.minor
                                                )
                                            );
                                        }
                                    );
                                }
                                actualEvents.unshift(trendEvents[0]);
                                actualEvents.push(
                                    trendEvents[trendEvents.length - 1]
                                );
                                actualEvents = _.uniqWith(
                                    actualEvents,
                                    (a, b) => {
                                        return (
                                            _.isEqual(
                                                a.version.gameVersion.major,
                                                b.version.gameVersion.major
                                            ) &&
                                            _.isEqual(
                                                a.version.gameVersion.minor,
                                                b.version.gameVersion.minor
                                            )
                                        );
                                    }
                                );
                                actualEvents = _.sortBy(
                                    actualEvents,
                                    (v) => v.version.gameVersion.minor
                                );
                                if (trendEvents.length > 1) {
                                    if (actualEvents.length >= maxFitTrendCount)
                                        actualEvents.pop();
                                    actualEvents.push(
                                        trendEvents[trendEvents.length - 1]
                                    );
                                }
                                const removalEvent = chart.events.find(
                                    (v) =>
                                        v.type == "removal" &&
                                        v.version.region == targetRegion
                                ) as Database.Events.Removal | undefined;
                                if (removalEvent) {
                                    actualEvents.pop();
                                    actualEvents.push(removalEvent);
                                }
                            } else {
                                actualEvents = [...trendEvents];
                            }
                            if (
                                actualEvents[actualEvents.length - 1]?.version
                                    .gameVersion.minor < CURRENT_MINOR
                            ) {
                                while (actualEvents.length >= maxFitTrendCount)
                                    actualEvents.pop();
                                actualEvents.push({
                                    type: "removal",
                                    version: MaimaiUtil.Version.toEventVersion(
                                        MaimaiUtil.Version.getNextVersion(
                                            trendEvents[trendEvents.length - 1]
                                                .version
                                        )
                                    ),
                                });
                            }
                            actualEvents = _.uniqWith(actualEvents, (a, b) => {
                                return (
                                    _.isEqual(
                                        a.version.gameVersion.major,
                                        b.version.gameVersion.major
                                    ) &&
                                    _.isEqual(
                                        a.version.gameVersion.minor,
                                        b.version.gameVersion.minor
                                    ) &&
                                    _.isEqual(a.type, b.type)
                                );
                            });
                            let positionAdjustment = 0;
                            let addGap =
                                (maxWidth -
                                    actualEvents.length * versionImageWidth) /
                                (actualEvents.length - 1);
                            if (addGap > maxWidth / 5) {
                                addGap = maxWidth / 5;
                                positionAdjustment =
                                    (maxWidth -
                                        (addGap * (actualEvents.length - 1) +
                                            versionImageWidth *
                                                actualEvents.length)) /
                                    2;
                            }
                            for (
                                let i = 0,
                                    curx =
                                        x +
                                        positionAdjustment +
                                        height * 2 +
                                        element.bubble.margin * (5 / 2) +
                                        noteCountLength,
                                    cury =
                                        y +
                                        element.bubble.margin * (3 / 2) +
                                        versionImageHeight;
                                i < actualEvents.length;
                                ++i
                            ) {
                                const event = actualEvents[i];
                                if (!event) continue;
                                let logoRegion: "OLD" | "DX" | "EX" | "CN" =
                                    event.version.gameVersion.isDX
                                        ? targetRegion
                                        : "OLD";
                                if (logoRegion == "EX") {
                                    if (
                                        !(
                                            10 <=
                                                event.version.gameVersion
                                                    .minor &&
                                            event.version.gameVersion.minor < 20
                                        )
                                    ) {
                                        logoRegion = "DX";
                                    }
                                }
                                const rawVersion = findVersion(
                                    event.version.gameVersion.minor,
                                    event.version.gameVersion.isDX,
                                    logoRegion == "CN"
                                );
                                if (rawVersion) {
                                    const versionImage = theme.getFile(
                                        element.sprites.versions[logoRegion][
                                            rawVersion as unknown as keyof z.infer<
                                                typeof schema
                                            >["sprites"]["versions"][typeof logoRegion]
                                        ]
                                    );
                                    try {
                                        sharp(versionImage);
                                        if (versionImage) {
                                            const versionImg = new Image();
                                            versionImg.src = versionImage;
                                            ctx.drawImage(
                                                versionImg,
                                                curx,
                                                cury,
                                                versionImageWidth,
                                                versionImageHeight
                                            );
                                            if (event.type == "existence") {
                                                let symbol = "";
                                                if (i != 0) {
                                                    const lastEvent =
                                                        actualEvents[i - 1];
                                                    if (
                                                        lastEvent.type ==
                                                        "existence"
                                                    ) {
                                                        if (
                                                            lastEvent.data
                                                                .level <
                                                            event.data.level
                                                        )
                                                            symbol = "↑";
                                                        else if (
                                                            lastEvent.data
                                                                .level >
                                                            event.data.level
                                                        )
                                                            symbol = "↓";
                                                        else if (
                                                            lastEvent.data
                                                                .level ==
                                                            event.data.level
                                                        )
                                                            symbol = "→";
                                                    }
                                                }
                                                Util.drawText(
                                                    ctx,
                                                    `${symbol}${Util.truncate(event.data.level, 1)}`,
                                                    curx +
                                                        versionImageWidth / 2,
                                                    cury +
                                                        versionImageHeight +
                                                        noteCountTextSize,
                                                    noteCountTextSize,
                                                    height * 0.806 * 0.04,
                                                    Infinity,
                                                    "center",
                                                    "white",
                                                    new Color(curColor)
                                                        .darken(0.3)
                                                        .hexa()
                                                );
                                            } else if (
                                                event.type == "removal"
                                            ) {
                                                Util.drawText(
                                                    ctx,
                                                    `❌`,
                                                    curx +
                                                        versionImageWidth / 2,
                                                    cury +
                                                        versionImageHeight +
                                                        noteCountTextSize,
                                                    noteCountTextSize,
                                                    height * 0.806 * 0.04,
                                                    Infinity,
                                                    "center",
                                                    "white",
                                                    new Color(curColor)
                                                        .darken(0.3)
                                                        .hexa()
                                                );
                                            }
                                            curx += versionImageWidth + addGap;
                                        }
                                    } catch {}
                                }
                            }
                        }
                    }
                    /** End Internal Level Trend Draw */

                    ctx.restore();
                }
                /** End Main Content Draw */

                ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
                ctx.beginPath();
                ctx.roundRect(
                    x,
                    y + height * 0.742,
                    height * 2,
                    height * (1 - 0.742),
                    [0, (height * 0.806) / 7, 0, (height * 0.806) / 7]
                );
                ctx.fill();
                /** Begin Difficulty & DX Rating Draw */
                {
                    ctx.save();
                    ctx.clip();
                    Util.drawText(
                        ctx,
                        chart.designer.name || "-",
                        x + element.bubble.margin,
                        y + height * (0.806 + (1 - 0.806) / 2),
                        height * 0.806 * 0.128,
                        height * 0.806 * 0.04,
                        Infinity,
                        "left",
                        "white",
                        new Color(curColor).darken(0.3).hexa()
                    );
                    ctx.restore();

                    Util.drawText(
                        ctx,
                        `${score ? `${score.dxScore}/` : "MAX DX SCR: "}${chart.meta.maxDXScore}`,
                        x + height * 2 - element.bubble.margin,
                        y + height - element.bubble.margin * 3.1,
                        height * 0.806 * 0.128,
                        height * 0.806 * 0.04,
                        Infinity,
                        "right",
                        "white",
                        new Color(curColor).darken(0.3).hexa()
                    );
                }
                /** End Difficulty & DX Rating Draw */

                ctx.restore();
                /** End Card Draw */
            }
        }

        export namespace DetailInfo {
            export const schema = ThemeManager.Element.extend({
                type: z.literal("detail-info"),
                width: z.number().min(1),
                height: z.number().min(1),
                margin: z.number().min(0),
                color: z.object({
                    card: Util.z.color(),
                }),
                sprites: z.object({
                    mode: z.object({
                        standard: z.string(),
                        dx: z.string(),
                    }),
                }),
            });

            export async function draw(
                ctx: CanvasRenderingContext2D,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                chartId: number
            ) {
                const jacketMargin = element.margin;
                const textMargin = element.margin;

                const chart = Database.getLocalChart(
                    chartId,
                    EDifficulty.BASIC
                );
                const jacket = await Database.fetchJacket(chartId);
                /* Begin Background Draw */
                ctx.beginPath();
                ctx.roundRect(
                    element.x,
                    element.y,
                    element.width,
                    element.height,
                    Math.min(theme.content.width, theme.content.height) *
                        (3 / 128)
                );
                ctx.fillStyle = element.color.card;
                ctx.strokeStyle = new Color(element.color.card)
                    .darken(0.6)
                    .hex();
                ctx.lineWidth =
                    Math.min(theme.content.width, theme.content.height) *
                    (3 / 512);
                ctx.stroke();
                ctx.fill();
                /* End Background Draw */

                /* Begin jacket draw */
                if (jacket) {
                    const jacketImage = new Image();
                    const roundRadius =
                        Math.min(theme.content.width, theme.content.height) *
                        (3 / 128);
                    jacketImage.src = jacket;
                    ctx.beginPath();
                    ctx.roundRect(
                        element.x + jacketMargin,
                        element.y + jacketMargin,
                        element.width - jacketMargin * 2,
                        element.width - jacketMargin * 2,
                        [roundRadius, roundRadius, 0, 0]
                    );
                    ctx.save();
                    ctx.clip();
                    ctx.drawImage(
                        jacketImage,
                        element.x + jacketMargin,
                        element.y + jacketMargin,
                        element.width - jacketMargin * 2,
                        element.width - jacketMargin * 2
                    );
                    ctx.restore();
                }
                /* End jacket draw */

                /* Begin Detail Draw */
                if (chart) {
                    const textSizeTitle = element.width * (1 / 16);
                    const textSizeSecondary = element.width * (1 / 24);
                    const {
                        actualBoundingBoxAscent: ascent,
                        actualBoundingBoxDescent: decent,
                    } = Util.measureText(
                        ctx,
                        chart.name,
                        textSizeTitle,
                        Infinity
                    );
                    const titleActualHeight = Math.abs(ascent - decent);
                    const mode = new Image();
                    const chartModeBadgeImg = theme.getFile(
                        chart.id > 10000
                            ? element.sprites.mode.dx
                            : element.sprites.mode.standard
                    );
                    const { width: modeWidth, height: modeHeight } =
                        await sharp(chartModeBadgeImg).metadata();
                    const aspectRatio =
                        (modeWidth ?? 0) / (modeHeight ?? 1) || 3;

                    const textLineWidth = element.width * (7 / 512);
                    const textColor = new Color(element.color.card)
                        .darken(0.5)
                        .hex();
                    const textTitleMaxWidth =
                        element.width -
                        textMargin * 2 -
                        textSizeTitle * aspectRatio;

                    const titleMetrics = Util.measureText(
                        ctx,
                        chart.name,
                        textSizeTitle,
                        textTitleMaxWidth
                    );

                    Util.drawText(
                        ctx,
                        chart.name,
                        element.x + textMargin,
                        element.y +
                            jacketMargin +
                            textMargin * (1 / 2) +
                            (element.width - jacketMargin * 2) +
                            textSizeTitle,
                        textSizeTitle,
                        textLineWidth,
                        textTitleMaxWidth,
                        "left",
                        "white",
                        textColor
                    );

                    Util.drawText(
                        ctx,
                        chart.artist,
                        element.x + textMargin,
                        element.y +
                            jacketMargin +
                            textMargin * (1 / 2) +
                            (element.width - jacketMargin * 2) +
                            textSizeTitle * 2,
                        textSizeSecondary,
                        textLineWidth,
                        element.width - textMargin * 2,
                        "left",
                        "white",
                        textColor
                    );
                    Util.drawText(
                        ctx,
                        `#${chart.id} BPM: ${chart.bpm}`,
                        element.x + textMargin,
                        element.y +
                            jacketMargin +
                            textMargin * (1 / 2) +
                            (element.width - jacketMargin * 2) +
                            textSizeTitle * 3,
                        textSizeSecondary,
                        textLineWidth,
                        element.width - textMargin * 2,
                        "left",
                        "white",
                        textColor
                    );

                    const EVENT_DX = chart.events
                        .filter(
                            (v) =>
                                v.version.region == "DX" &&
                                v.version.gameVersion.minor >= DX_LATEST
                        )
                        .map((v) => v.type);
                    const EVENT_EX = chart.events
                        .filter(
                            (v) =>
                                v.version.region == "EX" &&
                                v.version.gameVersion.minor >= EX_LATEST
                        )
                        .map((v) => v.type);
                    const EVENT_CN = chart.events
                        .filter(
                            (v) =>
                                v.version.region == "CN" &&
                                v.version.gameVersion.minor >= CN_LATEST
                        )
                        .map((v) => v.type);
                    const EXIST_DX =
                        EVENT_DX.includes("existence") &&
                        !EVENT_DX.includes("removal")
                            ? "🇯🇵"
                            : "";
                    const EXIST_EX =
                        EVENT_EX.includes("existence") &&
                        !EVENT_EX.includes("removal")
                            ? "🌏"
                            : "";
                    const EXIST_CN =
                        EVENT_CN.includes("existence") &&
                        !EVENT_CN.includes("removal")
                            ? "🇨🇳"
                            : "";
                    const title = [];
                    if (EXIST_DX) title.push(EXIST_DX);
                    if (EXIST_EX) title.push(EXIST_EX);
                    if (EXIST_CN) title.push(EXIST_CN);
                    await Util.drawEmojiOrGlyph(
                        ctx,
                        title.join(" "),
                        element.x + element.width - textMargin,
                        element.y +
                            jacketMargin +
                            textMargin * (1 / 2) +
                            (element.width - jacketMargin * 2) +
                            textSizeTitle * 3,
                        textSizeSecondary * (9 / 8),
                        element.width - textMargin * 2,
                        "right",
                        "white",
                        textColor
                    );

                    /** Begin Chart Mode Draw */
                    {
                        mode.src = chartModeBadgeImg;
                        ctx.drawImage(
                            mode,
                            element.x +
                                textMargin * (3 / 2) +
                                titleMetrics.width,
                            element.y +
                                jacketMargin +
                                textMargin * (1 / 2) +
                                (element.width - jacketMargin * 2) -
                                titleActualHeight / 2 +
                                textSizeTitle / 2,
                            textSizeTitle * aspectRatio,
                            textSizeTitle
                        );
                    }
                    /** End Chart Mode Draw */
                }
                /* End Detail Draw */
            }
        }
    }
}
