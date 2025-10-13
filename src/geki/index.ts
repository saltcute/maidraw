import Bunyan from "bunyan";

import * as bests from "./painter/best50";
import * as chart from "./painter/chart";

import * as database from "./lib/database";

import * as adapter from "./lib/adapter";
import * as kamaiTachi from "./lib/adapter/kamaiTachi";

import * as types from "./type";

export namespace Geki {
    export import Types = types;

    export import Database = database.Database;

    export import OngekiScoreAdapter = adapter.OngekiScoreAdapter;
    export namespace Adapters {
        export import KamaiTachi = kamaiTachi.KamaiTachi;
    }

    export namespace Painters {
        export import Best50 = bests.Best50Painter;
        export import Chart = chart.ChartPainter;
    }
}
