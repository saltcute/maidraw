import { Painter } from "@common/painter/painter";
import { ProfileModule } from "@ongeki/painter/modules/profile";
import { envChoice, envNumber, envString } from "@utils/env";
import { best50Theme, getElement } from "@utils/ongeki/util";
import { moduleTestWrapper } from "@utils/util";

moduleTestWrapper(best50Theme.content.width, best50Theme.content.height, false, async (canvas) => {
    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));

    const module = new ProfileModule();

    await module.draw(canvas.getContext("2d"), best50Theme, getElement(best50Theme, "profile"), {
        username: envString("TEST_USERNAME", "♪Lxns♪"),
        rating: envNumber("TEST_RATING", 22.67),
        type: envChoice("TEST_TYPE", ["refresh", "classic"], "refresh"),
    });
    return canvas;
});
