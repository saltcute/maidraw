import * as bests from "./best50";
import * as chart from "./chart";
import Bunyan from "bunyan";

export class Maimai {
    public static logger = new Bunyan({
        name: "maidraw.maimai",
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
export namespace Maimai {
    export import Best50 = bests.Best50;
    export import Chart = chart.Chart;
}
