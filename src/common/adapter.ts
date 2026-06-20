import { Cache } from "@common/cache";
import { logger as globalLogger } from "@common/logger";
import axios, { type AxiosInstance } from "axios";

export abstract class BaseScoreAdapter {
    private static _cache = new Cache();
    protected get cache() {
        return BaseScoreAdapter._cache;
    }
    protected axios: AxiosInstance;
    protected logger;
    constructor({ baseUrl, name }: { baseUrl?: string; name?: string } = {}) {
        // biome-ignore lint/style/useNamingConvention: external library axios violates naming convention
        this.axios = axios.create({ baseURL: baseUrl });
        this.logger = globalLogger.child().withGroup(["maidraw", "adapter", name || "base-adapter"]);
    }
    private readonly maxLogLength = 1000;
    protected async get<T>(
        endpoint: string,
        data?: unknown,
        /**
         * Cache TTL in milliseconds. Defaults to 30 minutes.
         */
        cacheTtl: number = 30 * 60 * 1000,
        options: axios.AxiosRequestConfig = {},
    ): Promise<T | undefined> {
        const cacheKey = `${this.axios.defaults.baseURL}${endpoint}${data ? `-${JSON.stringify(data).substring(0, this.maxLogLength)}` : ""}`;
        if (cacheTtl > 0) {
            const cacheContent = await this.cache.get(cacheKey);
            if (cacheContent) {
                this.logger.trace(`GET ${endpoint}${data ? ` ${JSON.stringify(data).substring(0, this.maxLogLength)}` : ""}, cache HIT`);
                return cacheContent as T;
            }
        }
        const beginTimestamp = Date.now();
        const res = await this.axios
            .get(endpoint, { params: data, ...options })
            .then(async (r) => {
                if (cacheTtl > 0) {
                    await this.cache.put(cacheKey, r.data, cacheTtl);
                }
                return r.data;
            })
            .catch((e) => {
                return e.response?.data || e;
            });
        const timeDifference = Date.now() - beginTimestamp;
        this.logger.trace(
            `GET ${endpoint}${data ? ` ${JSON.stringify(data).substring(0, this.maxLogLength)}` : ""}, cache MISS, took ${timeDifference}ms`,
        );
        return res;
    }
    protected async post<T>(endpoint: string, data?: unknown): Promise<T | undefined> {
        const beginTimestamp = Date.now();
        const res = await this.axios
            .post(endpoint, data)
            .then((r) => r.data)
            .catch((e) => e.response?.data);
        const timeDifference = Date.now() - beginTimestamp;
        this.logger.trace(`POST ${endpoint}${data ? ` ${JSON.stringify(data).substring(0, this.maxLogLength)}` : ""}, took ${timeDifference}ms`);
        return res;
    }
}
