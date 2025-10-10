import Bunyan from "bunyan";

export class Logger extends Bunyan {
    constructor(name?: string | string[]) {
        if (typeof name === "undefined") {
            name = ["maidraw", "logger"];
        }
        if (name instanceof Array) {
            name = name.join(".");
        }
        super({
            name,
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
}
