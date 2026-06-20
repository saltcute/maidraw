import { GlobalLogLevelManager } from "@loglayer/log-level-manager-global";
import { PinoTransport } from "@loglayer/transport-pino";
import { LogLayer, LogLevel } from "loglayer";
import { pino } from "pino";

const p = pino({
    level: "trace", // Enable all log levels
});

export const logger = new LogLayer({
    transport: new PinoTransport({
        logger: p,
    }),
}).withLogLevelManager(new GlobalLogLevelManager());

logger.setLevel(LogLevel.info);