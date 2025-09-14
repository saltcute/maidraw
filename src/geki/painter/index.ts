import _ from "lodash";
import sharp from "sharp";
import Color from "color";
import { z } from "zod/v4";
import { CanvasRenderingContext2D, Image } from "canvas";

import { Database } from "../lib/database";
import ScoreTrackerAdapter from "../lib/adapter";
import {
    EAchievementTypes,
    EBellTypes,
    EComboTypes,
    EDifficulty,
    IScore,
} from "../type";

import { Util } from "@maidraw/lib/util";
import { Painter, Theme, ThemeManager } from "@maidraw/lib/painter";

export abstract class OngekiPainter<
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

export namespace OngekiPainterModule {
    export namespace Profile {
        export const schema = ThemeManager.Element.extend({
            type: z.literal("profile"),
            sprites: z.object({
                ratingNumberMap: z.string(),
                profile: z.object({
                    userplate: z.string(),
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
            profilePicture?: Buffer,
            type: "refresh" | "classic" = "refresh"
        ) {
            try {
                const userplate = sharp(
                    theme.getFile(element.sprites.profile.userplate)
                );
                const upper = await userplate
                    .resize({
                        width: 1080,
                        height: 166,
                        fit: "cover",
                        position: "top",
                    })
                    .png()
                    .toBuffer();
                const lower = await userplate
                    .resize({
                        width: 1080,
                        height: 130,
                        fit: "cover",
                        position: "bottom",
                    })
                    .png()
                    .toBuffer();
                const upperImage = new Image();
                const lowerImage = new Image();
                upperImage.src = upper;
                lowerImage.src = lower;

                ctx.drawImage(
                    upperImage,
                    element.x,
                    element.y,
                    theme.content.width,
                    theme.content.width * (166 / 1080)
                );
                ctx.drawImage(
                    lowerImage,
                    element.x,
                    element.y +
                        theme.content.height -
                        theme.content.width * (130 / 1080),
                    theme.content.width,
                    theme.content.width * (130 / 1080)
                );
            } catch {}

            /* Begin Profile Picture Draw */
            {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(
                    element.x + theme.content.width * (7 / 32) * (233 / 128),
                    element.y + theme.content.width * (3 / 32) * (19 / 64),
                    theme.content.width * (7 / 32) * 0.45,
                    theme.content.width * (7 / 32) * 0.45,
                    [
                        0,
                        theme.content.width * (7 / 32) * 0.05,
                        theme.content.width * (7 / 32) * 0.05,
                        0,
                    ]
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
                    element.x + theme.content.width * (7 / 32) * (233 / 128),
                    element.y + theme.content.width * (3 / 32) * (19 / 64),
                    theme.content.width * (7 / 32) * 0.45,
                    theme.content.width * (7 / 32) * 0.45
                );

                if (profilePicture) {
                    ctx.beginPath();
                    ctx.roundRect(
                        element.x +
                            theme.content.width * (7 / 32) * (233 / 128),
                        element.y + theme.content.width * (3 / 32) * (19 / 64),
                        theme.content.width * (7 / 32) * 0.45,
                        theme.content.width * (7 / 32) * 0.45,
                        [
                            0,
                            theme.content.width * (7 / 32) * 0.05,
                            theme.content.width * (7 / 32) * 0.05,
                            0,
                        ]
                    );
                    ctx.strokeStyle = Color.rgb(dominant).darken(0.3).hex();
                    ctx.lineWidth = (theme.content.width * (7 / 32)) / 128;
                    ctx.stroke();
                }
                ctx.restore();
            }
            /* End Profile Picture Draw */

            /* Begin Username Draw */
            {
                ctx.beginPath();
                ctx.roundRect(
                    element.x + theme.content.width * (7 / 32) * (59 / 128),
                    element.y + theme.content.width * (7 / 32) * (16 / 128),
                    theme.content.width * (7 / 32) * (85 / 64),
                    theme.content.width * (7 / 32) * 0.45,
                    [
                        theme.content.width * (7 / 32) * 0.05,
                        0,
                        0,
                        theme.content.width * (7 / 32) * 0.05,
                    ]
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
                //         const drawHeight = (theme.content.width * (7/32) * 7) / 32;
                //         ctx.drawImage(
                //             image,
                //             element.x + theme.content.width * (7/32) * 2.0,
                //             element.y + theme.content.width * (7/32) * 0.3,
                //             drawHeight * aspectRatio * 0.8,
                //             drawHeight
                //         );
                //     }
                // }
                Util.drawText(
                    ctx,
                    "Lv.",
                    element.x + theme.content.width * (7 / 32) * (62 / 128),
                    element.y + theme.content.width * (7 / 32) * (49 / 128),
                    (theme.content.width * (7 / 32) * 1) / 16,
                    0,
                    (((theme.content.width * (7 / 32)) / 3) * 5.108 * 3.1) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );
                Util.drawText(
                    ctx,
                    "99",
                    element.x + theme.content.width * (7 / 32) * (74 / 128),
                    element.y + theme.content.width * (7 / 32) * (49 / 128),
                    (theme.content.width * (7 / 32) * 1) / 11,
                    0,
                    (((theme.content.width * (7 / 32)) / 3) * 5.108 * 3.1) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );

                Util.drawText(
                    ctx,
                    Util.HalfFullWidthConvert.toFullWidth(username),
                    element.x + theme.content.width * (7 / 32) * (89 / 128),
                    element.y + theme.content.width * (7 / 32) * (49 / 128),
                    (theme.content.width * (7 / 32) * 1) / 8,
                    0,
                    theme.content.width * (7 / 32) * (140 / 128),
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );

                Util.drawText(
                    ctx,
                    "RATING",
                    element.x + theme.content.width * (7 / 32) * (62 / 128),
                    element.y + theme.content.width * (7 / 32) * (70 / 128),
                    (theme.content.width * (7 / 32) * 7) / 88,
                    0,
                    (((theme.content.width * (7 / 32)) / 3) * 5.108 * 3.1) / 5,
                    "left",
                    "black",
                    "black",
                    "standard-font-username"
                );
                Util.drawText(
                    ctx,
                    Util.truncate(rating, type === "refresh" ? 3 : 2),
                    element.x + theme.content.width * (7 / 32) * (109 / 128),
                    element.y + theme.content.width * (7 / 32) * (70 / 128),
                    (theme.content.width * (7 / 32) * 5) / 44,
                    0,
                    (((theme.content.width * (7 / 32)) / 3) * 5.108 * 3.1) / 5,
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
                region: z.enum(["recent", "new", "old"]),
                index: z.number().min(0),
                scoreBubble: z.object({
                    width: z.number().min(1),
                    height: z.number().min(1),
                    margin: z.number().min(0),
                    gap: z.union([
                        z.number().min(0),
                        z.object({
                            x: z.number().min(0),
                            y: z.number().min(0),
                        }),
                    ]),
                    color: z.object({
                        basic: Util.z.color(),
                        advanced: Util.z.color(),
                        expert: Util.z.color(),
                        master: Util.z.color(),
                        lunatic: Util.z.color(),
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
                        ss: z.string(),
                        sss: z.string(),
                        sssp: z.string(),
                    }),
                    milestone: z.object({
                        ab: z.string(),
                        abp: z.string(),
                        fc: z.string(),
                        fb: z.string(),
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
                y: number,
                type: "refresh" | "classic" = "refresh"
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
                    case EDifficulty.LUNATIC:
                        curColor = element.scoreBubble.color.lunatic;
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
                            case EAchievementTypes.SS:
                                rankImg = theme.getFile(
                                    element.sprites.achievement.ss
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
                            x + jacketSize * (31 / 32),
                            y +
                                element.scoreBubble.margin +
                                element.scoreBubble.height * 0.835 * 0.22,
                            element.scoreBubble.height * 0.835 * 0.24 * 2,
                            element.scoreBubble.height * 0.835 * 0.24
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
                            case EComboTypes.ALL_BREAK:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.ab
                                );
                                break;
                            case EComboTypes.ALL_BREAK_PLUS:
                                comboImg = theme.getFile(
                                    element.sprites.milestone.abp
                                );
                                break;
                        }
                        let bellImg: Buffer;
                        switch (score.bell) {
                            case EBellTypes.NONE:
                                bellImg = theme.getFile(
                                    element.sprites.milestone.none
                                );
                                break;
                            case EBellTypes.FULL_BELL:
                                bellImg = theme.getFile(
                                    element.sprites.milestone.fb
                                );
                                break;
                        }
                        const comboWidth =
                            element.scoreBubble.height * 0.806 * 0.24 * 3;
                        const comboBackground = comboWidth * 0.9;
                        const comboBgRatio = 64 / 272;
                        const sizeDiff = comboWidth - comboBackground;
                        ctx.beginPath();
                        ctx.fillStyle = "#e8eaec";
                        ctx.roundRect(
                            x +
                                sizeDiff / 2 +
                                element.scoreBubble.width -
                                element.scoreBubble.margin -
                                comboWidth,
                            y +
                                jacketSize -
                                (sizeDiff / 2) * comboBgRatio -
                                element.scoreBubble.margin -
                                comboWidth * comboBgRatio,
                            comboBackground,
                            comboBackground * comboBgRatio,
                            (comboBackground * comboBgRatio) / 2
                        );
                        ctx.fill();

                        ctx.roundRect(
                            x +
                                sizeDiff / 2 +
                                element.scoreBubble.width -
                                1.5 * element.scoreBubble.margin -
                                2 * comboWidth,
                            y +
                                jacketSize -
                                (sizeDiff / 2) * comboBgRatio -
                                element.scoreBubble.margin -
                                comboWidth * comboBgRatio,
                            comboBackground,
                            comboBackground * comboBgRatio,
                            (comboBackground * comboBgRatio) / 2
                        );
                        ctx.fill();
                        const combo = new Image();
                        combo.src = comboImg;
                        const bell = new Image();
                        bell.src = bellImg;

                        ctx.drawImage(
                            bell,
                            x +
                                element.scoreBubble.width -
                                element.scoreBubble.margin -
                                comboWidth,
                            y +
                                jacketSize -
                                element.scoreBubble.margin -
                                comboWidth * (84 / 290),
                            comboWidth,
                            comboWidth * (84 / 290)
                        );
                        ctx.drawImage(
                            combo,
                            x +
                                element.scoreBubble.width -
                                1.5 * element.scoreBubble.margin -
                                2 * comboWidth,
                            y +
                                jacketSize -
                                element.scoreBubble.margin -
                                comboWidth * (84 / 290),
                            comboWidth,
                            comboWidth * (84 / 290)
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
                        `${Util.truncate(score.chart.level, 1)}  ↑${Util.truncate(score.rating, type === "refresh" ? 3 : 2)}`,
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

                    if (score.platinumScore && score.chart.maxPlatinumScore)
                        Util.drawText(
                            ctx,
                            `${score.platinumScore}/${score.chart.maxPlatinumScore}`,
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
}
