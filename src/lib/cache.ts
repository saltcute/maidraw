import { Cache as MemCache } from "memory-cache";
import { createClient } from "redis";
import Util from "./util";
export class Cache {
    private logger = Util.buildLogger(["maidraw", "cache"]);

    private memCache;
    private redisClient;

    private isRedisAvailable = true;
    constructor() {
        this.memCache = new MemCache<string, any>();
        this.redisClient = createClient();
        this.redisClient.on("error", async (e) => {
            this.logger.error("Redis connection error, using memory-cache");
            this.isRedisAvailable = false;
            await this.redisClient.disconnect();
        });
        this.redisClient.connect();
    }
    async get(key: string) {
        if (this.isRedisAvailable) {
            const redisValue = await this.redisClient.get(key);
            if (redisValue) {
                try {
                    return JSON.parse(redisValue);
                } catch {
                    return Buffer.from(redisValue, "base64");
                }
            }
        } else return this.memCache.get(key);
    }
    async put(key: string, value: any, ttl: number) {
        if (this.isRedisAvailable) {
            if (Buffer.isBuffer(value)) {
                await this.redisClient.set(key, value.toString("base64"), {
                    EX: Math.trunc(ttl / 1000),
                });
            } else {
                await this.redisClient.set(key, JSON.stringify(value), {
                    EX: Math.trunc(ttl / 1000),
                });
            }
        } else this.memCache.put(key, value, ttl);
    }
}
