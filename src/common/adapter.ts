import { createHash, randomUUID } from "node:crypto";
import { Cache } from "@saltcute/cache";
import { globalLogger } from "@saltcute/logger";
import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

// Axios accepts the effective configuration at runtime, but omits it from its declaration.
const getTransport: (adapters: Parameters<typeof axios.getAdapter>[0], config: axios.InternalAxiosRequestConfig) => axios.AxiosAdapter =
    axios.getAdapter;

const cachedResponseSchema = z.object({
    data: z.string(),
    status: z.number(),
    statusText: z.string(),
    headers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()])),
});
type CachedResponse = z.infer<typeof cachedResponseSchema>;

export abstract class BaseScoreAdapter {
    protected cache;
    protected axios: AxiosInstance;
    protected logger;
    constructor({ baseUrl, name }: { baseUrl?: string; name?: string } = {}) {
        // biome-ignore lint/style/useNamingConvention: external library axios violates naming convention
        this.axios = axios.create({ baseURL: baseUrl });
        this.logger = globalLogger.child().withPrefix(`[${["maidraw", "adapter", name || "base-adapter"].join("/")}]`);
        this.cache = new Cache(["maidraw", "adapter", name || "base-adapter"].join("/"));
    }
    private readonly maxLogLength = 1000;
    private readonly cachePartition = randomUUID();
    /**
     * Cacheable requests that are waiting for a response, by cache key.
     */
    private readonly inflight = new Map<string, Promise<CachedResponse | undefined>>();

    private getCacheKey(config: axios.InternalAxiosRequestConfig): string | undefined {
        // These hooks run before/after the transport; cache the raw transport response.
        const { adapter, transformRequest, transformResponse, env, headers, ...request } = config;
        if (typeof adapter === "function" || config.responseType === "stream") return;
        if (env && Object.entries(env).some(([key, value]) => value !== Reflect.get(axios.defaults.env ?? {}, key))) return;
        if (config.validateStatus !== axios.defaults.validateStatus) return;
        const { validateStatus, ...identity } = request;
        try {
            // Reject callbacks, agents, signals, streams, and other opaque state rather
            // than silently dropping it from the identity. Log truncation never applies here.
            const seen = new WeakSet<object>();
            function encode(value: unknown): unknown {
                if (value === undefined) return ["undefined"];
                if (value === null || typeof value === "string" || typeof value === "boolean") return value;
                if (typeof value === "number" && Number.isFinite(value)) return value;
                if (typeof value !== "object" || value === null || seen.has(value)) {
                    throw new TypeError("Unsupported request configuration");
                }
                seen.add(value);
                if (Array.isArray(value)) return ["array", Array.from(value, encode)];
                const prototype = Object.getPrototypeOf(value);
                if (prototype !== Object.prototype && prototype !== null) throw new TypeError("Opaque request configuration");
                return ["object", Object.entries(value).map(([key, entry]) => [key, encode(entry)])];
            }
            const serialized = JSON.stringify(encode({ ...identity, headers: headers.toJSON() }));
            return `${this.cachePartition}:${createHash("sha256").update(serialized).digest("hex")}`;
        } catch {
            return undefined;
        }
    }
    protected async get<T>(
        endpoint: string,
        data?: unknown,
        /**
         * Cache TTL in milliseconds. Defaults to 30 minutes.
         */
        cacheTtl: number = 30 * 60 * 1000,
        options: axios.AxiosRequestConfig = {},
    ): Promise<T | undefined> {
        const beginTimestamp = Date.now();
        let cacheHit = false;
        const transport = options.adapter ?? this.axios.defaults.adapter;
        const res = await this.axios
            .get(endpoint, {
                params: data,
                ...options,
                adapter: async (config) => {
                    // Axios has applied defaults, request interceptors, and transforms.
                    const request = { ...config, adapter: transport };
                    const cacheKey = cacheTtl > 0 ? this.getCacheKey(request) : undefined;
                    if (cacheKey) {
                        const cached = cachedResponseSchema.safeParse(await this.cache.get(cacheKey));
                        if (cached.success) {
                            cacheHit = true;
                            return { ...cached.data, config };
                        }
                        // Share the response of an identical request that is already in flight.
                        // Look it up without awaiting first, so that the request is registered before any other caller resumes.
                        const inflight = this.inflight.get(cacheKey);
                        const shared = inflight && (await inflight.catch(() => undefined));
                        if (shared) {
                            cacheHit = true;
                            return { ...shared, config };
                        }
                    }
                    const pending = getTransport(transport, request)(request);
                    if (!cacheKey) return pending;
                    const snapshot = pending.then(
                        async (response) => {
                            // Streams and other mutable transport values cannot be replayed safely.
                            if (typeof response.data !== "string") return undefined;
                            const cachedResponse = {
                                data: response.data,
                                status: response.status,
                                statusText: response.statusText,
                                headers: response.headers instanceof axios.AxiosHeaders ? response.headers.toJSON() : response.headers,
                            };
                            await this.cache.put(cacheKey, cachedResponse, cacheTtl);
                            // Share it the same way a cache hit replays it.
                            const parsed = cachedResponseSchema.safeParse(cachedResponse);
                            return parsed.success ? parsed.data : undefined;
                        },
                        // Failed requests are not shared, waiting requests retry on their own.
                        () => undefined,
                    );
                    this.inflight.set(cacheKey, snapshot);
                    snapshot
                        .finally(() => {
                            if (this.inflight.get(cacheKey) === snapshot) this.inflight.delete(cacheKey);
                        })
                        .catch(() => {});
                    const response = await pending;
                    await snapshot;
                    return response;
                },
            })
            .then((r) => r.data)
            .catch((e) => {
                return e.response?.data || e;
            });
        const timeDifference = Date.now() - beginTimestamp;
        this.logger.trace(
            `GET ${endpoint}${data ? ` ${JSON.stringify(data).substring(0, this.maxLogLength)}` : ""}, cache ${cacheHit ? "HIT" : "MISS"}, took ${timeDifference}ms`,
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
