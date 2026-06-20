import * as adapter from "./lib/adapter";
import * as kamaiTachi from "./lib/adapter/kamaiTachi";
import * as lxns from "./lib/adapter/lxns";
import * as database from "./lib/database";
import * as types from "./lib/types";
import * as bests from "./painter/best";
import * as chart from "./painter/chart";

export namespace Chuni {
    export import Types = types;

    export import Database = database;

    export import ChunithmScoreAdapter = adapter.ChunithmScoreAdapter;
    export namespace Adapters {
        export import KamaiTachi = kamaiTachi.KamaiTachi;
        export import LXNS = lxns.LXNS;
    }

    export namespace Painters {
        export import Best50 = bests.Best50Painter;
        export import Chart = chart.ChartPainter;
    }
}
