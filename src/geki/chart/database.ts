import fs from "fs";
import upath from "upath";
import axios from "axios";
import { Cache } from "@maidraw/lib/cache";
import { Geki } from "..";
// import { EDifficulty, IChart } from "@maidraw/type";

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
        const cacheKey = `geki-jacket-${id}`;
        const cached = await this.cache.get(cacheKey);
        if (cached instanceof Buffer) {
            Geki.logger.trace(`GET Jacket-${id}, cache HIT`);
            return cached;
        } else {
            Geki.logger.trace(`GET Jacket-${id}, cache MISS`);
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
            Geki.logger.trace(`GET Jacket-${id}, database HIT`);
            return fs.readFileSync(localFilePath);
        }
        // const beginTimestamp = Date.now();
        // const res = await axios
        //     .get(`https://assets2.lxns.net/chunithm/jacket/${id}.png`, {
        //         responseType: "arraybuffer",
        //     })
        //     .then((res) => res.data)
        //     .catch((e) => null);
        // const timeDifference = Date.now() - beginTimestamp;
        // Chuni.logger.trace(
        //     `GET Jacket-${id}, database MISS, took ${timeDifference}ms`
        // );
        // return res;
        return null;
    }
    // public static getLocalChart(
    //     id: number,
    //     difficulty: EDifficulty
    // ): IChart | null {
    //     const localFilePath = upath.join(
    //         this.localDatabasePath,
    //         "assets",
    //         "maimai",
    //         "charts",
    //         `${id.toString().padStart(6, "0")}`,
    //         `${difficulty}.json`
    //     );
    //     if (fs.existsSync(localFilePath)) {
    //         return JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
    //     }
    //     return null;
    // }
}
