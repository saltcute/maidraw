import { TextModule } from "@common/painter/modules/text";
import { Painter } from "@common/painter/painter";
import { moduleTestWrapper } from "@utils/util";

moduleTestWrapper(828, 1150, false, async (canvas) => {
    const module = new TextModule();

    Painter.registerFonts("assets");

    await module.draw(canvas.getContext("2d"), undefined, {
        type: "text",
        size: 32,
        x: 4,
        y: 32,
        borderColor: "#ff1a82",
        align: "left",
        content: "Tést　ｓｔｒing123４５６あいうえおｱｲｳｴｵ☆♪ yBjfo0\nHello123 我是可爱的小落雪 门 虾 憂鬱 烏龜",
    });
    await module.draw(canvas.getContext("2d"), undefined, {
        type: "text",
        size: 64,
        x: 4,
        y: 146,
        borderColor: "#ff1a82",
        align: "left",
        content: "ｱｲｳｴｵ☆♪yBjfo0憂鬱 烏龜",
    });
    for (const [index, content] of ["Supercalifragilisticexpialidocious", "👩‍👩‍👧‍👦e\u0301😀", "First\r\n\r\nFourth\u2028Fifth"].entries()) {
        await module.draw(canvas.getContext("2d"), undefined, {
            type: "text",
            size: 20,
            x: 4 + index * 250,
            y: 210,
            width: index === 2 ? 220 : 5,
            linebreak: true,
            content,
        });
    }
    return canvas;
});
