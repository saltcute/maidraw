import { HitokotoModule } from "@common/painter/modules/hitokoto";
import { Painter } from "@common/painter/painter";
import { envNumber, envString } from "@utils/env";
import { best50Theme } from "@utils/maimai/util";
import { moduleTestWrapper } from "@utils/util";

moduleTestWrapper(70 * 12, 9 * 12, false, async (canvas) => {
    const module = new HitokotoModule();

    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));

    await module.draw(canvas.getContext("2d"), best50Theme, {
        type: "hitokoto",
        size: 32,
        x: 4,
        y: 32,
        borderColor: "#ff1a82",
        align: "left",
        probability: envNumber("TEST_HITOKOTO_PROBABILITY", 1),
        width: 70 * 12,
        linebreak: true,
        customLines: ["../../../../../hitokoto/general.json", "../../../../../hitokoto/support/maimaidx.json"],
    });
    return canvas;
});
