import { Cache as MemCache } from "memory-cache";
import { createClient } from "redis";
import { logger } from "./logger";
export class Cache<T> {
    private logger = logger.child().withGroup(["maidraw", "cache"]);

    private memCache;
    private redisClient;

    private isRedisAvailable = true;
    constructor() {
        this.memCache = new MemCache<string, T>();
        this.redisClient = createClient();
        this.redisClient.on("error", async () => {
            this.logger.error("Redis connection error, using memory-cache");
            this.isRedisAvailable = false;
            this.redisClient.destroy();
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
    async put(key: string, value: T, ttl: number) {
        if (this.isRedisAvailable) {
            if (Buffer.isBuffer(value)) {
                await this.redisClient.set(key, value.toString("base64"), {
                    expiration: {
                        type: "EX",
                        value: Math.trunc(ttl / 1000),
                    },
                });
            } else {
                await this.redisClient.set(key, JSON.stringify(value), {
                    expiration: {
                        type: "EX",
                        value: Math.trunc(ttl / 1000),
                    },
                });
            }
        } else this.memCache.put(key, value, ttl);
    }
}
