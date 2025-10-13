import Bunyan from "bunyan";

import * as database from "./lib/database";

import * as chart from "./painter/chart";
import * as bests from "./painter/best50";

import * as adapter from "./lib/adapter";
import * as lxns from "./lib/adapter/lxns";
import * as kamaiTachi from "./lib/adapter/kamaiTachi";

import * as types from "./type";

export namespace Chuni {
    export import Types = types;

    export import Database = database.Database;

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
