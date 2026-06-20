import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapContext, wrapTranslate } from "@common/utils/ctxWrapper";
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
    type: "chunithm" | "crystal" | "new" | "verse";
}

export class ProfileModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("profile"),
        height: z.number().min(1),
        sprites: z.object({
            ratingNumberMap: z.object({
                white: z.string(),
                bronze: z.string(),
                silver: z.string(),
                gold: z.string(),
                platinum: z.string(),
                rainbow: z.string(),
                kiwami: z.string(),
            }),
            profile: z.object({
                nameplate: z.string(),
                icon: z.string(),
            }),
        }),
    });
    private drawNameplate: typeof this.draw = async (ctx, theme, element) => {
        const nameplate = await safeLoadImage(theme.getFile(element.sprites.profile.nameplate));
        const { width, height } = nameplate;
        const aspectRatio = width / height;
        ctx.drawImage(nameplate, 0, 0, element.height * aspectRatio, element.height);
    };
    private drawProfilePicture: typeof this.draw = async (ctx, theme, element, painterCtx) => {
        const profilePictureSize = element.height * 0.45;
        const profilePictureDimensions = [0, 0, profilePictureSize, profilePictureSize, 0] as const;
        return wrapTranslate(ctx, element.height * 2.0, element.height * 0.3, () =>
            wrapClip(
                ctx,
                () =>
                    wrapBackground(
                        ctx,
                        "white",
                        async () => {
                            try {
                                sharp(painterCtx.profilePicture);
                            } catch {
                                // Unknown profile picture binary
                                painterCtx.profilePicture = undefined;
                            }
                            const pfpBuffer = painterCtx.profilePicture || theme.getFile(element.sprites.profile.icon);
                            const pfp = await safeLoadImage(pfpBuffer);
                            const { dominant } = await sharp(await getSafeImage(pfpBuffer)).stats();

                            const cropSize = Math.min(pfp.width, pfp.height);
                            ctx.drawImage(
                                pfp,
                                (pfp.width - cropSize) / 2, // Crop x
                                (pfp.height - cropSize) / 2, // Crop y
                                cropSize,
                                cropSize,
                                0, // Draw x
                                0, // Draw y
                                profilePictureSize,
                                profilePictureSize,
                            );

                            // Draw pfp border
                            if (painterCtx.profilePicture) {
                                wrapBorder(
                                    ctx,
                                    Color.rgb(dominant).darken(0.3).hex(),
                                    element.height / 128,
                                    () => {},
                                    0,
                                    0,
                                    profilePictureSize,
                                    profilePictureSize,
                                    0,
                                );
                            }
                        },
                        ...profilePictureDimensions,
                    ),
                ...profilePictureDimensions,
            ),
        );
    };
    private drawRating: typeof this.draw = async (ctx, theme, element, painterCtx) => {
        async function getRatingNumber(num: number, theme: Theme<unknown>, element: z.infer<typeof ProfileModule.SCHEMA>) {
            async function getRatingDigit(map: Buffer, digit: number, unitWidth: number, unitHeight: number) {
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
            async function getRatingDot(map: Buffer, unitWidth: number, unitHeight: number) {
                return await sharp(map)
                    .extract({
                        left: 2 * unitWidth,
                        top: 2 * unitHeight,
                        width: unitWidth,
                        height: unitHeight,
                    })
                    .toBuffer();
            }
            async function getRatingText(map: Buffer, unitWidth: number, unitHeight: number) {
                return await sharp(map)
                    .extract({
                        left: 0,
                        top: 3 * unitHeight,
                        width: unitWidth * 3,
                        height: unitHeight,
                    })
                    .toBuffer();
            }
            const map = (() => {
                switch (true) {
                    case painterCtx.type === "chunithm" && num < 13:
                    case painterCtx.type === "crystal" && num < 13:
                    case painterCtx.type === "new" && num < 13.25:
                    case painterCtx.type === "verse" && num < 13.25:
                        return theme.getFile(element.sprites.ratingNumberMap.bronze);
                    case painterCtx.type === "chunithm" && num < 14:
                    case painterCtx.type === "crystal" && num < 14:
                    case painterCtx.type === "new" && num < 14.5:
                    case painterCtx.type === "verse" && num < 14.5:
                        return theme.getFile(element.sprites.ratingNumberMap.silver);
                    case painterCtx.type === "chunithm" && num < 14.5:
                    case painterCtx.type === "crystal" && num < 14.5:
                    case painterCtx.type === "new" && num < 15.25:
                    case painterCtx.type === "verse" && num < 15.25:
                        return theme.getFile(element.sprites.ratingNumberMap.gold);
                    case painterCtx.type === "chunithm" && num < 15:
                    case painterCtx.type === "crystal" && num < 15:
                    case painterCtx.type === "new" && num < 16:
                    case painterCtx.type === "verse" && num < 16:
                        return theme.getFile(element.sprites.ratingNumberMap.platinum);
                    case painterCtx.type === "chunithm":
                    case painterCtx.type === "crystal":
                    case painterCtx.type === "new":
                    case painterCtx.type === "verse" && num < 17:
                        return theme.getFile(element.sprites.ratingNumberMap.rainbow);
                    case painterCtx.type === "verse":
                        return theme.getFile(element.sprites.ratingNumberMap.kiwami);
                    default:
                        return theme.getFile(element.sprites.ratingNumberMap.white);
                }
            })();
            const { width, height } = await sharp(map).metadata();
            if (!(width && height)) return { number: null, text: null };
            const unitWidth = width / 4,
                unitHeight = height / 4;
            const digits: {
                str: string;
                img: Buffer | null;
            }[] = await Promise.all(
                truncate(num, 2)
                    .padStart(5, " ")
                    .split("")
                    .map((v) => {
                        if (v === ".")
                            return getRatingDot(map, unitWidth, unitHeight).then((img) => {
                                return {
                                    str: v,
                                    img,
                                };
                            });
                        else if ("0" <= v && v <= "9")
                            return getRatingDigit(map, parseInt(v, 10), unitWidth, unitHeight).then((img) => {
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
                    }),
            );
            const canvas = new Canvas(unitWidth * digits.length, unitHeight);
            const ctx = canvas.getContext("2d");
            for (let i = 0, curx = 0; i < digits.length; ++i) {
                const curDigit = digits[i];
                if (!curDigit?.img) continue;
                const img = await safeLoadImage(curDigit.img);
                ctx.drawImage(img, curx, 0);
                if (curDigit.str === ".") {
                    curx += unitWidth * 0.4;
                } else {
                    curx += unitWidth * 0.7;
                }
            }
            return {
                number: canvas.toBuffer(),
                text: await getRatingText(map, unitWidth, unitHeight),
            };
        }
        return wrapContext(ctx, async () => {
            ctx.imageSmoothingEnabled = false;

            const { number: ratingNumberImg, text: ratingTextImg } = await getRatingNumber(painterCtx.rating, theme, element);

            const drawHeight = (element.height * 5) / 44;
            if (ratingTextImg) {
                const image = await safeLoadImage(ratingTextImg);
                const { width, height } = image;
                const aspectRatio = width / height;
                const drawWidth = drawHeight * aspectRatio;
                ctx.drawImage(image, element.height * (41 / 64), element.height * (82 / 128), drawWidth, drawHeight);
            }
            if (ratingNumberImg) {
                const image = await safeLoadImage(ratingNumberImg);
                const { width, height } = image;
                const aspectRatio = width / height;
                const drawWidth = drawHeight * aspectRatio;
                ctx.drawImage(image, element.height * (63 / 64), element.height * (81 / 128), drawWidth, drawHeight);
            }
        });
    };
    private drawUsername: typeof this.draw = async (ctx, _, element, painterCtx) => {
        return wrapBackground(
            ctx,
            "rgba(255, 255, 255, 0.45)",
            async () => {
                drawText(ctx, "Lv.", element.height * (43 / 64), element.height * (35 / 64), (element.height * 1) / 16, 0, {
                    textAlign: "left",
                    mainColor: "black",
                    borderColor: "black",
                    font: "standard-font-username",
                });
                drawText(ctx, "99", element.height * (49 / 64), element.height * (35 / 64), (element.height * 1) / 11, 0, {
                    textAlign: "left",
                    mainColor: "black",
                    borderColor: "black",
                    font: "standard-font-username",
                });

                drawText(ctx, toFullWidth(painterCtx.username), element.height * (57 / 64), element.height * (35 / 64), (element.height * 1) / 8, 0, {
                    maxWidth: element.height * (65 / 64),
                    textAlign: "left",
                    mainColor: "black",
                    borderColor: "black",
                    font: "chunithm-font-username",
                    widthConstraintType: "shrink",
                });
            },
            element.height * (21 / 32),
            element.height * (11 / 32),
            element.height * (85 / 64),
            element.height * (13 / 32),
            0,
        );
    };
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ProfileModule.SCHEMA>,
        painterCtx: ProfileModulePainterContext,
    ) {
        return wrapTranslate(ctx, element.x, element.y, async () => {
            await this.drawNameplate(ctx, theme, element, painterCtx);

            await this.drawProfilePicture(ctx, theme, element, painterCtx);

            await this.drawUsername(ctx, theme, element, painterCtx);

            await this.drawRating(ctx, theme, element, painterCtx);
        });
    }
}
