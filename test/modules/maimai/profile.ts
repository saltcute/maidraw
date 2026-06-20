import { ProfileModule } from "../../../src/maimai/painter/modules/profile";
import { best50Theme } from "../../utils/maimai/util";
import { moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(720, 116, false, async (canvas) => {
    const module = new ProfileModule();

    await module.draw(
        canvas.getContext("2d"),
        best50Theme,
        {
            type: "profile",
            x: 0,
            y: 0,
            height: 116,
            sprites: {
                dxRating: {
                    white: "../../versionless/dxRating/jp/white.webp",
                    blue: "../../versionless/dxRating/jp/blue.webp",
                    green: "../../versionless/dxRating/jp/green.webp",
                    yellow: "../../versionless/dxRating/jp/yellow.webp",
                    red: "../../versionless/dxRating/jp/red.webp",
                    purple: "../../versionless/dxRating/jp/purple.webp",
                    bronze: "../../versionless/dxRating/jp/bronze.webp",
                    silver: "../../versionless/dxRating/jp/silver.webp",
                    gold: "../../versionless/dxRating/jp/gold.webp",
                    platinum: "../../versionless/dxRating/jp/platinum.webp",
                    rainbow: "../../versionless/dxRating/jp/rainbow.webp",
                },
                dxRatingNumberMap: "../../versionless/dxRating/numberMap.webp",
                profile: {
                    nameplate: "../../versionless/nameplate.webp",
                    icon: "../../versionless/icon.webp",
                },
            },
        },
        { rating: 11451, username: "TestTTT☆♪" },
    );
    return canvas;
});
