import Bunyan from "bunyan";

import * as bests from "./painter/best50";
import * as chart from "./painter/chart";

import * as database from "./lib/database";

import * as kamaiTachi from "./lib/adapter/kamaiTachi";

export class Geki {
    public static logger = new Bunyan({
        name: "maidraw.geki",
        streams: [
            {
                stream: process.stdout,
                level: (() => {
                    switch (process.env.LOG_LEVEL) {
                        case "trace":
                            return Bunyan.TRACE;
                        case "debug":
                            return Bunyan.DEBUG;
                        case "info":
                            return Bunyan.INFO;
                        case "warn":
                            return Bunyan.WARN;
                        case "error":
                            return Bunyan.ERROR;
                        case "fatal":
                            return Bunyan.FATAL;
                        default:
                            return Bunyan.INFO;
                    }
                })(),
            },
            {
                stream: process.stderr,
                level: Bunyan.ERROR,
            },
        ],
    });
}

export namespace Geki {
    export import Database = database.Database;

    export namespace Painters {
        export import Best50 = bests.Best50Painter;
        export import Chart = chart.ChartPainter;
    }
    export namespace Adapters {
        export import KamaiTachi = kamaiTachi.KamaiTachi;
    }
}
