import { ProfileModule } from "../../../src/chunithm/painter/modules/profile";
import { best50Theme } from "../../utils/chunithm/util";
import { moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(1000, 320 + 100, false, async (canvas) => {
    const module = new ProfileModule();

    await module.draw(
        canvas.getContext("2d"),
        best50Theme,
        {
            type: "profile",
            x: 50,
            y: 50,
            height: 320,
            sprites: {
                ratingNumberMap: {
                    white: "../../versionless/rating/numberMaps/white.webp",
                    bronze: "../../versionless/rating/numberMaps/bronze.webp",
                    silver: "../../versionless/rating/numberMaps/silver.webp",
                    gold: "../../versionless/rating/numberMaps/gold.webp",
                    platinum: "../../versionless/rating/numberMaps/platinum.webp",
                    rainbow: "../../versionless/rating/numberMaps/rainbow.webp",
                    kiwami: "../../versionless/rating/numberMaps/kiwami.webp",
                },
                profile: {
                    nameplate: "../../versionless/nameplate.webp",
                    icon: "../../versionless/icon.webp",
                },
            },
        },
        { rating: 17.45, username: "♪Lxns♪", type: "verse" },
    );
    return canvas;
});
