import fs from "fs";
import upath from "upath";
import { Cache } from "@maidraw/lib/cache";
import { Geki } from "..";
import { EDifficulty } from "../type";
import { Logger } from "@maidraw/lib/logger";

export class Database {
    private static readonly logger = new Logger([
        "maidraw",
        "geki",
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
        const cacheKey = `geki-jacket-${id}`;
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
            "ongeki",
            "jackets",
            `${id.toString().padStart(4, "0")}.png`
        );
        if (fs.existsSync(localFilePath)) {
            this.logger.trace(`GET Jacket-${id}, database HIT`);
            return fs.readFileSync(localFilePath);
        }
        return null;
    }
    public static getLocalChart(
        id: number,
        difficulty: EDifficulty
    ): Database.IChart | null {
        const localFilePath = upath.join(
            this.localDatabasePath,
            "assets",
            "ongeki",
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
        const cached = await this.cache.get("all-ongeki-songs");
        if (Array.isArray(cached)) {
            this.allSongs.songs = cached;
            this.allSongs.expire = Date.now() + 24 * 60 * 60 * 1000;
            return cached;
        }
        const localFolderPath = upath.join(
            this.localDatabasePath,
            "assets",
            "ongeki",
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
        await this.cache.put("all-ongeki-songs", songs, 1000 * 60 * 60 * 2);
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
    public static async getCardImage(id: number): Promise<Buffer | null> {
        const cacheKey = `geki-card-${id}`;
        const cached = await this.cache.get(cacheKey);
        if (cached instanceof Buffer) {
            this.logger.trace(`GET Card-${id}-image, cache HIT`);
            return cached;
        } else {
            this.logger.trace(`GET Card-${id}-image, cache MISS`);
            const localFilePath = upath.join(
                this.localDatabasePath,
                "assets",
                "ongeki",
                "cards",
                "images",
                `${id.toString().padStart(6, "0")}.png`
            );
            if (fs.existsSync(localFilePath)) {
                this.logger.trace(`GET Card-${id}-image, database HIT`);
                const card = fs.readFileSync(localFilePath);
                if (card) this.cache.put(cacheKey, card, 5 * 60 * 60);
                return card;
            }
        }
        return null;
    }

    public static getLocalCard(id: number): Database.ICard | null {
        const localFilePath = upath.join(
            this.localDatabasePath,
            "assets",
            "ongeki",
            "cards",
            id.toString().padStart(6, "0"),
            `${id.toString().padStart(6, "0")}.json`
        );
        if (fs.existsSync(localFilePath)) {
            return JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
        }
        return null;
    }
    public static getLocalCharacter(id: number): Database.ICharacter | null {
        const localFilePath = upath.join(
            this.localDatabasePath,
            "assets",
            "ongeki",
            "characters",
            id.toString().padStart(6, "0"),
            `${id.toString().padStart(6, "0")}.json`
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
            maxPlatinumScore: number;
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
}
