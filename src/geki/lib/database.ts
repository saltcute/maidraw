import fs from "node:fs";
import { Cache } from "@maidraw/lib/cache";
import upath from "upath";
import { Geki } from "..";
import type { EDifficulty } from "../type";

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
export async function fetchJacket(id: number): Promise<Buffer | null> {
    const cacheKey = `geki-jacket-${id}`;
    const cached = await cache.get(cacheKey);
    if (cached instanceof Buffer) {
        Geki.logger.trace(`GET Jacket-${id}, cache HIT`);
        return cached;
    } else {
        Geki.logger.trace(`GET Jacket-${id}, cache MISS`);
        const jacket = await downloadJacket(id);
        if (jacket) cache.put(cacheKey, jacket, 1000 * 60 * 60);
        return jacket;
    }
}
export async function downloadJacket(id: number): Promise<Buffer | null> {
    id = id % 10000;
    const localFilePath = upath.join(
        localDatabasePath,
        "assets",
        "ongeki",
        "jackets",
        `${id.toString().padStart(4, "0")}.png`,
    );
    if (fs.existsSync(localFilePath)) {
        Geki.logger.trace(`GET Jacket-${id}, database HIT`);
        return fs.readFileSync(localFilePath);
    }
    return null;
}
export function getLocalChart(id: number, difficulty: EDifficulty) {
    const localFilePath = upath.join(
        localDatabasePath,
        "assets",
        "ongeki",
        "charts",
        `${id.toString().padStart(4, "0")}`,
        `${difficulty}.json`,
    );
    if (fs.existsSync(localFilePath)) {
        return JSON.parse(fs.readFileSync(localFilePath, "utf-8")) as IChart;
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
    const cached = await cache.get("all-ongeki-songs");
    if (Array.isArray(cached)) {
        allSongs.songs = cached;
        allSongs.expire = Date.now() + 24 * 60 * 60 * 1000;
        return cached;
    }
    const localFolderPath = upath.join(
        localDatabasePath,
        "assets",
        "ongeki",
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
    await cache.put("all-ongeki-songs", songs, 1000 * 60 * 60 * 2);
    allSongs.songs = songs;
    allSongs.expire = Date.now() + 24 * 60 * 60 * 1000;
    return songs;
}
export async function findLocalChartWithNameAndLevel(
    name: string,
    level: number,
) {
    const allSongs = await getAllSongs();
    const found = allSongs
        .filter((v) => v.name === name)
        .flatMap((v) =>
            v.events
                .filter((v) => v.type === "existence")
                .map((v1) => {
                    return {
                        level: v1.data.level,
                        chart: v,
                    };
                })
                .sort(
                    (a, b) =>
                        Math.abs(a.level - level) - Math.abs(b.level - level),
                )
                .map((v) => v.chart),
        );
    return found.shift() || null;
}
export async function getCardImage(id: number): Promise<Buffer | null> {
    const cacheKey = `geki-card-${id}`;
    const cached = await cache.get(cacheKey);
    if (cached instanceof Buffer) {
        Geki.logger.trace(`GET Card-${id}-image, cache HIT`);
        return cached;
    } else {
        Geki.logger.trace(`GET Card-${id}-image, cache MISS`);
        const localFilePath = upath.join(
            localDatabasePath,
            "assets",
            "ongeki",
            "cards",
            "images",
            `${id.toString().padStart(6, "0")}.png`,
        );
        if (fs.existsSync(localFilePath)) {
            Geki.logger.trace(`GET Card-${id}-image, database HIT`);
            const card = fs.readFileSync(localFilePath);
            if (card) cache.put(cacheKey, card, 5 * 60 * 60);
            return card;
        }
    }
    return null;
}

export function getLocalCard(id: number): ICard | null {
    const localFilePath = upath.join(
        localDatabasePath,
        "assets",
        "ongeki",
        "cards",
        id.toString().padStart(6, "0"),
        `${id.toString().padStart(6, "0")}.json`,
    );
    if (fs.existsSync(localFilePath)) {
        return JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
    }
    return null;
}
export function getLocalCharacter(id: number): ICharacter | null {
    const localFilePath = upath.join(
        localDatabasePath,
        "assets",
        "ongeki",
        "characters",
        id.toString().padStart(6, "0"),
        `${id.toString().padStart(6, "0")}.json`,
    );
    if (fs.existsSync(localFilePath)) {
        return JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
    }
    return null;
}

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
     * BPM of the song.
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
            side: number;
            flick: number;
            bell: number;
        };
        maxPlatinumScore: number;
        boss: {
            card: {
                id: number;
                name: string;
            };
            character: {
                rarity: string;
                name: string;
                comment?: string;
            };
            level: number;
        };
        isLunatic: boolean;
        reMaster?: {
            standard: number;
            real: number;
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
        data?: unknown;
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
     * @example "オンゲキ Re:Fresh"
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
    region: "JPN";
}
export enum EBloodType {
    A = "A",
    B = "B",
    O = "O",
    AB = "AB",
}
export interface ICharacter {
    id: number;
    name: string;
    voiceLines: string[];
    bloodType: EBloodType;
    personality?: string;
    height: number;
}
export interface ICard {
    id: number;
    name: string;
    rarity: string;
    characterId: number;
    attribute: string;
}
