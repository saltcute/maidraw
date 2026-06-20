import { TextModule } from "../../../src/common/painter/modules/text";
import { Painter } from "../../../src/common/painter/painter";
import { best50Theme, moduleTestWrapper } from "../../util";

moduleTestWrapper(828, 168, false, async (canvas) => {
    const module = new TextModule();

    Painter.registerFonts("assets");

    await module.draw(canvas.getContext("2d"), best50Theme, {
        type: "text",
        size: 32,
        x: 4,
        y: 32,
        borderColor: "#ff1a82",
        align: "left",
        content: "Tést　ｓｔｒing123４５６あいうえおｱｲｳｴｵ☆♪ yBjfo0\nHello123 我是可爱的小落雪 门 虾 憂鬱 烏龜",
    });
    await module.draw(canvas.getContext("2d"), best50Theme, {
        type: "text",
        size: 64,
        x: 4,
        y: 146,
        borderColor: "#ff1a82",
        align: "left",
        content: "ｱｲｳｴｵ☆♪yBjfo0憂鬱 烏龜",
    });
    return canvas;
});
