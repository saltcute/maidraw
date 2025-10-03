import { Geki } from "@maidraw/geki";
import { IScore } from "@maidraw/geki/type";
import axios, { AxiosInstance } from "axios";

import { Cache } from "memory-cache";

export abstract class ScoreTrackerAdapter {
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
        const cacheKey = `${this.axios.defaults.baseURL}${endpoint}${
            data
                ? `-${JSON.stringify(data).substring(0, this.MAX_LOG_LENGTH)}`
                : ""
        }`;
        if (cacheTTL > 0) {
            const cacheContent = await this.cache.get(cacheKey);
            if (cacheContent) {
                Geki.logger.trace(
                    `GET ${endpoint}${
                        data
                            ? ` ${JSON.stringify(data).substring(
                                  0,
                                  this.MAX_LOG_LENGTH
                              )}`
                            : ""
                    }, cache HIT`
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
        Geki.logger.trace(
            `GET ${endpoint}${
                data
                    ? ` ${JSON.stringify(data).substring(
                          0,
                          this.MAX_LOG_LENGTH
                      )}`
                    : ""
            }, cache MISS, took ${timeDifference}ms`
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
        Geki.logger.trace(
            `POST ${endpoint}${
                data
                    ? ` ${JSON.stringify(data).substring(
                          0,
                          this.MAX_LOG_LENGTH
                      )}`
                    : ""
            }, took ${timeDifference}ms`
        );
        return res;
    }
    abstract getPlayerBest55(username: string): Promise<{
        recent: IScore[];
        new: IScore[];
        old: IScore[];
        best: IScore[];
    } | null>;
    abstract getPlayerBest60(username: string): Promise<{
        new: IScore[];
        old: IScore[];
        plat: IScore[];
        best: IScore[];
    } | null>;
    abstract getPlayerScore(
        username: string,
        chartId: number
    ): Promise<{
        basic: IScore | null;
        advanced: IScore | null;
        expert: IScore | null;
        master: IScore | null;
        lunatic: IScore | null;
    } | null>;
    abstract getPlayerInfo(
        username: string,
        type: "refresh" | "classic"
    ): Promise<{
        name: string;
        rating: number;
    } | null>;
    abstract getPlayerProfilePicture(username: string): Promise<Buffer | null>;
}
