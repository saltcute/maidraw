import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import { getSafeImage, safeLoadImage } from "@common/utils/loadImage";
import { drawText } from "@common/utils/textDraw/drawText";
import { Canvas, type CanvasRenderingContext2D } from "canvas";
import Color from "color";
import sharp from "sharp";
import z from "zod/v4";

export interface ProfileModulePainterContext {
    username: string;
    rating: number;
    profilePicture?: Buffer;
    dxRatingType?: "dx" | "circleplus";
}

export class ProfileModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
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
                circleplus: z.object({
                    gold: z.string(),
                    platinum: z.string(),
                    rainbow: z.string(),
                    kiwami: z.string(),
                }),
            }),
            dxRatingStar: z.object({
                1: z.string(),
                2: z.string(),
                3: z.string(),
                4: z.string(),
            }),
            dxRatingNumberMap: z.string(),
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
        const profilePictureSize = element.height * 0.872;
        const profilePictureDimensions = [0, 0, profilePictureSize, profilePictureSize, profilePictureSize / 16] as const;
        return wrapTranslate(ctx, element.height * 0.064, element.height * 0.064, () =>
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
                                    element.height / 30,
                                    () => {},
                                    0,
                                    0,
                                    profilePictureSize,
                                    profilePictureSize,
                                    profilePictureSize / 16,
                                );
                            }
                        },
                        ...profilePictureDimensions,
                    ),
                ...profilePictureDimensions,
            ),
        );
    };
    private drawDxRating: typeof this.draw = async (ctx, theme, element, painterCtx) => {
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
            const map = await getSafeImage(theme.getFile(element.sprites.dxRatingNumberMap));
            const { width, height } = await sharp(map).metadata();
            if (!(width && height)) return null;
            const unitWidth = width / 4,
                unitHeight = height / 4;
            let digits: (Buffer | null)[] = [];
            while (num > 0) {
                digits.push(await getRatingDigit(map, num % 10, unitWidth, unitHeight));
                num = Math.trunc(num / 10);
            }
            while (digits.length < 5) digits.push(null);
            digits = digits.reverse();
            const canvas = new Canvas(unitWidth * digits.length, unitHeight);
            const ctx = canvas.getContext("2d");
            for (let i = 0; i < digits.length; ++i) {
                const curDigit = digits[i];
                if (!curDigit) continue;
                const img = await safeLoadImage(curDigit);
                ctx.drawImage(img, unitWidth * i * 0.89, 0);
            }
            return canvas.toBuffer();
        }
        const tiers = [
            [15000, element.sprites.dxRating.rainbow],
            [14500, element.sprites.dxRating.platinum],
            [14000, element.sprites.dxRating.gold],
            [13000, element.sprites.dxRating.silver],
            [12000, element.sprites.dxRating.bronze],
            [10000, element.sprites.dxRating.purple],
            [8000, element.sprites.dxRating.red],
            [6000, element.sprites.dxRating.yellow],
            [4000, element.sprites.dxRating.green],
            [2000, element.sprites.dxRating.blue],
        ] as const;
        const tiersCircleplus = [
            [16000, element.sprites.dxRating.circleplus.kiwami],
            [15000, element.sprites.dxRating.circleplus.rainbow],
            [14500, element.sprites.dxRating.circleplus.platinum],
            [14000, element.sprites.dxRating.circleplus.gold],
            [13000, element.sprites.dxRating.silver],
            [12000, element.sprites.dxRating.bronze],
            [10000, element.sprites.dxRating.purple],
            [8000, element.sprites.dxRating.red],
            [6000, element.sprites.dxRating.yellow],
            [4000, element.sprites.dxRating.green],
            [2000, element.sprites.dxRating.blue],
        ] as const;
        const tiersStars = [
            [16750, element.sprites.dxRatingStar[4]],
            [16500, element.sprites.dxRatingStar[3]],
            [16250, element.sprites.dxRatingStar[2]],
            [16000, element.sprites.dxRatingStar[1]],
            [15750, element.sprites.dxRatingStar[4]],
            [15500, element.sprites.dxRatingStar[3]],
            [15250, element.sprites.dxRatingStar[2]],
            [15000, element.sprites.dxRatingStar[1]],
            [14750, element.sprites.dxRatingStar[2]],
            [14500, element.sprites.dxRatingStar[1]],
            [14250, element.sprites.dxRatingStar[2]],
            [14000, element.sprites.dxRatingStar[1]],
        ] as const;
        await wrapTranslate(ctx, element.height, element.height * 0.064, async () => {
            const tier =
                (painterCtx.dxRatingType === "circleplus" ? tiersCircleplus : tiers).find(([min]) => painterCtx.rating >= min)?.[1] ??
                element.sprites.dxRating.white;
            const dxRating = await safeLoadImage(theme.getFile(tier));
            const { width, height } = dxRating;
            const aspectRatio = width / height;
            const dxRatingDrawHeight = element.height / 3;
            const dxRatingDrawWidth = dxRatingDrawHeight * aspectRatio;
            ctx.drawImage(dxRating, 0, 0, dxRatingDrawWidth, dxRatingDrawHeight);

            if (painterCtx.dxRatingType === "circleplus" && painterCtx.rating >= 14000) {
                const starTier = tiersStars.find(([min]) => painterCtx.rating >= min)?.[1] ?? element.sprites.dxRatingStar[1];
                const stars = await safeLoadImage(theme.getFile(starTier));
                const { width: starsWidth, height: starsHeight } = stars;
                const aspectRatio = starsWidth / starsHeight;
                const starsDrawHeight = element.height / 3;
                const starsDrawWidth = starsDrawHeight * aspectRatio;
                ctx.drawImage(stars, dxRatingDrawWidth * (616 / 664), 0, starsDrawWidth, starsDrawHeight);
            }
        });

        const ratingImgBuffer = await getRatingNumber(painterCtx.rating, theme, element);
        if (ratingImgBuffer) {
            const ratingImg = await safeLoadImage(ratingImgBuffer);
            const { width, height } = ratingImg;
            const aspectRatio = width / height;
            const drawHeight = (element.height * 11) / 64;
            ctx.drawImage(ratingImg, element.height * 1.785, element.height * 0.15, drawHeight * aspectRatio, drawHeight);
        }
    };
    private drawUsername: typeof this.draw = async (ctx, _theme, element, painterCtx) => {
        const dimension = [0, 0, ((element.height / 3) * 5.108 * 6) / 5, (element.height * 7) / 24, element.height / 20] as const;
        return wrapTranslate(ctx, element.height * (1 + 1 / 64), element.height * (0.064 + 0.333 + 1 / 32), () =>
            wrapBorder(
                ctx,
                Color.rgb(180, 180, 180).hex(),
                element.height / 32,
                () =>
                    wrapBackground(
                        ctx,
                        "white",
                        () => {
                            drawText(
                                ctx,
                                toFullWidth(painterCtx.username),
                                element.height * (1 / 64),
                                element.height * (7 / 32),
                                (element.height * 1) / 6,
                                0,
                                {
                                    maxWidth: ((element.height / 3) * 5.108 * 6) / 5,
                                    textAlign: "left",
                                    mainColor: "black",
                                    borderColor: "black",
                                    font: "standard-font-username",
                                    widthConstraintType: "shrink",
                                    shrinkAnchor: "center",
                                },
                            );
                        },
                        ...dimension,
                    ),
                ...dimension,
            ),
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

            await this.drawDxRating(ctx, theme, element, painterCtx);

            await this.drawUsername(ctx, theme, element, painterCtx);
        });
    }
}
