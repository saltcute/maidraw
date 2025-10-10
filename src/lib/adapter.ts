import axios, { AxiosInstance } from "axios";
import { Cache } from "./cache";
import { Logger } from "@maidraw/lib/logger";

export abstract class BaseScoreAdapter {
    private static _cache = new Cache();
    private readonly logger;
    protected get cache() {
        return BaseScoreAdapter._cache;
    }
    protected axios: AxiosInstance;
    constructor({
        baseURL,
        name,
    }: { baseURL?: string; name?: string | string[] } = {}) {
        this.axios = axios.create({ baseURL });
        this.logger = new Logger(name);
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
                this.logger.trace(
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
        this.logger.trace(
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
        this.logger.trace(
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
}
