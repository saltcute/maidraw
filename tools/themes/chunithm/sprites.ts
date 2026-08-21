import type { ProfileModule } from "@chunithm/painter/modules/profile";
import type { ScoreGridModule } from "@chunithm/painter/modules/scoreGrid";
import type { ThemeContext } from "@theme-tools/lib/context";
import { type SpriteDirs, spriteSet } from "@theme-tools/lib/sprites";
import type { z } from "zod/v4";

type ScoreGridSprites = z.input<typeof ScoreGridModule.SCHEMA>["sprites"];
type ProfileSprites = z.input<typeof ProfileModule.SCHEMA>["sprites"];

export const chunithmAchievementKeys = ["d", "c", "b", "bb", "bbb", "a", "aa", "aaa", "s", "sp", "ss", "ssp", "sss", "sssp"] as const;
export const chunithmMilestoneKeys = ["aj", "ajc", "fc", "none"] as const;
export const chunithmRatingNumberMapKeys = ["white", "bronze", "silver", "gold", "platinum", "rainbow", "kiwami"] as const;

export type ChunithmAchievementKey = (typeof chunithmAchievementKeys)[number];
export type ChunithmMilestoneKey = (typeof chunithmMilestoneKeys)[number];
export type ChunithmRatingNumberMapKey = (typeof chunithmRatingNumberMapKeys)[number];

/**
 * Shared sprite pool. It lives under the best painter because that is where the artwork was first
 * added; the chart painter reaches across into it.
 */
export const chunithmVersionless = "themes/chunithm/best/versionless";
export const chunithmRatingNumberMaps = `${chunithmVersionless}/rating/numberMaps`;

/**
 * CHUNITHM rank artwork is named in upper case, unlike every other sprite table in the repository.
 */
export function chunithmAchievements(
    ctx: ThemeContext,
    dirs: SpriteDirs<ChunithmAchievementKey>,
    files?: Partial<Record<ChunithmAchievementKey, string>>,
) {
    return spriteSet(ctx, chunithmAchievementKeys, { dirs, fileName: (key) => key.toUpperCase(), files }) as ScoreGridSprites["achievement"];
}

/**
 * The empty lamp is the shared blank sprite, which sits one directory above the lamps themselves.
 */
export function chunithmMilestones(ctx: ThemeContext): ScoreGridSprites["milestone"] {
    return spriteSet(ctx, chunithmMilestoneKeys, {
        dirs: { default: `${chunithmVersionless}/milestone`, none: chunithmVersionless },
        files: { none: "void" },
    });
}

export function chunithmRatingNumberMap(
    ctx: ThemeContext,
    dirs: SpriteDirs<ChunithmRatingNumberMapKey> = chunithmRatingNumberMaps,
): ProfileSprites["ratingNumberMap"] {
    return spriteSet(ctx, chunithmRatingNumberMapKeys, { dirs });
}

export function chunithmProfile(ctx: ThemeContext): ProfileSprites["profile"] {
    return {
        nameplate: ctx.ref(`${chunithmVersionless}/nameplate.webp`),
        icon: ctx.ref(`${chunithmVersionless}/icon.webp`),
    };
}
