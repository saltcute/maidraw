import { HitokotoModule } from "../../../src/common/painter/modules/hitokoto";
import { Painter } from "../../../src/common/painter/painter";
import { best50Theme, moduleTestWrapper } from "../../util";

moduleTestWrapper(70 * 12, 9 * 12, false, async (canvas) => {
    const module = new HitokotoModule();

    Painter.registerFonts("assets");

    await module.draw(canvas.getContext("2d"), best50Theme, {
        type: "hitokoto",
        size: 32,
        x: 4,
        y: 32,
        borderColor: "#ff1a82",
        align: "left",
        probability: 1,
        width: 70 * 12,
        linebreak: true,
        customLines: ["../../../../../hitokoto/general.json", "../../../../../hitokoto/support/maimaidx.json"],
    });
    return canvas;
});
