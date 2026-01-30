import * as geki from "./geki";
import * as chu from "./chu";
import * as mai from "./mai";

import * as adapter from "./lib/adapter";
import * as error from "./lib/error";

export namespace MaiDraw {
    export import Maimai = mai.Maimai;
    export import Chuni = chu.Chuni;
    export import Geki = geki.Geki;

    export import BaseScoreAdapter = adapter.BaseScoreAdapter;
    export import BaseError = error.BaseError;
}
