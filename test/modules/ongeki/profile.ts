import { Painter } from "../../../src/common/painter/painter";
import { ProfileModule } from "../../../src/ongeki/painter/modules/profile";
import { best50Theme, getElement } from "../../utils/ongeki/util";
import { moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(best50Theme.content.width, best50Theme.content.height, false, async (canvas) => {
    Painter.registerFonts("assets");

    const module = new ProfileModule();

    await module.draw(canvas.getContext("2d"), best50Theme, getElement(best50Theme, "profile"), {
        username: "♪Lxns♪",
        rating: 22.67,
        type: "refresh",
    });
    return canvas;
});
