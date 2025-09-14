import _ from "lodash";
import sharp from "sharp";
import Color from "color";
import { z } from "zod/v4";
import { CanvasRenderingContext2D, Image } from "canvas";

import { Database } from "../lib/database";
import { ChunithmUtil } from "../lib/util";
import ScoreTrackerAdapter from "../lib/adapter";
import { EAchievementTypes, EComboTypes, EDifficulty, IScore } from "../type";

import { Util } from "@maidraw/lib/util";
import { Painter, Theme, ThemeManager } from "@maidraw/lib/painter";

export abstract class ChunithmPainter<
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

export namespace ChunithmPainterModule {
    export namespace Profile {
        export const schema = ThemeManager.Element.extend({
            type: z.literal("profile"),
            height: z.number().min(1),
            sprites: z.object({
                ratingNumberMap: z.string(),
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
                element.height * 2.526,
                element.height
            );

            /* Begin Profile Picture Draw */
            {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(
                    element.x + element.height * 2.0,
                    element.y + element.height * 0.3,
                    element.height * 0.45,
                    element.height * 0.45,
                    0
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
                    element.x + element.height * 2.0,
                    element.y + element.height * 0.3,
                    element.height * 0.45,
                    element.height * 0.45
                );

                if (profilePicture) {
                    ctx.beginPath();
                    ctx.roundRect(
                        element.x + element.height * 2.0,
                        element.y + element.height * 0.3,
                        element.height * 0.45,
                        element.height * 0.45,
                        0
                    );
                    ctx.strokeStyle = Color.rgb(dominant).darken(0.3).hex();
                    ctx.lineWidth = element.height / 128;
                    ctx.stroke();
                }
                ctx.restore();
            }
            /* End Profile Picture Draw */

            /* Begin Username Draw */
            {
                ctx.beginPath();
                ctx.roundRect(
                    element.x + element.height * (21 / 32),
                    element.y + element.height * (11 / 32),
                    element.height * (85 / 64),
                    element.height * (13 / 32),
                    0
                );
                ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
                ctx.fill();

                // const ratingImgBuffer = await this.getRatingNumber(rating, theme);
                // if (ratingImgBuffer) {
                //     const { width, height } =
                //         await sharp(ratingImgBuffer).metadata();
                //     if (width && height) {
                //         const aspectRatio = width / height;
                //         const image = new Image();
                //         image.src = ratingImgBuffer;
                //         const drawHeight = (element.height * 7) / 32;
                //         ctx.drawImage(
                //             image,
                //             element.x + element.height * 2.0,
                //             element.y + element.height * 0.3,
                //             drawHeight * aspectRatio * 0.8,
                //             drawHeight
                //         );
                //     }
                // }
                Util.drawText(
                    ctx,
                    "Lv.",
                    element.x + element.height * (43 / 64),
                    element.y + element.height * (0.3 + 1 / 4),
                    (element.height * 1) / 16,
                    0,
                    ((element.height / 3) * 5.108 * 3.1) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );
                Util.drawText(
                    ctx,
                    "99",
                    element.x + element.height * (49 / 64),
                    element.y + element.height * (0.3 + 1 / 4),
                    (element.height * 1) / 11,
                    0,
                    ((element.height / 3) * 5.108 * 3.1) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );

                Util.drawText(
                    ctx,
                    Util.HalfFullWidthConvert.toFullWidth(username),
                    element.x + element.height * (56 / 64),
                    element.y + element.height * (0.3 + 1 / 4),
                    (element.height * 1) / 8,
                    0,
                    element.height * (65 / 64),
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );

                Util.drawText(
                    ctx,
                    "RATING",
                    element.x + element.height * (43 / 64),
                    element.y + element.height * (47 / 64),
                    (element.height * 7) / 88,
                    0,
                    ((element.height / 3) * 5.108 * 3.1) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );
                Util.drawText(
                    ctx,
                    Util.truncate(rating, 2),
                    element.x + element.height * (67 / 64),
                    element.y + element.height * (47 / 64),
                    (element.height * 5) / 44,
                    0,
                    ((element.height / 3) * 5.108 * 3.1) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );
            }
            /* End Username Draw*/
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
                        ultima: Util.z.color(),
                        worldsEnd: Util.z.color(),
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
                        aj: z.string(),
                        ajc: z.string(),
                        fc: z.string(),
                        none: z.string(),
                    }),
                }),
            });
            export async function draw(
                ctx: CanvasRenderingContext2D,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                score: IScore,
                index: number,
                x: number,
                y: number
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
                    case EDifficulty.ULTIMA:
                        curColor = element.scoreBubble.color.ultima;
                        break;
                    case EDifficulty.WORLDS_END:
                        curColor = element.scoreBubble.color.worldsEnd;
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
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(
                        x,
                        y,
                        element.scoreBubble.width,
                        element.scoreBubble.height * 0.742,
                        (element.scoreBubble.height * 0.806) / 7
                    );
                    ctx.clip();
                    ctx.fillStyle = curColor;
                    ctx.fill();

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
                    if (!jacket) jacket = await Database.fetchJacket(-1);
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
                                element.scoreBubble.margin,
                            element.scoreBubble.height * 0.806 * 0.02,
                            (element.scoreBubble.height * 0.806 * 0.02) / 2
                        );
                        ctx.fillStyle = jacketMaskGradDark;
                        ctx.fill();
                    } /** End Separation Line Draw */

                    /** Begin Achievement Rate Draw */
                    Util.drawText(
                        ctx,
                        Util.truncate(score.score, 0),
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
                        switch (score.rank) {
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
                            x + jacketSize * (13 / 16),
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.144 + 0.144 - 0.01),
                            element.scoreBubble.height * 0.806 * 0.2 * 3,
                            element.scoreBubble.height * 0.806 * 0.2
                        );
                    }
                    /** End Achievement Rank Draw */

                    /** Begin Milestone Draw */
                    {
                        let comboImg: Buffer;
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
                            case EComboTypes.ALL_JUSTICE:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.aj
                                );
                                break;
                            case EComboTypes.ALL_JUSTICE_CRITICAL:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.ajc
                                );
                                break;
                        }
                        ctx.beginPath();
                        ctx.fillStyle = "#e8eaec";
                        ctx.roundRect(
                            x -
                                element.scoreBubble.height * 0.806 * 0.32 * 3 -
                                element.scoreBubble.margin -
                                element.scoreBubble.height * 0.806 * 0.02 +
                                element.scoreBubble.width,
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.144 + 0.144 + 0.208 + 0.1),
                            element.scoreBubble.height * 0.806 * 0.32 * 3,
                            (element.scoreBubble.height * 0.806 * 0.32 * 3) /
                                6.7,
                            (element.scoreBubble.height * 0.806 * 0.32 * 3) / 56
                        );
                        ctx.fill();
                        const combo = new Image();
                        combo.src = comboImg;
                        ctx.drawImage(
                            combo,
                            x -
                                element.scoreBubble.height * 0.806 * 0.32 * 3 -
                                element.scoreBubble.margin -
                                element.scoreBubble.height * 0.806 * 0.02 +
                                element.scoreBubble.width,
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height *
                                    0.806 *
                                    (0.144 + 0.144 + 0.208 + 0.1),
                            element.scoreBubble.height * 0.806 * 0.32 * 3,
                            (element.scoreBubble.height * 0.806 * 0.32 * 3) /
                                6.7
                        );
                    }
                    /** End Milestone Draw */

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

                /** Begin Difficulty & Rating Draw */
                {
                    Util.drawText(
                        ctx,
                        `lv. ${Util.truncate(score.chart.level, 1)}`,
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

                    Util.drawText(
                        ctx,
                        `+${Util.truncate(score.rating, 2)}`,
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
                /** End Difficulty & Rating Draw */

                ctx.restore();
                /** End Card Draw */
            }
        }
    }

    export namespace Chart {
        const JPN_LATEST = 230;
        const INT_LATEST = 140;
        const CHN_LATEST = 120;

        const CHUNITHM_VERSIONS = [
            240, 230, 225, 220, 215, 210, 205, 200, 150, 145, 140, 135, 130,
            125, 120, 115, 110, 105, 100,
        ] as const;
        const CHUNITHM_INT_VERSIONS = [
            140, 135, 130, 125, 120, 115, 110, 105, 100,
        ] as const;
        const ZHONGERJIEZOU_VERSIONS = [120, 110, 100] as const;

        function findVersion(v: number, region: "JPN" | "INT" | "CHN") {
            const target = (() => {
                switch (region) {
                    case "INT":
                        return CHUNITHM_INT_VERSIONS;
                    case "CHN":
                        return ZHONGERJIEZOU_VERSIONS;
                    case "JPN":
                    default:
                        return CHUNITHM_VERSIONS;
                }
            })();
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
                        ultima: Util.z.color(),
                        worldsEnd: Util.z.color(),
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
                        aj: z.string(),
                        ajc: z.string(),
                        fc: z.string(),
                        none: z.string(),
                    }),
                    versions: z.object({
                        JPN: z.object({
                            "100": z.string(),
                            "105": z.string(),
                            "110": z.string(),
                            "115": z.string(),
                            "120": z.string(),
                            "125": z.string(),
                            "130": z.string(),
                            "135": z.string(),
                            "140": z.string(),
                            "145": z.string(),
                            "150": z.string(),
                            "155": z.string(),
                            "200": z.string(),
                            "205": z.string(),
                            "210": z.string(),
                            "215": z.string(),
                            "220": z.string(),
                            "225": z.string(),
                            "230": z.string(),
                            "240": z.string(),
                        }),
                        INT: z.object({
                            "100": z.string(),
                            "105": z.string(),
                            "110": z.string(),
                            "115": z.string(),
                            "120": z.string(),
                            "125": z.string(),
                            "130": z.string(),
                            "135": z.string(),
                            "140": z.string(),
                        }),
                        CHN: z.object({
                            "100": z.string(),
                            "110": z.string(),
                            "120": z.string(),
                            "130": z.string(),
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
                region: "JPN" | "INT" | "CHN" = "JPN"
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
                for (let i = EDifficulty.BASIC; i <= EDifficulty.ULTIMA; ++i) {
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
                x: number,
                y: number,
                width: number,
                height: number,
                isShort: boolean,
                targetRegion: "JPN" | "INT" | "CHN" = "JPN",
                score?: IScore | null
            ) {
                let curColor = "#FFFFFF";
                switch (chart.difficulty) {
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
                    case EDifficulty.ULTIMA:
                        curColor = element.bubble.color.ultima;
                        break;
                    case EDifficulty.WORLDS_END:
                        curColor = element.bubble.color.worldsEnd;
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
                            case EDifficulty.ULTIMA:
                                difficultiy = "ULTIMA";
                                break;
                            case EDifficulty.WORLDS_END:
                                difficultiy = "WORLD'S END";
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
                            `Lv. ${Util.truncate(
                                chart.events
                                    .filter(
                                        (v) => v.version.region == targetRegion
                                    )
                                    .reverse()
                                    .find((v) => v.type == "existence")?.data
                                    .level || 0,
                                1
                            )}${score ? `　+${Util.truncate(score.rating, 1)}` : ""}`,
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
                            score ? Util.truncate(score.score, 0) : "NO RECORD",
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
                            switch (score.rank) {
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

                            const blockHeight = height * 0.806 * 0.3 * 0.85,
                                blockWidth = blockHeight * (540 / 180);

                            const img = new Image();
                            img.src = rankImg;
                            ctx.drawImage(
                                img,
                                x + element.bubble.margin * (1 / 2),
                                y +
                                    element.bubble.margin +
                                    titleSize +
                                    element.bubble.margin * (1 / 2),
                                blockWidth,
                                blockHeight
                            );
                        }
                    }
                    /** End Achievement Rank Draw */

                    /** Begin Milestone Draw */
                    {
                        const blockWidth = height * 0.806 * 0.32 * 3,
                            blockHeight = (blockWidth * 40) / 268;

                        const curX =
                                x -
                                blockWidth +
                                height * 2 -
                                element.bubble.margin,
                            curY =
                                y + element.bubble.margin * 2 + titleSize * 2;

                        ctx.fillStyle = "#e8eaec";
                        ctx.roundRect(
                            curX,
                            curY,
                            blockWidth,
                            blockHeight,
                            blockWidth / 56
                        );
                        ctx.fill();
                        if (score) {
                            let comboImg: Buffer;
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
                                case EComboTypes.ALL_JUSTICE:
                                    comboImg = theme.getFile(
                                        element.sprites.milestone.aj
                                    );
                                    break;
                                case EComboTypes.ALL_JUSTICE_CRITICAL:
                                    comboImg = theme.getFile(
                                        element.sprites.milestone.ajc
                                    );
                                    break;
                            }
                            const combo = new Image();
                            combo.src = comboImg;
                            ctx.drawImage(
                                combo,
                                curX,
                                curY,
                                blockWidth,
                                blockHeight
                            );
                        }
                    }
                    /** End Milestone Draw */

                    /** Begin Version Draw */
                    {
                        const version: {
                            region: "JPN" | "INT" | "CHN";
                            version?: Database.IVersion;
                        } = {
                            region: "JPN",
                            version: undefined,
                        };
                        const VER =
                            chart.difficulty == EDifficulty.ULTIMA
                                ? chart.events.find(
                                      (v) =>
                                          v.type == "existence" &&
                                          v.version.region == targetRegion
                                  )?.version
                                : chart.addVersion;
                        version.version = VER;
                        version.region = targetRegion;
                        const versionImageHeight =
                            (height - element.bubble.margin * 2) *
                            (isShort ? 9 / 16 : 1 / 2);
                        const versionImageWidth =
                            (versionImageHeight / 160) * 201;
                        const curx = x + width - element.bubble.margin,
                            cury = y + element.bubble.margin;
                        if (version.version) {
                            const rawVersion = findVersion(
                                ChunithmUtil.getNumberVersion(version.version),
                                targetRegion
                            );
                            if (rawVersion) {
                                const versionImage = theme.getFile(
                                    element.sprites.versions[version.region][
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
                                        ctx.drawImage(
                                            versionImg,
                                            curx - versionImageWidth,
                                            cury,
                                            versionImageWidth,
                                            versionImageHeight
                                        );
                                    }
                                } catch {}
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
                                        (element.bubble.margin * 2) /
                                            (noteCountTexts.length - 1)) *
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
                            const CURRENT_VER = (() => {
                                switch (targetRegion) {
                                    case "INT":
                                        return INT_LATEST;
                                    case "CHN":
                                        return CHN_LATEST;
                                    case "JPN":
                                    default:
                                        return JPN_LATEST;
                                }
                            })();
                            const maxWidth =
                                width -
                                height * 2 -
                                element.bubble.margin * 4 -
                                noteCountLength -
                                versionImageWidth;
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
                                actualEvents = _.sortBy(actualEvents, (v) =>
                                    ChunithmUtil.getNumberVersion(v.version)
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
                                ChunithmUtil.getNumberVersion(
                                    actualEvents[actualEvents.length - 1]
                                        .version
                                ) < CURRENT_VER
                            ) {
                                while (actualEvents.length >= maxFitTrendCount)
                                    actualEvents.pop();
                                actualEvents.push({
                                    type: "removal",
                                    version:
                                        ChunithmUtil.Version.toEventVersion(
                                            ChunithmUtil.Version.getNextVersion(
                                                trendEvents[
                                                    trendEvents.length - 1
                                                ].version
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
                                        element.bubble.margin +
                                        versionImageHeight * (1 / 2);
                                i < actualEvents.length;
                                ++i
                            ) {
                                const event = actualEvents[i];
                                const rawVersion = findVersion(
                                    ChunithmUtil.getNumberVersion(
                                        event.version
                                    ),
                                    targetRegion
                                );
                                if (rawVersion) {
                                    const versionImage = theme.getFile(
                                        element.sprites.versions[targetRegion][
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
                        chart.designer || "-",
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

                    // Util.drawText(
                    //     ctx,
                    //     `${score ? `${score.dxScore}/` : "MAX DX SCR: "}${chart.meta.maxDXScore}`,
                    //     x + height * 2 - element.bubble.margin,
                    //     y + height - element.bubble.margin * 3.1,
                    //     height * 0.806 * 0.128,
                    //     height * 0.806 * 0.04,
                    //     Infinity,
                    //     "right",
                    //     "white",
                    //     new Color(curColor).darken(0.3).hexa()
                    // );
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
            });

            export async function draw(
                ctx: CanvasRenderingContext2D,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                chartId: number
            ) {
                const jacketMargin = element.margin;
                const textMargin = element.margin;
                const backGroundBorderRadius =
                    Math.min(theme.content.width, theme.content.height) *
                    (3 / 128);

                let chart: Database.IChart | null = null;
                for (
                    let i = EDifficulty.BASIC;
                    i <= EDifficulty.WORLDS_END;
                    ++i
                ) {
                    chart = Database.getLocalChart(chartId, i);
                    if (chart !== null) break;
                }
                const jacket = await Database.fetchJacket(chartId);
                /* Begin Background Draw */
                ctx.beginPath();
                ctx.roundRect(
                    element.x,
                    element.y,
                    element.width,
                    element.height,
                    backGroundBorderRadius
                );
                ctx.fillStyle = element.color.card;
                ctx.strokeStyle = new Color(element.color.card)
                    .darken(0.6)
                    .hex();
                ctx.lineWidth = backGroundBorderRadius / 4;
                ctx.stroke();
                ctx.fill();
                /* End Background Draw */

                /* Begin jacket draw */
                if (jacket) {
                    const jacketImage = new Image();
                    const jacketBorderRadius = backGroundBorderRadius / 2;
                    jacketImage.src = jacket;
                    ctx.beginPath();
                    ctx.roundRect(
                        element.x + jacketMargin,
                        element.y + jacketMargin,
                        element.width - jacketMargin * 2,
                        element.width - jacketMargin * 2,
                        jacketBorderRadius
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

                    const textLineWidth = element.width * (7 / 512);
                    const textColor = new Color(element.color.card)
                        .darken(0.5)
                        .hex();
                    const textTitleMaxWidth = element.width - textMargin * 2;

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
                    function getBpmRange(bpms: number[]) {
                        const uniqueBpms = _.uniq(bpms);
                        if (uniqueBpms.length <= 0) return "0";
                        else if (uniqueBpms.length == 1)
                            return `${uniqueBpms[0]}`;
                        else {
                            const minBpm = Math.min(...uniqueBpms);
                            const maxBpm = Math.max(...uniqueBpms);
                            return `${minBpm}-${maxBpm}`;
                        }
                    }
                    Util.drawText(
                        ctx,
                        `#${chart.id} BPM: ${getBpmRange(chart.bpms)}`,
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

                    const EVENT_JPN = chart.events
                        .filter(
                            (v) =>
                                v.version.region == "JPN" &&
                                ChunithmUtil.getNumberVersion(v.version) >=
                                    JPN_LATEST
                        )
                        .map((v) => v.type);
                    const EVENT_INT = chart.events
                        .filter(
                            (v) =>
                                v.version.region == "INT" &&
                                ChunithmUtil.getNumberVersion(v.version) >=
                                    INT_LATEST
                        )
                        .map((v) => v.type);
                    const EVENT_CHN = chart.events
                        .filter(
                            (v) =>
                                v.version.region == "CHN" &&
                                ChunithmUtil.getNumberVersion(v.version) >=
                                    CHN_LATEST
                        )
                        .map((v) => v.type);
                    const EXIST_JPN =
                        EVENT_JPN.includes("existence") &&
                        !EVENT_JPN.includes("removal")
                            ? "🇯🇵"
                            : "";
                    const EXIST_INT =
                        EVENT_INT.includes("existence") &&
                        !EVENT_INT.includes("removal")
                            ? "🌏"
                            : "";
                    const EXIST_CHN =
                        EVENT_CHN.includes("existence") &&
                        !EVENT_CHN.includes("removal")
                            ? "🇨🇳"
                            : "";
                    const title = [];
                    if (EXIST_JPN) title.push(EXIST_JPN);
                    if (EXIST_INT) title.push(EXIST_INT);
                    if (EXIST_CHN) title.push(EXIST_CHN);
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
                }
                /* End Detail Draw */
            }
        }
    }
}
