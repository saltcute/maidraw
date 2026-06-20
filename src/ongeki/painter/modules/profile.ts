import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import { getSafeImage, safeLoadImage } from "@common/utils/loadImage";
import { truncate } from "@common/utils/number";
import { drawText } from "@common/utils/textDraw/drawText";
import { Canvas, type CanvasRenderingContext2D } from "canvas";
import Color from "color";
import sharp from "sharp";
import z from "zod/v4";

export interface ProfileModulePainterContext {
    username: string;
    rating: number;
    profilePicture?: Buffer;
    type: "refresh" | "classic";
}

export class ProfileModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
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

    private getRatingColor(rating: number, type: "refresh" | "classic") {
        if (type === "classic") {
            if (rating >= 15) return "rainbow";
            if (rating >= 14.5) return "platinum";
            if (rating >= 14) return "gold";
            if (rating >= 13) return "silver";
            if (rating >= 12) return "bronze";
            if (rating >= 10) return "purple";
            if (rating >= 7) return "red";
            if (rating >= 4) return "orange";
            if (rating >= 2) return "green";
            return "blue";
        } else {
            if (rating >= 22) return "rainbow3";
            if (rating >= 21) return "rainbow2";
            if (rating >= 19) return "rainbow";
            if (rating >= 18) return "platinum";
            if (rating >= 17) return "gold";
            if (rating >= 15) return "silver";
            if (rating >= 13) return "bronze";
            if (rating >= 11) return "purple";
            if (rating >= 9) return "red";
            if (rating >= 7) return "orange";
            if (rating >= 4) return "green";
            return "blue";
        }
    }
    private async getRatingNumber(num: number, theme: Theme<unknown>, element: z.infer<typeof ProfileModule.SCHEMA>, type: "refresh" | "classic") {
        async function getRatingDigit(map: Buffer, digit: number, unitWidth: number, unitHeight: number) {
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
        async function getRatingDot(map: Buffer, unitWidth: number, unitHeight: number) {
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
        const map = theme.getFile(element.sprites.rating.numberMap[this.getRatingColor(num, type)]);
        const { width, height } = await sharp(map).metadata();
        if (!(width && height)) return { number: null, text: null };
        const unitWidth = Math.trunc(width / 4),
            unitHeight = Math.trunc(height / 4);
        const digits: {
            str: string;
            img: Buffer | null;
        }[] = await Promise.all(
            truncate(num, type === "classic" ? 2 : 3)
                .padStart(5, " ")
                .split("")
                .map((v) => {
                    if (v === ".")
                        return getRatingDot(map, unitWidth, unitHeight).then((img) => {
                            return { str: v, img };
                        });
                    else if ("0" <= v && v <= "9")
                        return getRatingDigit(map, parseInt(v, 10), unitWidth, unitHeight).then((img) => {
                            return { str: v, img };
                        });
                    else return { str: v, img: null };
                }),
        );
        const integerPartScale = 1.3;
        const canvas = new Canvas(unitWidth * digits.length, unitHeight * integerPartScale);
        const ctx = canvas.getContext("2d");
        let state: "large" | "small" = "large";
        for (let i = 0, curx = 0; i < digits.length; ++i) {
            const curDigit = digits[i];
            if (!curDigit?.img) continue;
            const img = await safeLoadImage(curDigit.img);
            if (curDigit.str === ".") {
                ctx.drawImage(img, curx, unitHeight * (integerPartScale - 1));
                curx += unitWidth * 0.45;
                state = "small";
            } else {
                if (state === "small") {
                    ctx.drawImage(img, curx, unitHeight * (integerPartScale - 1) * 0.75);
                    curx += unitWidth * 0.6;
                } else {
                    ctx.drawImage(img, curx, 0, unitWidth * integerPartScale, unitHeight * integerPartScale);
                    curx += unitWidth * 0.6 * integerPartScale;
                }
            }
        }
        return {
            number: canvas.toBuffer(),
            text: theme.getFile(element.sprites.rating.headerText[this.getRatingColor(num, type)]),
        };
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<{ width: number; height: number }>,
        element: z.infer<typeof ProfileModule.SCHEMA>,
        painterCtx: ProfileModulePainterContext,
    ) {
        const { username, rating, type } = painterCtx;
        let { profilePicture } = painterCtx;
        const themeWidth = theme.content.width;
        const themeHeight = theme.content.height;
        try {
            const userplate = sharp(theme.getFile(element.sprites.profile.userplate));
            const upper = await userplate.resize({ width: 1080, height: 166, fit: "cover", position: "top" }).png().toBuffer();
            const lower = await userplate.resize({ width: 1080, height: 130, fit: "cover", position: "bottom" }).png().toBuffer();
            const upperImage = await safeLoadImage(upper);
            const lowerImage = await safeLoadImage(lower);

            ctx.drawImage(upperImage, element.x, element.y, themeWidth, themeWidth * (166 / 1080));
            ctx.drawImage(lowerImage, element.x, element.y + themeHeight - themeWidth * (130 / 1080), themeWidth, themeWidth * (130 / 1080));
        } catch {}

        ctx.save();
        ctx.translate(element.x + themeWidth * (7 / 32) * (59 / 128), element.y + themeWidth * (7 / 32) * (16 / 128));

        /* Begin Profile Picture Draw */
        {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, themeWidth * (7 / 32) * 0.45, themeWidth * (7 / 32) * 0.45);
            ctx.clip();
            ctx.fillStyle = "white";
            ctx.fill();
            try {
                sharp(profilePicture);
            } catch {
                // Unknown profile picture binary
                profilePicture = undefined;
            }
            const pfpBuffer = profilePicture || theme.getFile(element.sprites.profile.icon);
            const { dominant } = await sharp(await getSafeImage(pfpBuffer)).stats();
            const icon = await safeLoadImage(pfpBuffer);

            const cropSize = Math.min(icon.width, icon.height);
            ctx.drawImage(
                icon,
                (icon.width - cropSize) / 2,
                (icon.height - cropSize) / 2,
                cropSize,
                cropSize,
                0,
                0,
                themeWidth * (7 / 32) * 0.45,
                themeWidth * (7 / 32) * 0.45,
            );

            if (profilePicture) {
                ctx.beginPath();
                ctx.rect(0, 0, themeWidth * (7 / 32) * 0.45, themeWidth * (7 / 32) * 0.45);
                ctx.strokeStyle = Color.rgb(dominant).darken(0.3).hex();
                ctx.lineWidth = (themeWidth * (7 / 32)) / 128;
                ctx.stroke();
            }
            ctx.restore();
        }
        ctx.save();
        ctx.translate(themeWidth * (7 / 32) * 0.45, 0);
        {
            ctx.beginPath();
            ctx.rect(0, themeWidth * (7 / 32) * (19 / 128), themeWidth * (7 / 32) * (41 / 128), themeWidth * (7 / 32) * (20 / 128));
            ctx.fillStyle = "#3e3e3e";
            ctx.fill();
            ctx.beginPath();
            ctx.rect(
                themeWidth * (7 / 32) * (41 / 128),
                themeWidth * (7 / 32) * (19 / 128),
                themeWidth * (7 / 32) * (135 / 128),
                themeWidth * (7 / 32) * (20 / 128),
            );
            ctx.fillStyle = "white";
            ctx.fill();
            drawText(ctx, "Lv.", themeWidth * (7 / 32) * (5 / 128), themeWidth * (7 / 32) * (37 / 128), themeWidth * (7 / 32) * (8 / 128), 0, {
                maxWidth: (((themeWidth * (7 / 32)) / 3) * 5.108 * 3.1) / 5,
                textAlign: "left",
                mainColor: "white",
                borderColor: "white",
                font: "ongeki-font-level",
            });
            drawText(ctx, "39", themeWidth * (7 / 32) * (14 / 128), themeWidth * (7 / 32) * (37 / 128), themeWidth * (7 / 32) * (21 / 128), 0, {
                maxWidth: (((themeWidth * (7 / 32)) / 3) * 5.108 * 3.1) / 5,
                textAlign: "left",
                mainColor: "white",
                borderColor: "white",
                font: "ongeki-font-level",
            });

            drawText(
                ctx,
                toFullWidth(username),
                themeWidth * (7 / 32) * (108 / 128),
                themeWidth * (7 / 32) * (36 / 128),
                themeWidth * (7 / 32) * (1 / 8),
                0,
                {
                    maxWidth: themeWidth * (7 / 32) * (135 / 128),
                    textAlign: "center",
                    mainColor: "black",
                    borderColor: "black",
                    font: "standard-font-username",
                    widthConstraintType: "shrink",
                    shrinkAnchor: "center",
                },
            );

            const { number: ratingNumberImg, text: ratingTextImg } = await this.getRatingNumber(rating, theme, element, type);

            if (ratingTextImg) {
                const image = await safeLoadImage(ratingTextImg);
                const { width, height } = image;
                const aspectRatio = width / height;
                const drawHeight = themeWidth * (7 / 32) * (12 / 128);
                const drawWidth = drawHeight * aspectRatio;
                ctx.drawImage(image, themeWidth * (7 / 32) * (-1 / 128), themeWidth * (7 / 32) * (46 / 128), drawWidth, drawHeight);
            }
            if (ratingNumberImg) {
                const image = await safeLoadImage(ratingNumberImg);
                const { width, height } = image;
                const aspectRatio = width / height;
                const drawHeight = themeWidth * (7 / 32) * (20 / 128);
                const drawWidth = drawHeight * aspectRatio;
                ctx.drawImage(image, themeWidth * (7 / 32) * (48 / 128), themeWidth * (7 / 32) * (39 / 128), drawWidth, drawHeight);
            }
        }
        ctx.restore();
        ctx.restore();
    }
}
