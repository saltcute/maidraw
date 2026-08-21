import type { ProfileModule } from "@ongeki/painter/modules/profile";
import type { ScoreGridModule } from "@ongeki/painter/modules/scoreGrid";
import type { ThemeContext } from "@theme-tools/lib/context";
import { spriteSet } from "@theme-tools/lib/sprites";
import type { z } from "zod/v4";

type ScoreGridSprites = z.input<typeof ScoreGridModule.SCHEMA>["sprites"];
type ProfileSprites = z.input<typeof ProfileModule.SCHEMA>["sprites"];

/**
 * ONGEKI has no plus ranks below SSS, so the table is two entries shorter than the other games.
 */
export const ongekiAchievementKeys = ["d", "c", "b", "bb", "bbb", "a", "aa", "aaa", "s", "ss", "sss", "sssp"] as const;
export const ongekiMilestoneKeys = ["ab", "abp", "fc", "fb", "none"] as const;
export const ongekiRatingColorKeys = [
    "blue",
    "green",
    "orange",
    "red",
    "purple",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "rainbow",
    "rainbow2",
    "rainbow3",
] as const;

export type OngekiRatingColorKey = (typeof ongekiRatingColorKeys)[number];

/**
 * Shared sprite pool. Like CHUNITHM it lives under the best painter and the chart painter reaches
 * across into it.
 */
export const ongekiVersionless = "themes/ongeki/best/versionless";

export function ongekiAchievements(ctx: ThemeContext): ScoreGridSprites["achievement"] {
    return spriteSet(ctx, ongekiAchievementKeys, { dirs: `${ongekiVersionless}/achievement` });
}

export function ongekiMilestones(ctx: ThemeContext): ScoreGridSprites["milestone"] {
    return spriteSet(ctx, ongekiMilestoneKeys, {
        dirs: { default: `${ongekiVersionless}/milestone`, none: ongekiVersionless },
        files: { none: "void" },
    });
}

export function ongekiProfileSprites(ctx: ThemeContext): ProfileSprites {
    return {
        rating: {
            numberMap: spriteSet(ctx, ongekiRatingColorKeys, { dirs: `${ongekiVersionless}/rating/numberMap` }),
            headerText: spriteSet(ctx, ongekiRatingColorKeys, { dirs: `${ongekiVersionless}/rating/headerText` }),
        },
        profile: {
            userplate: ctx.ref(`${ongekiVersionless}/userplateIchigeki.webp`),
            icon: ctx.ref(`${ongekiVersionless}/icon.webp`),
        },
    };
}
