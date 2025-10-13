import fs from "fs";
import upath from "upath";
import axios from "axios";
import { Cache } from "@maidraw/lib/cache";
import { Chuni } from "..";
import { EDifficulty } from "../type";
import { Logger } from "@maidraw/lib/logger";
// import { EDifficulty, IChart } from "@maidraw/type";

export class Database {
    private static readonly logger = new Logger([
        "maidraw",
        "chuni",
        "database",
    ]);

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
            promises.push(this.fetchJacket(id));
        }
        await Promise.all(promises);
    }
    public static async fetchJacket(id: number): Promise<Buffer | null> {
        const cacheKey = `chuni-jacket-${id}`;
        const cached = await this.cache.get(cacheKey);
        if (cached instanceof Buffer) {
            this.logger.trace(`GET Jacket-${id}, cache HIT`);
            return cached;
        } else {
            this.logger.trace(`GET Jacket-${id}, cache MISS`);
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
            "chunithm",
            "jackets",
            `${id.toString().padStart(4, "0")}.png`
        );
        if (fs.existsSync(localFilePath)) {
            this.logger.trace(`GET Jacket-${id}, database HIT`);
            return fs.readFileSync(localFilePath);
        }
        const beginTimestamp = Date.now();
        const res = await axios
            .get(`https://assets2.lxns.net/chunithm/jacket/${id}.png`, {
                responseType: "arraybuffer",
            })
            .then((res) => res.data)
            .catch((e) => null);
        const timeDifference = Date.now() - beginTimestamp;
        this.logger.trace(
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
            "chunithm",
            "charts",
            `${id.toString().padStart(4, "0")}`,
            `${difficulty}.json`
        );
        if (fs.existsSync(localFilePath)) {
            return JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
        }
        return null;
    }
    private static readonly allSongs: {
        songs: Database.IChart[];
        expire: number;
    } = {
        songs: [],
        expire: 0,
    };
    public static async getAllSongs(): Promise<Database.IChart[]> {
        if (Date.now() < this.allSongs.expire) return this.allSongs.songs;
        const cached = await this.cache.get("all-chunithm-songs");
        if (Array.isArray(cached)) {
            this.allSongs.songs = cached;
            this.allSongs.expire = Date.now() + 24 * 60 * 60 * 1000;
            return cached;
        }
        const localFolderPath = upath.join(
            this.localDatabasePath,
            "assets",
            "chunithm",
            "charts"
        );
        const chartFolders = fs.readdirSync(localFolderPath);
        const songs: Database.IChart[] = [];
        for (const folder of chartFolders) {
            const charts = fs.readdirSync(upath.join(localFolderPath, folder));
            for (const chart of charts) {
                const path = upath.join(localFolderPath, folder, chart);
                try {
                    songs.push(require(path));
                } catch {}
            }
        }
        await this.cache.put("all-chunithm-songs", songs, 1000 * 60 * 60 * 2);
        this.allSongs.songs = songs;
        this.allSongs.expire = Date.now() + 24 * 60 * 60 * 1000;
        return songs;
    }
    public static async findLocalChartWithNameAndLevel(
        name: string,
        level: number
    ) {
        const allSongs = await this.getAllSongs();
        const found = allSongs
            .filter((v) => v.name == name)
            .flatMap((v) =>
                v.events
                    .filter((v) => v.type == "existence")
                    .map((v1) => {
                        return {
                            level: v1.data.level,
                            chart: v,
                        };
                    })
                    .sort(
                        (a, b) =>
                            Math.abs(a.level - level) -
                            Math.abs(b.level - level)
                    )
                    .map((v) => v.chart)
            );
        return found.shift() || null;
    }
}
export namespace Database {
    export interface IChart {
        /**
         * Unique Chart ID, i.e. a 4 digit number-like string.
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
         * BPM(s, if multiple) of the song.
         */
        bpms: number[];
        /**
         * Difficulty category of the chart.
         */
        difficulty: EDifficulty;
        addVersion: IVersion;
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
                flick: number;
                air: number;
            };
        };
        /**
         * Events that happened to the chart in versions.
         */
        events: Events[];
        designer: string;
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
         * @example "CHUNITHM X-VERSE"
         */
        name: string;
        /**
         * Version number as it is used internally.
         * Formatted as `{major}.{minor}.{patch}`.
         */
        gameVersion: {
            major: number;
            minor: number;
            release?: number;
        };
    }
    export interface IEventVersion extends IVersion {
        gameVersion: {
            major: number;
            minor: number;
            release: number;
        };
        region: "JPN" | "INT" | "CHN";
    }
}
