import { Chuni } from "@maidraw/chu";
import { IScore } from "@maidraw/chu/type";
import axios, { AxiosInstance } from "axios";

import Bunyan from "bunyan";
import { Cache } from "memory-cache";

export default abstract class ScoreTrackerAdapter {
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
                Chuni.logger.trace(
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
        Chuni.logger.trace(
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
        Chuni.logger.trace(
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
