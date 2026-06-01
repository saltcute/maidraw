import fs from "node:fs";
import { Cache } from "@maidraw/lib/cache";
import type { EDifficulty } from "@maidraw/mai/type";
import axios from "axios";
import upath from "upath";
import { Maimai } from "..";

let localDatabasePath: string = "";

export function setLocalDatabasePath(path: string) {
    localDatabasePath = path;
}

export function hasLocalDatabase() {
    return fs.existsSync(localDatabasePath);
}

const cache = new Cache();
export async function cacheJackets(ids: number[]) {
    const promises: Promise<unknown>[] = [];
    for (const id of ids) {
        promises.push(fetchJacket(id));
    }
    await Promise.all(promises);
}
export async function fetchJacket(
    id: number,
    /**
     * Explicit variant will NOT fallback to generic jacket.
     * In practice `DX` variant will almost never return a jacket.
     */
    variant?: "DX" | "EX" | "CN",
): Promise<Buffer | null> {
    const cacheKey = `maimai-jacket-${id}${variant ? `-${variant}` : ""}`;
    const cached = await cache.get(cacheKey);
    if (cached instanceof Buffer) {
        Maimai.logger.trace(
            `GET Jacket-${id}${variant ? `-${variant}` : ""}, cache HIT`,
        );
        return cached;
    } else {
        Maimai.logger.trace(
            `GET Jacket-${id}${variant ? `-${variant}` : ""}, cache MISS`,
        );
        const jacket = await downloadJacket(id, variant);
        if (jacket) cache.put(cacheKey, jacket, 1000 * 60 * 60);
        return jacket;
    }
}
export async function downloadJacket(
    id: number,
    /**
     * Explicit variants will fallback to generic jacket.
     */
    variant?: "DX" | "EX" | "CN",
): Promise<Buffer | null> {
    id = id % 10000;
    if (variant) {
        const localFilePath = upath.join(
            localDatabasePath,
            "assets",
            "maimai",
            "jackets",
            `${id.toString().padStart(6, "0")}-${variant}.png`,
        );
        if (fs.existsSync(localFilePath)) {
            Maimai.logger.trace(`GET Jacket-${id}-${variant}, database HIT`);
            return fs.readFileSync(localFilePath);
        }
    }
    const localFilePath = upath.join(
        localDatabasePath,
        "assets",
        "maimai",
        "jackets",
        `${id.toString().padStart(6, "0")}.png`,
    );
    if (fs.existsSync(localFilePath)) {
        Maimai.logger.trace(`GET Jacket-${id}, database HIT`);
        return fs.readFileSync(localFilePath);
    }
    if (!variant) {
        const beginTimestamp = Date.now();
        const res = await axios
            .get(`https://assets2.lxns.net/maimai/jacket/${id}.png`, {
                responseType: "arraybuffer",
            })
            .then((res) => res.data)
            .catch(() => null);
        const timeDifference = Date.now() - beginTimestamp;
        Maimai.logger.trace(
            `GET Jacket-${id}, database MISS, took ${timeDifference}ms`,
        );
        return res;
    }
    return null;
}
export function getLocalChart(
    id: number,
    difficulty: EDifficulty,
): IChart | null {
    const localFilePath = upath.join(
        localDatabasePath,
        "assets",
        "maimai",
        "charts",
        `${id.toString().padStart(6, "0")}`,
        `${difficulty}.json`,
    );
    if (fs.existsSync(localFilePath)) {
        return JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
    }
    return null;
}
const allSongs: {
    songs: IChart[];
    expire: number;
} = {
    songs: [],
    expire: 0,
};
export async function getAllSongs(): Promise<IChart[]> {
    if (Date.now() < allSongs.expire) return allSongs.songs;
    const cached = await cache.get("all-maimai-songs");
    if (Array.isArray(cached)) {
        allSongs.songs = cached;
        allSongs.expire = Date.now() + 24 * 60 * 60 * 1000;
        return cached;
    }
    const localFolderPath = upath.join(
        localDatabasePath,
        "assets",
        "maimai",
        "charts",
    );
    const chartFolders = fs.readdirSync(localFolderPath);
    const songs: IChart[] = [];
    for (const folder of chartFolders) {
        const charts = fs.readdirSync(upath.join(localFolderPath, folder));
        for (const chart of charts) {
            const path = upath.join(localFolderPath, folder, chart);
            try {
                songs.push(require(path));
            } catch {}
        }
    }
    await cache.put("all-maimai-songs", songs, 1000 * 60 * 60 * 2);
    allSongs.songs = songs;
    allSongs.expire = Date.now() + 24 * 60 * 60 * 1000;
    return songs;
}
export async function findLocalChartWithNameAndLevel(
    name: string,
    level: number,
    isDX: boolean,
) {
    const allSongs = await getAllSongs();
    const found = allSongs
        .filter(
            (v) =>
                v.name === name &&
                (isDX ? 10000 < v.id && v.id < 100000 : v.id < 10000),
        )
        .sort((a, b) => Math.abs(a.level - level) - Math.abs(b.level - level));
    return found.shift() || null;
}

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
    export interface USALock extends Base {
        type: "usa_lock";
    }
}
export type Events =
    | Events.Existence
    | Events.Absence
    | Events.Removal
    | Events.USALock;
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
