import type { PainterModule } from "@common/painter/painter";
import { z } from "zod/v4";

export function sanitizeKamaitachiErrorMessage(msg: string, payload: string) {
    return msg.replaceAll(payload, "");
}

/**
 * Map every item with an asynchronous function, running at most `concurrency` calls at the same time.
 * Results keep the order of the items.
 */
export async function mapWithConcurrency<T, R>(items: readonly T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, worker));
    return results;
}

export type ExtendParameters<F extends (...args: never) => unknown, T extends unknown[]> = (...args: [...Parameters<F>, ...T]) => ReturnType<F>;

export type ReplaceReturnType<F extends (...args: never) => unknown, R> = (...args: Parameters<F>) => R;

const genericPainterModuleSchema = z.object({
    type: z.literal<string>(""),
});

export type GenericPainterModule<
    T extends PainterModule | unknown = unknown,
    S extends typeof genericPainterModuleSchema = typeof genericPainterModuleSchema,
> = {
    // biome-ignore lint/style/useNamingConvention: readonly static class member
    SCHEMA: S;
} & (abstract new (
    // biome-ignore lint/suspicious/noExplicitAny: will not use args
    ...args: any[]
) => T);

export type SchemaOfModuleTuple<T extends readonly [...GenericPainterModule[]]> = { [K in keyof T]: T[K]["SCHEMA"] };

export type ModuleObjectFromClassArray<T extends readonly GenericPainterModule[]> = {
    [K in T[number] as z.infer<K["SCHEMA"]>["type"]]: InstanceType<K>;
};
