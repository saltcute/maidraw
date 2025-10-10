import Bunyan from "bunyan";

import * as database from "./lib/database";

import * as chart from "./painter/chart";
import * as bests from "./painter/best50";
import * as level50 from "./painter/level50";

import * as adapter from "./lib/adapter";
import * as lxns from "./lib/adapter/lxns";
import * as maishift from "./lib/adapter/maishift";
import * as divingFish from "./lib/adapter/divingFish";
import * as kamaiTachi from "./lib/adapter/kamaiTachi";

import * as types from "./type";
import { Logger } from "@maidraw/lib/logger";

export class Maimai {
    public static logger = new Logger(["maidraw", "maimai"]);
}
export namespace Maimai {
    export import Types = types;

    export import Database = database.Database;

    export import MaimaiScoreAdapter = adapter.MaimaiScoreAdapter;
    export namespace Adapters {
        export import LXNS = lxns.LXNS;
        export import KamaiTachi = kamaiTachi.KamaiTachi;
        export import DivingFish = divingFish.DivingFish;
        export import Maishift = maishift.Maishift;
    }

    export namespace Painters {
        export import Best50 = bests.Best50Painter;
        export import Level50 = level50.Level50Painter;
        export import Chart = chart.ChartPainter;
    }
}
