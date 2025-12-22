import _ from "lodash";
import sharp from "sharp";
import Color from "color";
import { z } from "zod/v4";
import { Canvas, CanvasRenderingContext2D } from "canvas";

import { Database } from "../lib/database";
import { OngekiScoreAdapter } from "../lib/adapter";
import {
    EAchievementTypes,
    EBellTypes,
    EComboTypes,
    EDifficulty,
    IScore,
} from "../type";

import { Util } from "@maidraw/lib/util";
import { Painter, Theme, ThemeManager } from "@maidraw/lib/painter";
import { OngekiUtil } from "../lib/util";

export abstract class OngekiPainter<
    Schema extends typeof ThemeManager.BaseObject,
> extends Painter<OngekiScoreAdapter, Schema> {
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
                rating: z.object({
                    numberMap: z.object({
                        blue: z.string(),
                        green: z.string(),
                        orange: z.string(),
                        red: z.string(),
                        purple: z.string(),
                        bronze: z.string(),
                        silver: z.string(),
                        gold: z.string(),
                        platinum: z.string(),
                        rainbow: z.string(),
                        rainbow2: z.string(),
                        rainbow3: z.string(),
                    }),
                    headerText: z.object({
                        blue: z.string(),
                        green: z.string(),
                        orange: z.string(),
                        red: z.string(),
                        purple: z.string(),
                        bronze: z.string(),
                        silver: z.string(),
                        gold: z.string(),
                        platinum: z.string(),
                        rainbow: z.string(),
                        rainbow2: z.string(),
                        rainbow3: z.string(),
                    }),
                }),
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
                const upperImage = await Util.loadImage(upper);
                const lowerImage = await Util.loadImage(lower);

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

            ctx.save();
            ctx.translate(
                element.x + theme.content.width * (7 / 32) * (59 / 128),
                element.y + theme.content.width * (7 / 32) * (16 / 128)
            );

            /* Begin Profile Picture Draw */
            {
                ctx.save();
                ctx.beginPath();
                ctx.rect(
                    0,
                    0,
                    theme.content.width * (7 / 32) * 0.45,
                    theme.content.width * (7 / 32) * 0.45
                );
                ctx.clip();
                ctx.fillStyle = "white";
                ctx.fill();
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
                const icon = await Util.loadImage(
                    await sharp(pfp).png().toBuffer()
                );

                const cropSize = Math.min(icon.width, icon.height);
                ctx.drawImage(
                    icon,
                    (icon.width - cropSize) / 2,
                    (icon.height - cropSize) / 2,
                    cropSize,
                    cropSize,
                    0,
                    0,
                    theme.content.width * (7 / 32) * 0.45,
                    theme.content.width * (7 / 32) * 0.45
                );

                if (profilePicture) {
                    ctx.beginPath();
                    ctx.rect(
                        0,
                        0,
                        theme.content.width * (7 / 32) * 0.45,
                        theme.content.width * (7 / 32) * 0.45
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
                ctx.save();
                ctx.translate(theme.content.width * (7 / 32) * 0.45, 0);
                {
                    ctx.beginPath();
                    ctx.rect(
                        0,
                        theme.content.width * (7 / 32) * (19 / 128),
                        theme.content.width * (7 / 32) * (41 / 128),
                        theme.content.width * (7 / 32) * (20 / 128)
                    );
                    ctx.fillStyle = "#3e3e3e";
                    ctx.fill();
                    ctx.beginPath();
                    ctx.rect(
                        theme.content.width * (7 / 32) * (41 / 128),
                        theme.content.width * (7 / 32) * (19 / 128),
                        theme.content.width * (7 / 32) * (135 / 128),
                        theme.content.width * (7 / 32) * (20 / 128)
                    );
                    ctx.fillStyle = "white";
                    ctx.fill();
                    Util.drawText(
                        ctx,
                        "Lv.",
                        theme.content.width * (7 / 32) * (5 / 128),
                        theme.content.width * (7 / 32) * (37 / 128),
                        theme.content.width * (7 / 32) * (8 / 128),
                        0,
                        {
                            maxWidth:
                                (((theme.content.width * (7 / 32)) / 3) *
                                    5.108 *
                                    3.1) /
                                5,
                            textAlign: "left",
                            mainColor: "white",
                            borderColor: "white",
                            font: "ongeki-font-level",
                        }
                    );
                    Util.drawText(
                        ctx,
                        "39",
                        theme.content.width * (7 / 32) * (14 / 128),
                        theme.content.width * (7 / 32) * (37 / 128),
                        theme.content.width * (7 / 32) * (21 / 128),
                        0,
                        {
                            maxWidth:
                                (((theme.content.width * (7 / 32)) / 3) *
                                    5.108 *
                                    3.1) /
                                5,
                            textAlign: "left",
                            mainColor: "white",
                            borderColor: "white",
                            font: "ongeki-font-level",
                        }
                    );

                    Util.drawText(
                        ctx,
                        Util.HalfFullWidthConvert.toFullWidth(username),
                        theme.content.width * (7 / 32) * (108 / 128),
                        theme.content.width * (7 / 32) * (36 / 128),
                        theme.content.width * (7 / 32) * (1 / 8),
                        0,
                        {
                            maxWidth:
                                theme.content.width * (7 / 32) * (135 / 128),
                            textAlign: "center",
                            mainColor: "black",
                            borderColor: "black",
                            font: "standard-font-username",
                            widthConstraintType: "shrink",
                            shrinkAnchor: "center",
                        }
                    );

                    const { number: ratingNumberImg, text: ratingTextImg } =
                        await getRatingNumber(rating, theme, element, type);

                    if (ratingTextImg) {
                        const image = await Util.loadImage(ratingTextImg);
                        const { width, height } = image;
                        const aspectRatio = width / height;
                        const drawHeight =
                            theme.content.width * (7 / 32) * (12 / 128);
                        const drawWidth = drawHeight * aspectRatio;
                        ctx.drawImage(
                            image,
                            theme.content.width * (7 / 32) * (-1 / 128),
                            theme.content.width * (7 / 32) * (46 / 128),
                            drawWidth,
                            drawHeight
                        );
                    }
                    if (ratingNumberImg) {
                        const image = await Util.loadImage(ratingNumberImg);
                        const { width, height } = image;
                        const aspectRatio = width / height;
                        const drawHeight =
                            theme.content.width * (7 / 32) * (20 / 128);
                        const drawWidth = drawHeight * aspectRatio;
                        ctx.drawImage(
                            image,
                            theme.content.width * (7 / 32) * (48 / 128),
                            theme.content.width * (7 / 32) * (39 / 128),
                            drawWidth,
                            drawHeight
                        );
                    }
                }
                ctx.restore();
            }

            async function getRatingNumber(
                num: number,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                type: "refresh" | "classic"
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
                            top: Math.trunc(digit / 4) * (unitHeight + 1),
                            width: unitWidth,
                            height: unitHeight,
                        })
                        .toBuffer();
                }
                async function getRatingDot(
                    map: Buffer,
                    unitWidth: number,
                    unitHeight: number
                ) {
                    const { height } = await sharp(map).metadata();
                    return await sharp(map)
                        .extract({
                            left: 0,
                            top: height ? height - unitHeight : unitHeight * 3,
                            width: unitWidth,
                            height: unitHeight,
                        })
                        .toBuffer();
                }
                function getRatingColor(
                    rating: number,
                    type: "refresh" | "classic"
                ) {
                    if (type == "classic") {
                        if (rating >= 15) {
                            return "rainbow";
                        } else if (rating >= 14.5) {
                            return "platinum";
                        } else if (rating >= 14) {
                            return "gold";
                        } else if (rating >= 13) {
                            return "silver";
                        } else if (rating >= 12) {
                            return "bronze";
                        } else if (rating >= 10) {
                            return "purple";
                        } else if (rating >= 7) {
                            return "red";
                        } else if (rating >= 4) {
                            return "orange";
                        } else if (rating >= 2) {
                            return "green";
                        } else {
                            return "blue";
                        }
                    } else {
                        if (rating >= 22) {
                            return "rainbow3";
                        } else if (rating >= 21) {
                            return "rainbow2";
                        } else if (rating >= 19) {
                            return "rainbow";
                        } else if (rating >= 18) {
                            return "platinum";
                        } else if (rating >= 17) {
                            return "gold";
                        } else if (rating >= 15) {
                            return "silver";
                        } else if (rating >= 13) {
                            return "bronze";
                        } else if (rating >= 11) {
                            return "purple";
                        } else if (rating >= 9) {
                            return "red";
                        } else if (rating >= 7) {
                            return "orange";
                        } else if (rating >= 4) {
                            return "green";
                        } else {
                            return "blue";
                        }
                    }
                }
                const map = theme.getFile(
                    element.sprites.rating.numberMap[getRatingColor(num, type)]
                );
                const { width, height } = await sharp(map).metadata();
                if (!(width && height)) return { number: null, text: null };
                const unitWidth = Math.trunc(width / 4),
                    unitHeight = Math.trunc(height / 4);
                const digits: {
                    str: string;
                    img: Buffer | null;
                }[] = await Promise.all(
                    Util.truncate(num, type === "classic" ? 2 : 3)
                        .padStart(5, " ")
                        .split("")
                        .map((v) => {
                            if (v === ".")
                                return getRatingDot(
                                    map,
                                    unitWidth,
                                    unitHeight
                                ).then((img) => {
                                    return {
                                        str: v,
                                        img,
                                    };
                                });
                            else if ("0" <= v && v <= "9")
                                return getRatingDigit(
                                    map,
                                    parseInt(v),
                                    unitWidth,
                                    unitHeight
                                ).then((img) => {
                                    return {
                                        str: v,
                                        img,
                                    };
                                });
                            else if ("0" <= v && v <= "9")
                                return getRatingDigit(
                                    map,
                                    parseInt(v),
                                    unitWidth,
                                    unitHeight
                                ).then((img) => {
                                    return {
                                        str: v,
                                        img,
                                    };
                                });
                            else
                                return {
                                    str: v,
                                    img: null,
                                };
                        })
                );
                const integerPartScale = 1.3;
                const canvas = new Canvas(
                    unitWidth * digits.length,
                    unitHeight * integerPartScale
                );
                const ctx = canvas.getContext("2d");
                let state: "large" | "small" = "large";
                for (let i = 0, curx = 0; i < digits.length; ++i) {
                    const curDigit = digits[i];
                    if (!curDigit || !curDigit.img) continue;
                    const img = await Util.loadImage(curDigit.img);
                    if (curDigit.str === ".") {
                        ctx.drawImage(
                            img,
                            curx,
                            unitHeight * (integerPartScale - 1)
                        );
                        curx += unitWidth * 0.45;
                        state = "small";
                    } else {
                        if (state === "small") {
                            ctx.drawImage(
                                img,
                                curx,
                                unitHeight * (integerPartScale - 1) * 0.75
                            );
                            curx += unitWidth * 0.6;
                        } else {
                            ctx.drawImage(
                                img,
                                curx,
                                0,
                                unitWidth * integerPartScale,
                                unitHeight * integerPartScale
                            );
                            curx += unitWidth * 0.6 * integerPartScale;
                        }
                    }
                }
                return {
                    number: canvas.toBuffer(),
                    text: theme.getFile(
                        element.sprites.rating.headerText[
                            getRatingColor(rating, type)
                        ]
                    ),
                };
            }
            /* End Username Draw*/

            ctx.restore();
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
                        const img = await Util.loadImage(jacket);
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
                            {
                                maxWidth:
                                    element.scoreBubble.width -
                                    (jacketSize * 7) / 8 -
                                    element.scoreBubble.margin,
                                textAlign: "left",
                                mainColor: "white",
                                borderColor: jacketMaskGradDark,
                            }
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
                        {
                            textAlign: "right",
                            mainColor: "white",
                            borderColor: new Color(curColor).darken(0.3).hexa(),
                        }
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
                        const img = await Util.loadImage(rankImg);
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
                        const combo = await Util.loadImage(comboImg);
                        const bell = await Util.loadImage(bellImg);

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
                            {
                                textAlign: "left",
                                mainColor: "white",
                                borderColor: new Color(curColor)
                                    .darken(0.3)
                                    .hexa(),
                            }
                        );
                    }
                    /** End Bests Index Draw */

                    ctx.restore();
                }
                /** End Main Content Draw */

                /** Begin Difficulty & Rating Draw */
                {
                    let content = "";
                    if (element.region === "recent" && type === "refresh") {
                        content = `★${OngekiUtil.getStar(score.platinumScore / score.chart.maxPlatinumScore)}  +${Util.truncate(score.starRating, 3)}`;
                    } else {
                        content = `${Util.truncate(score.chart.level, 1)}  ↑${Util.truncate(score.rating, type === "refresh" ? 3 : 2)}`;
                    }
                    Util.drawText(
                        ctx,
                        content,
                        x + element.scoreBubble.margin * 2,
                        y +
                            element.scoreBubble.height *
                                (0.806 + (1 - 0.806) / 2),
                        element.scoreBubble.height * 0.806 * 0.128,
                        element.scoreBubble.height * 0.806 * 0.04,
                        {
                            textAlign: "left",
                            mainColor: "white",
                            borderColor: new Color(curColor).darken(0.3).hexa(),
                        }
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
                            {
                                textAlign: "right",
                                mainColor: "white",
                                borderColor: new Color(curColor)
                                    .darken(0.3)
                                    .hexa(),
                            }
                        );
                }
                /** End Difficulty & Rating Draw */

                ctx.restore();
                /** End Card Draw */
            }
        }
    }

    export namespace Chart {
        const JPN_LATEST = 150;
        const INT_LATEST = 0;
        const CHN_LATEST = 0;

        const ONGEKI_VERSIONS = [
            150, 145, 140, 135, 130, 125, 120, 115, 110, 105, 100,
        ] as const;
        const ONGEKI_INT_VERSIONS = [] as const;
        const YINJI_VERSIONS = [] as const;

        function findVersion(v: number, region: "JPN" | "INT" | "CHN") {
            const target = (() => {
                switch (region) {
                    case "INT":
                        return ONGEKI_INT_VERSIONS;
                    case "CHN":
                        return YINJI_VERSIONS;
                    case "JPN":
                    default:
                        return ONGEKI_VERSIONS;
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
                        lunatic: Util.z.color(),
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
                    versions: z.object({
                        JPN: z.record(z.string(), z.string()),
                    }),
                }),
            });

            export async function draw(
                ctx: CanvasRenderingContext2D,
                theme: Theme<any>,
                element: z.infer<typeof schema>,
                chartId: number,
                scores: (IScore | null)[],
                region: "JPN" = "JPN",
                type: "refresh" | "classic" = "refresh"
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
                for (let i = EDifficulty.BASIC; i <= EDifficulty.LUNATIC; ++i) {
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
                                    scores[i],
                                    type
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
                targetRegion: "JPN" = "JPN",
                score?: IScore | null,
                type: "refresh" | "classic" = "refresh"
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
                    case EDifficulty.LUNATIC:
                        curColor = element.bubble.color.lunatic;
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
                            case EDifficulty.LUNATIC:
                                difficultiy = "LUNATIC";
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
                            {
                                textAlign: "left",
                                mainColor: "white",
                                borderColor: new Color(curColor)
                                    .darken(0.3)
                                    .hexa(),
                            }
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
                            )}${score ? `　↑${Util.truncate(score.rating, type == "classic" ? 2 : 3)}` : ""}`,
                            x + element.bubble.margin * 2 + difficultyTextWidth,
                            y +
                                element.bubble.margin +
                                titleSize -
                                element.bubble.margin * (1 / 4),
                            levelTextSize,
                            height * 0.806 * 0.04,
                            {
                                textAlign: "left",
                                mainColor: "white",
                                borderColor: new Color(curColor)
                                    .darken(0.3)
                                    .hexa(),
                            }
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
                            {
                                textAlign: "right",
                                mainColor: "white",
                                borderColor: new Color(curColor)
                                    .darken(0.3)
                                    .hexa(),
                            }
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
                            const achievementRankHeight =
                                height * 0.806 * 0.3 * 0.85;
                            const achievementRankWidth =
                                achievementRankHeight * (286 / 143);

                            const img = await Util.loadImage(rankImg);
                            ctx.drawImage(
                                img,
                                x + element.bubble.margin * (1 / 2),
                                y +
                                    element.bubble.margin +
                                    titleSize +
                                    element.bubble.margin * (1 / 2),
                                achievementRankWidth,
                                achievementRankHeight
                            );

                            /** End Achievement Rank Draw */

                            /** Begin Milestone Draw */

                            const comboImgRatio = 84 / 290;
                            const comboBgRatio = 64 / 272;
                            const comboWidth =
                                achievementRankHeight / comboImgRatio;
                            const comboBackground = comboWidth * 0.9;
                            const sizeDiff = comboWidth - comboBackground;

                            const curX =
                                    x +
                                    element.bubble.margin * (1 / 2) +
                                    achievementRankWidth,
                                curY =
                                    y +
                                    element.bubble.margin * (3 / 2) +
                                    titleSize;

                            ctx.beginPath();
                            ctx.fillStyle = "#e8eaec";
                            ctx.roundRect(
                                curX + sizeDiff / 2,
                                curY + ((sizeDiff * 3) / 2) * comboBgRatio,
                                comboBackground,
                                comboBackground * comboBgRatio,
                                (comboBackground * comboBgRatio) / 2
                            );
                            ctx.roundRect(
                                curX + sizeDiff / 2,
                                curY +
                                    comboWidth * comboImgRatio +
                                    sizeDiff * (1 / 2) * comboBgRatio,
                                comboBackground,
                                comboBackground * comboBgRatio,
                                (comboBackground * comboBgRatio) / 2
                            );
                            ctx.fill();
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
                            const combo = await Util.loadImage(comboImg);
                            const bell = await Util.loadImage(bellImg);

                            ctx.drawImage(
                                combo,
                                curX,
                                curY,
                                comboWidth,
                                comboWidth * comboImgRatio
                            );
                            ctx.drawImage(
                                bell,
                                curX,
                                curY +
                                    comboWidth * comboImgRatio -
                                    sizeDiff * comboBgRatio,
                                comboWidth,
                                comboWidth * comboImgRatio
                            );
                        }
                    }
                    /** End Milestone Draw */
                    const scorePartWidth =
                        element.bubble.margin * (3 / 2) + height * 2;
                    const noteCountTexts = Object.entries(chart.meta.notes).map(
                        ([k, v]) => `${Util.capitalize(k)}: ${v}`
                    );
                    const noteCountTextSize = (() => {
                        let base =
                            (height - element.bubble.margin * 4) /
                            noteCountTexts.length;
                        for (
                            ;
                            base > 4 &&
                            noteCountTexts
                                .map((v) =>
                                    Util.measureText(ctx, v, base, Infinity)
                                )
                                .find((v) => v.width > width - scorePartWidth);
                            base--
                        ) {}
                        return base;
                    })();
                    const noteCountTextWidth = noteCountTexts
                        .map((v) =>
                            Util.measureText(
                                ctx,
                                v,
                                noteCountTextSize,
                                Infinity
                            )
                        )
                        .reduce((a, b) => (a.width > b.width ? a : b)).width;
                    /** Begin Note Count Draw */
                    {
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
                                {
                                    textAlign: "left",
                                    mainColor: "white",
                                    borderColor: new Color(curColor)
                                        .darken(0.3)
                                        .hexa(),
                                }
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

                        /** Begin Version Draw */
                        const version: {
                            region: "JPN";
                            version?: Database.IVersion;
                        } = {
                            region: "JPN",
                            version: undefined,
                        };
                        const VER =
                            chart.difficulty == EDifficulty.LUNATIC
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
                            (isShort ? 5 / 8 : 1 / 2);
                        const versionImageWidth =
                            (versionImageHeight / 270) * 360;
                        const curx = x + width - element.bubble.margin,
                            cury = y + element.bubble.margin;
                        if (
                            version.version &&
                            scorePartWidth +
                                noteCountTextWidth +
                                versionImageWidth <
                                width
                        ) {
                            const rawVersion = findVersion(
                                OngekiUtil.getNumberVersion(version.version),
                                targetRegion
                            );
                            if (rawVersion) {
                                const versionImage = theme.getFile(
                                    element.sprites.versions[version.region][
                                        rawVersion
                                    ]
                                );
                                try {
                                    sharp(versionImage);
                                    if (versionImage) {
                                        const versionImg =
                                            await Util.loadImage(versionImage);
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

                        /** Begin Internal Level Trend Draw */
                        if (!isShort) {
                            const CURRENT_VER = (() => {
                                switch (targetRegion) {
                                    // case "INT":
                                    //     return INT_LATEST;
                                    // case "CHN":
                                    //     return CHN_LATEST;
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
                                    OngekiUtil.getNumberVersion(v.version)
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
                                OngekiUtil.getNumberVersion(
                                    actualEvents[actualEvents.length - 1]
                                        .version
                                ) < CURRENT_VER
                            ) {
                                while (actualEvents.length >= maxFitTrendCount)
                                    actualEvents.pop();
                                actualEvents.push({
                                    type: "removal",
                                    version: OngekiUtil.Version.toEventVersion(
                                        OngekiUtil.Version.getNextVersion(
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
                                        element.bubble.margin +
                                        versionImageHeight * (1 / 2);
                                i < actualEvents.length;
                                ++i
                            ) {
                                const event = actualEvents[i];
                                const rawVersion = findVersion(
                                    OngekiUtil.getNumberVersion(event.version),
                                    targetRegion
                                );
                                if (rawVersion) {
                                    const versionImage = theme.getFile(
                                        element.sprites.versions[targetRegion][
                                            rawVersion
                                        ]
                                    );
                                    try {
                                        if (!versionImage)
                                            throw "No versionImage";
                                        sharp(versionImage);
                                        const versionImg =
                                            await Util.loadImage(versionImage);
                                        ctx.drawImage(
                                            versionImg,
                                            curx,
                                            cury,
                                            versionImageWidth,
                                            versionImageHeight
                                        );
                                    } catch {
                                        const str = `${event.version.gameVersion.major}.${event.version.gameVersion.minor}`;
                                        const measurement = Util.measureText(
                                            ctx,
                                            str,
                                            noteCountTextSize * 1.2,
                                            Infinity
                                        );
                                        Util.drawText(
                                            ctx,
                                            str,
                                            curx + versionImageWidth / 2,
                                            cury +
                                                versionImageHeight / 2 -
                                                (measurement.actualBoundingBoxDescent -
                                                    measurement.actualBoundingBoxAscent) /
                                                    2,
                                            noteCountTextSize * 1.2,
                                            height * 0.806 * 0.04,
                                            {
                                                textAlign: "center",
                                                mainColor: "white",
                                                borderColor: new Color(curColor)
                                                    .darken(0.3)
                                                    .hexa(),
                                            }
                                        );
                                    }
                                    if (event.type == "existence") {
                                        let symbol = "";
                                        if (i != 0) {
                                            const lastEvent =
                                                actualEvents[i - 1];
                                            if (lastEvent.type == "existence") {
                                                if (
                                                    lastEvent.data.level <
                                                    event.data.level
                                                )
                                                    symbol = "↑";
                                                else if (
                                                    lastEvent.data.level >
                                                    event.data.level
                                                )
                                                    symbol = "↓";
                                                else if (
                                                    lastEvent.data.level ==
                                                    event.data.level
                                                )
                                                    symbol = "→";
                                            }
                                        }
                                        Util.drawText(
                                            ctx,
                                            `${symbol}${Util.truncate(event.data.level, 1)}`,
                                            curx + versionImageWidth / 2,
                                            cury +
                                                versionImageHeight +
                                                noteCountTextSize,
                                            noteCountTextSize,
                                            height * 0.806 * 0.04,
                                            {
                                                textAlign: "center",
                                                mainColor: "white",
                                                borderColor: new Color(curColor)
                                                    .darken(0.3)
                                                    .hexa(),
                                            }
                                        );
                                    } else if (event.type == "removal") {
                                        Util.drawText(
                                            ctx,
                                            `❌`,
                                            curx + versionImageWidth / 2,
                                            cury +
                                                versionImageHeight +
                                                noteCountTextSize,
                                            noteCountTextSize,
                                            height * 0.806 * 0.04,
                                            {
                                                textAlign: "center",
                                                mainColor: "white",
                                                borderColor: new Color(curColor)
                                                    .darken(0.3)
                                                    .hexa(),
                                            }
                                        );
                                    }
                                    curx += versionImageWidth + addGap;
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
                /** Begin Difficulty & Platinum Rating Draw */
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
                        {
                            textAlign: "left",
                            mainColor: "white",
                            borderColor: new Color(curColor).darken(0.3).hexa(),
                        }
                    );
                    ctx.restore();

                    Util.drawText(
                        ctx,
                        `${score ? `${score.platinumScore}/` : "MAX PT SCR: "}${chart.meta.maxPlatinumScore}`,
                        x + height * 2 - element.bubble.margin,
                        y + height - element.bubble.margin * 3.1,
                        height * 0.806 * 0.128,
                        height * 0.806 * 0.04,
                        {
                            textAlign: "right",
                            mainColor: "white",
                            borderColor: new Color(curColor).darken(0.3).hexa(),
                        }
                    );
                }
                /** End Difficulty & Platinum Rating Draw */

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
                for (let i = EDifficulty.BASIC; i <= EDifficulty.LUNATIC; ++i) {
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
                    const jacketBorderRadius = backGroundBorderRadius / 2;
                    const jacketImage = await Util.loadImage(jacket);
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
                        {
                            maxWidth: textTitleMaxWidth,
                            textAlign: "left",
                            mainColor: "white",
                            borderColor: textColor,
                        }
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
                        {
                            maxWidth: element.width - textMargin * 2,
                            textAlign: "left",
                            mainColor: "white",
                            borderColor: textColor,
                        }
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
                        {
                            maxWidth: element.width - textMargin * 2,
                            textAlign: "left",
                            mainColor: "white",
                            borderColor: textColor,
                        }
                    );

                    const EVENT_JPN = chart.events
                        .filter(
                            (v) =>
                                v.version.region == "JPN" &&
                                OngekiUtil.getNumberVersion(v.version) >=
                                    JPN_LATEST
                        )
                        .map((v) => v.type);
                    const EVENT_INT = chart.events
                        .filter(
                            (v) =>
                                // @ts-expect-error
                                v.version.region == "INT" &&
                                OngekiUtil.getNumberVersion(v.version) >=
                                    INT_LATEST
                        )
                        .map((v) => v.type);
                    const EVENT_CHN = chart.events
                        .filter(
                            (v) =>
                                // @ts-expect-error
                                v.version.region == "CHN" &&
                                OngekiUtil.getNumberVersion(v.version) >=
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

        export namespace CharacterInfo {
            export const schema = ThemeManager.Element.extend({
                type: z.literal("character-info"),
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
                character?: {
                    card: {
                        id: number;
                        name: string;
                    };
                    character: {
                        rarity: string;
                        name: string;
                        comment?: string;
                    };
                    level: number;
                }
            ) {
                const jacketMargin = element.margin;
                const backGroundBorderRadius =
                    Math.min(theme.content.width, theme.content.height) *
                    (3 / 128);

                const characterImg = character
                    ? await Database.getCardImage(character.card.id)
                    : null;
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

                ctx.save();
                ctx.clip();
                /* Begin character draw */
                const characterImgRatio = 768 / 1052;
                const characterBorderRadius = backGroundBorderRadius / 2;
                const characterImgHeight = element.height - jacketMargin * 2;
                const characterImgWidth =
                    characterImgHeight * characterImgRatio;
                const cardCenterOffset =
                    (element.width - characterImgWidth) / 2;
                if (characterImg) {
                    const characterImage = await Util.loadImage(characterImg);
                    ctx.beginPath();
                    ctx.roundRect(
                        element.x + cardCenterOffset,
                        element.y +
                            jacketMargin * 2 +
                            characterImgHeight * (30 / 100),
                        characterImgWidth,
                        characterImgHeight * (70 / 100),
                        [characterImgWidth / 2, characterImgWidth / 2, 0, 0]
                    );
                    ctx.fillStyle = new Color(element.color.card)
                        .lighten(0.1)
                        .hex();
                    ctx.strokeStyle = new Color(element.color.card)
                        .darken(0.3)
                        .hex();
                    ctx.lineWidth = backGroundBorderRadius / 4;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.roundRect(
                        element.x + cardCenterOffset,
                        element.y + jacketMargin * 2,
                        characterImgWidth,
                        characterImgHeight,
                        [characterBorderRadius, characterBorderRadius, 0, 0]
                    );
                    ctx.save();
                    ctx.clip();

                    ctx.drawImage(
                        characterImage,
                        element.x + cardCenterOffset,
                        element.y + jacketMargin * 2,
                        characterImgWidth,
                        characterImgHeight
                    );

                    ctx.restore();
                }
                /* End character draw */

                /* Begin Detail Draw */
                const textSizeTitle = jacketMargin;
                const textSizeSecondary = jacketMargin * (3 / 4);

                const textLineWidth = element.width * (7 / 512);
                const textColor = new Color(element.color.card)
                    .darken(0.5)
                    .hex();

                if (character) {
                    const characterNameMetrics = Util.measureText(
                        ctx,
                        `Lv.${character.level} ${character.character.name}`,
                        textSizeTitle,
                        Infinity
                    );
                    const characterNameActualHeight = Math.abs(
                        characterNameMetrics.actualBoundingBoxAscent -
                            characterNameMetrics.actualBoundingBoxDescent
                    );
                    Util.drawText(
                        ctx,
                        `Lv.${character.level} ${character.character.name}`,
                        element.x + cardCenterOffset + characterImgWidth / 2,
                        element.y + jacketMargin + characterNameActualHeight,
                        textSizeTitle,
                        textLineWidth,
                        {
                            textAlign: "center",
                            mainColor: "white",
                            borderColor: textColor,
                        }
                    );

                    if (character.character.comment) {
                        const card = Database.getLocalCard(character.card.id);
                        if (card) {
                            const chara = Database.getLocalCharacter(
                                card?.characterId
                            );
                            if (chara) {
                                function getRandomFromArray(arr: string[]) {
                                    return arr[
                                        Math.floor(Math.random() * arr.length)
                                    ];
                                }
                                if (chara.voiceLines.length > 0) {
                                    const quote = getRandomFromArray(
                                        chara.voiceLines
                                    );
                                    if (quote) {
                                        const curX =
                                                element.x +
                                                cardCenterOffset +
                                                characterImgWidth -
                                                jacketMargin,
                                            curY = element.y + jacketMargin * 2;
                                        ctx.save();
                                        ctx.translate(curX, curY);
                                        ctx.rotate((5 * Math.PI) / 180);
                                        Util.drawVerticalText(
                                            ctx,
                                            `「${quote}」`,
                                            0,
                                            0,
                                            textSizeSecondary,
                                            textLineWidth,
                                            "white",
                                            textColor
                                        );
                                        ctx.restore();
                                    }
                                }
                            }
                        }
                    }
                }

                /* End Detail Draw */

                ctx.restore();
            }
        }
    }
}
