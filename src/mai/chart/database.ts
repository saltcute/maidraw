import fs from "fs";
import upath from "upath";
import axios from "axios";
import { Cache } from "@maidraw/lib/cache";
import { EDifficulty } from "@maidraw/mai/type";
import { Maimai } from "..";

export class Database {
    private static localDatabasePath: string = "";

    public static setLocalDatabasePath(path: string) {
        this.localDatabasePath = path;
    }

    public static hasLocalDatabase() {
        return fs.existsSync(this.localDatabasePath);
    }

    private static cache = new Cache();
    public static async cacheJackets(ids: number[]) {
        const promises: Promise<any>[] = [];
        for (const id of ids) {
            promises.push(this.fecthJacket(id));
        }
        await Promise.all(promises);
    }
    public static async fecthJacket(id: number): Promise<Buffer | null> {
        const cacheKey = `maimai-jacket-${id}`;
        const cached = await this.cache.get(cacheKey);
        if (cached instanceof Buffer) {
            Maimai.logger.trace(`GET Jacket-${id}, cache HIT`);
            return cached;
        } else {
            Maimai.logger.trace(`GET Jacket-${id}, cache MISS`);
            const jacket = await this.downloadJacket(id);
            if (jacket) this.cache.put(cacheKey, jacket, 1000 * 60 * 60);
            return jacket;
        }
    }
    public static async downloadJacket(id: number): Promise<Buffer | null> {
        id = id % 10000;
        const localFilePath = upath.join(
            this.localDatabasePath,
            "assets",
            "maimai",
            "jackets",
            `${id.toString().padStart(6, "0")}.png`
        );
        if (fs.existsSync(localFilePath)) {
            Maimai.logger.trace(`GET Jacket-${id}, database HIT`);
            return fs.readFileSync(localFilePath);
        }
        const beginTimestamp = Date.now();
        const res = await axios
            .get(`https://assets2.lxns.net/maimai/jacket/${id}.png`, {
                responseType: "arraybuffer",
            })
            .then((res) => res.data)
            .catch((e) => null);
        const timeDifference = Date.now() - beginTimestamp;
        Maimai.logger.trace(
            `GET Jacket-${id}, database MISS, took ${timeDifference}ms`
        );
        return res;
    }
    public static getLocalChart(
        id: number,
        difficulty: EDifficulty
    ): Database.IChart | null {
        const localFilePath = upath.join(
            this.localDatabasePath,
            "assets",
            "maimai",
            "charts",
            `${id.toString().padStart(6, "0")}`,
            `${difficulty}.json`
        );
        if (fs.existsSync(localFilePath)) {
            return JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
        }
        return null;
    }
}
export namespace Database {
    export interface IChart {
        /**
         * Unique Chart ID, i.e. a 6 digit number-like string.
         * @example "001451" for Transcended Light standard. (Does not actually exist)
         * @example "011451" for Transcended Light DX.
         * @example "011804" for How To Make 音ゲ～曲！DX.
         */
        id: number;
        /**
         * Name of the song.
         */
        name: string;
        /**
         * Name of the artist.
         */
        artist: string;
        /**
         * BPM of the song.
         */
        bpm: number;
        /**
         * Difficulty category of the chart.
         */
        difficulty: EDifficulty;
        /**
         * Internal level of the chart as found in the latest version available.
         */
        level: number;
        addVersion: {
            DX?: IVersion;
            EX?: IVersion;
            CN?: IVersion;
        };
        /**
         * Metadata of the chart.
         */
        meta: {
            /**
             * Note count of the chart.
             */
            notes: {
                tap: number;
                hold: number;
                slide: number;
                touch: number;
                break: number;
            };
            maxDXScore: number;
        };
        /**
         * Events that happened to the chart in versions.
         */
        events: Events[];
        designer: {
            id: number;
            name: string;
        };
    }
    export namespace Events {
        interface Base {
            type: string;
            data?: any;
            version: IEventVersion;
        }
        export interface Existence extends Base {
            type: "existence";
            data: {
                level: number;
            };
        }
        export interface Absence extends Base {
            type: "absence";
        }
        export interface Removal extends Base {
            type: "removal";
        }
    }
    export type Events = Events.Existence | Events.Absence | Events.Removal;
    export interface IVersion {
        /**
         * Full name of the version.
         * @example "maimai でらっくす PRiSM PLUS"
         */
        name: string;
        /**
         * Version number as it is used internally.
         * Formatted as `{major}.{minor}.{patch}`.
         *
         * @example "1.55.0" for "1.55"
         * @example "1.41.7" for "1.41-G"
         */
        gameVersion: {
            isDX: boolean;
            major: number;
            minor: number;
            release?: number;
        };
    }
    export interface IEventVersion extends IVersion {
        gameVersion: {
            isDX: boolean;
            major: number;
            minor: number;
            release: number;
        };
        region: "DX" | "EX" | "CN";
    }
}
