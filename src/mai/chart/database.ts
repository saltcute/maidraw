import fs from "fs";
import upath from "upath";
import axios from "axios";
import { Cache } from "memory-cache";
import { EDifficulty, IChart } from "@maidraw/type";

export class Database {
    private static localDatabasePath: string = "";

    public static setLocalDatabasePath(path: string) {
        this.localDatabasePath = path;
    }

    public static hasLocalDatabase() {
        return fs.existsSync(this.localDatabasePath);
    }

    private static cache = new Cache<string, Buffer>();
    public static async cacheJackets(ids: number[]) {
        const promises: Promise<any>[] = [];
        for (const id of ids) {
            promises.push(this.fecthJacket(id));
        }
        await Promise.all(promises);
    }
    public static async fecthJacket(id: number): Promise<Buffer | null> {
        const cached = this.cache.get(`jacket-${id}`);
        if (cached) return cached;
        else {
            const jacket = await this.downloadJacket(id);
            if (jacket) this.cache.put(`jacket-${id}`, jacket, 1000 * 60 * 60);
            return jacket;
        }
    }
    public static async downloadJacket(id: number): Promise<Buffer | null> {
        if (id > 10000) id -= 10000;
        const localFilePath = upath.join(
            this.localDatabasePath,
            "assets",
            "jackets",
            `${id.toString().padStart(6, "0")}.png`
        );
        if (fs.existsSync(localFilePath)) {
            return fs.readFileSync(localFilePath);
        }
        // return null;
        // console.log(`Downloading jacket ${id}`);
        return await axios
            .get(`https://assets2.lxns.net/maimai/jacket/${id}.png`, {
                responseType: "arraybuffer",
            })
            .then((res) => res.data)
            .catch((e) => null);
    }
    public static getLocalChart(
        id: number,
        difficulty: EDifficulty
    ): IChart | null {
        const localFilePath = upath.join(
            this.localDatabasePath,
            "assets",
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
