import type { ScoreGridModule } from "@maimai/painter/modules/scoreGrid";
import type { ThemeContext } from "@theme-tools/lib/context";
import { type SpriteDirs, spriteSet } from "@theme-tools/lib/sprites";
import type { z } from "zod/v4";

type ScoreGridSprites = z.input<typeof ScoreGridModule.SCHEMA>["sprites"];

export const maimaiAchievementKeys = ["d", "c", "b", "bb", "bbb", "a", "aa", "aaa", "s", "sp", "ss", "ssp", "sss", "sssp"] as const;
export const maimaiMilestoneKeys = ["ap", "app", "fc", "fcp", "fdx", "fdxp", "fs", "fsp", "sync", "none"] as const;
export const maimaiModeKeys = ["standard", "dx"] as const;
export const maimaiDxRatingKeys = ["white", "blue", "green", "yellow", "red", "purple", "bronze", "silver", "gold", "platinum", "rainbow"] as const;

export type MaimaiAchievementKey = (typeof maimaiAchievementKeys)[number];
export type MaimaiMilestoneKey = (typeof maimaiMilestoneKeys)[number];
export type MaimaiModeKey = (typeof maimaiModeKeys)[number];
export type MaimaiDxRatingKey = (typeof maimaiDxRatingKeys)[number];

/**
 * Shared sprite pool every maimai best50 theme can borrow from.
 */
export const maimaiBest50Versionless = "themes/maimai/best50/versionless";

export function maimaiAchievements(ctx: ThemeContext, dirs: SpriteDirs<MaimaiAchievementKey>): ScoreGridSprites["achievement"] {
    return spriteSet(ctx, maimaiAchievementKeys, { dirs });
}

export function maimaiMilestones(
    ctx: ThemeContext,
    dirs: SpriteDirs<MaimaiMilestoneKey> = `${maimaiBest50Versionless}/milestone`,
): ScoreGridSprites["milestone"] {
    return spriteSet(ctx, maimaiMilestoneKeys, { dirs });
}

export function maimaiModes(ctx: ThemeContext, dirs: SpriteDirs<MaimaiModeKey>): ScoreGridSprites["mode"] {
    return spriteSet(ctx, maimaiModeKeys, { dirs });
}

export function maimaiDxRating(ctx: ThemeContext, dirs: SpriteDirs<MaimaiDxRatingKey>) {
    return spriteSet(ctx, maimaiDxRatingKeys, { dirs });
}
