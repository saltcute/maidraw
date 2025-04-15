import { IScore } from "@maidraw/type";
import axios, { AxiosInstance } from "axios";
import { Cache as MemCache } from "memory-cache";
import { createClient } from "redis";

import Bunyan from "bunyan";

class Cache {
    private memCache;
    private redisClient;

    private isRedisAvailable = true;
    constructor() {
        this.memCache = new MemCache<string, any>();
        this.redisClient = createClient();
        this.redisClient.on("error", (e) => {
            console.error("Redis error", e);
            this.isRedisAvailable = false;
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
                    EX: Math.floor(ttl / 1000),
                });
            } else {
                await this.redisClient.set(key, JSON.stringify(value), {
                    EX: Math.floor(ttl / 1000),
                });
            }
        } else this.memCache.put(key, value, ttl);
    }
}

export default abstract class ScoreTrackerAdapter {
    protected logger = new Bunyan({
        name: "maidraw",
        streams: [
            {
                stream: process.stdout,
                level: (() => {
                    switch (process.env.LOG_LEVEL) {
                        case "trace":
                            return Bunyan.TRACE;
                        case "debug":
                            return Bunyan.DEBUG;
                        case "info":
                            return Bunyan.INFO;
                        case "warn":
                            return Bunyan.WARN;
                        case "error":
                            return Bunyan.ERROR;
                        case "fatal":
                            return Bunyan.FATAL;
                        default:
                            return Bunyan.INFO;
                    }
                })(),
            },
            {
                stream: process.stderr,
                level: Bunyan.ERROR,
            },
        ],
    });

    private static _cache = new Cache();
    protected get cache() {
        return ScoreTrackerAdapter._cache;
    }
    protected axios: AxiosInstance;
    constructor({ baseURL }: { baseURL?: string } = {}) {
        this.axios = axios.create({ baseURL });
    }
    private readonly MAX_LOG_LENGTH = 1000;
    protected async get<T>(
        endpoint: string,
        data?: any,
        /**
         * Cache TTL in milliseconds. Defaults to 30 minutes.
         */
        cacheTTL: number = 30 * 60 * 1000,
        options: axios.AxiosRequestConfig = {}
    ): Promise<T | undefined> {
        const cacheKey = `${this.axios.defaults.baseURL}${endpoint}${data ? `-${JSON.stringify(data).substring(0, this.MAX_LOG_LENGTH)}` : ""}`;
        if (cacheTTL > 0) {
            const cacheContent = await this.cache.get(cacheKey);
            if (cacheContent) {
                this.logger.trace(
                    `GET ${endpoint}${data ? ` ${JSON.stringify(data).substring(0, this.MAX_LOG_LENGTH)}` : ""}, cache HIT`
                );
                return cacheContent as T;
            }
        }
        const beginTimestamp = Date.now();
        const res = await this.axios
            .get(endpoint, { params: data, ...options })
            .then(async (r) => {
                if (cacheTTL > 0) {
                    await this.cache.put(cacheKey, r.data, cacheTTL);
                }
                return r.data;
            })
            .catch((e) => {
                return e.response?.data || e;
            });
        const timeDifference = Date.now() - beginTimestamp;
        this.logger.trace(
            `GET ${endpoint}${data ? ` ${JSON.stringify(data).substring(0, this.MAX_LOG_LENGTH)}` : ""}, cache MISS, took ${timeDifference}ms`
        );
        return res;
    }
    protected async post<T>(
        endpoint: string,
        data?: any
    ): Promise<T | undefined> {
        const beginTimestamp = Date.now();
        const res = await this.axios
            .post(endpoint, data)
            .then((r) => r.data)
            .catch((e) => e.response?.data);
        const timeDifference = Date.now() - beginTimestamp;
        this.logger.trace(
            `POST ${endpoint}${data ? ` ${JSON.stringify(data).substring(0, this.MAX_LOG_LENGTH)}` : ""}, took ${timeDifference}ms`
        );
        return res;
    }
    abstract getPlayerBest50(username: string): Promise<{
        new: IScore[];
        old: IScore[];
    } | null>;
    abstract getPlayerInfo(username: string): Promise<{
        name: string;
        rating: number;
    } | null>;
    abstract getPlayerProfilePicture(username: string): Promise<Buffer | null>;
}
