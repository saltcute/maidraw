import type { DataOrError } from "@common/error";
import { HitokotoModule } from "@common/painter/modules/hitokoto";
import { ImageModule } from "@common/painter/modules/image";
import { TextModule } from "@common/painter/modules/text";
import { ThemeManager } from "@common/painter/theme";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import type { ModuleObjectFromClassArray, SchemaOfModuleTuple } from "@common/utils/misc";
import { ceilWithPercision, truncate } from "@common/utils/number";
import type { Score } from "@maimai/lib/types";
import { ProfileModule } from "@maimai/painter/modules/profile";
import type { Chart, Database } from "gcm-database/maimai";
import _ from "lodash";
import { MaimaiDXRate } from "rg-stats";
import upath from "upath";
import { z } from "zod/v4";
import type { MaimaiScoreAdapter } from "../lib/adapter";
import { ScoreGridModule } from "./modules/scoreGrid";
import { MaimaiPainter } from "./painter";

const LOADED_SCHEMAS = [ScoreGridModule, ProfileModule, ImageModule, TextModule, HitokotoModule] as const;

export class Best50Painter extends MaimaiPainter<typeof Best50Painter.THEME> {
    public static readonly THEME = ThemeManager.BASE_THEME.extend({
        elements: z.array(z.discriminatedUnion("type", LOADED_SCHEMAS.map((v) => v.SCHEMA) as unknown as SchemaOfModuleTuple<typeof LOADED_SCHEMAS>)),
    });

    private static readonly DEFAULT_THEME = "jp-circleplus-landscape";

    private modules;
    public constructor(database: Database<Chart>) {
        super({
            theme: {
                schema: Best50Painter.THEME,
                searchPaths: [upath.join(Best50Painter.assetsPath, "themes", "maimai", "best50")],
                defaultTheme: Best50Painter.DEFAULT_THEME,
            },
        });
        this.modules = Object.fromEntries(LOADED_SCHEMAS.map((v) => [v.SCHEMA.shape.type.value, new v(database)])) as ModuleObjectFromClassArray<
            typeof LOADED_SCHEMAS
        >;
    }

    private getRatingBase(scores: Score[], length: number) {
        if (scores.length < length) return 0;
        return (
            scores
                .map((v) =>
                    MaimaiDXRate.calculate(
                        v.achievement,
                        v.chart.internalLevel ?? parseInt(v.chart.level, 10) + (v.chart.level.includes("+") ? 0.6 : 0),
                        "CLEAR",
                    ),
                )
                .sort((a, b) => a - b)
                .slice(0, length)[0] || 0
        );
    }
    private getRatingAvg(scores: Score[], length: number) {
        if (scores.length <= 0) return 0;
        return scores.map((v) => v.dxRating).reduce((sum, v) => sum + v, 0) / length;
    }
    private getRatingTargetLevel(rating: number, achievement: number) {
        for (let level = 10; level <= 150; ++level) {
            const calculateRating = MaimaiDXRate.calculate(achievement, level / 10, "CLEAR");
            if (Math.trunc(calculateRating) > Math.trunc(rating)) {
                return level / 10;
            }
        }
        return null;
    }
    private getMilestone(scores: Score[], length: number) {
        const base = this.getRatingBase(scores, length);
        const targets = [];
        for (const score of [100, 100.1, 100.2, 100.3, 100.4, 100.5]) {
            const level = this.getRatingTargetLevel(base, score);
            if (level) {
                targets.push({
                    level,
                    score,
                });
            }
        }
        if (scores.length >= length && targets.length > 0)
            return `Next rating boost: ${_.uniqWith(
                targets.sort((a, b) => a.level - b.level),
                (a, b) => a.level === b.level,
            )
                .map((v) => `lv. ${ceilWithPercision(v.level, 1)} ${v.score >= 100.5 ? "SSS+" : `SSS ${truncate(v.score, 1)}%`}`)
                .join("/")}`;
        else return "Good job!";
    }

    public async draw(
        variables: {
            username: string;
            rating: number;
            newScores: Score[];
            oldScores: Score[];
        },
        options?: { scale?: number; theme?: string; profilePicture?: Buffer },
    ): Promise<DataOrError<Buffer>> {
        return this.wrapPainter(async (ctx, currentTheme) => {
            for (const element of currentTheme.content.elements) {
                await this.modules[element.type].draw(ctx, currentTheme, element as unknown as never, {
                    username: variables.username,
                    rating: variables.rating,
                    profilePicture: options?.profilePicture,
                    scores: {
                        new: variables.newScores,
                        old: variables.oldScores,
                    },
                    variables: {
                        username: toFullWidth(variables.username),
                        rating: truncate(variables.rating, 0),
                        newScoreRatingAvgString: `NEW scores average: ${ceilWithPercision(this.getRatingAvg(variables.newScores, 15), 0)}`,
                        oldScoreRatingAvgString: `OLD scores average: ${ceilWithPercision(this.getRatingAvg(variables.oldScores, 35), 0)}`,
                        newScoreMilestone: this.getMilestone(variables.newScores, 15),
                        oldScoreMilestone: this.getMilestone(variables.oldScores, 35),
                    },
                });
            }
        }, options ?? {});
    }
    public async drawWithScoreSource(
        source: MaimaiScoreAdapter,
        variables: { username: string },
        options?: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        },
    ) {
        const { data: profile, err: perr } = await source.getPlayerInfo(variables.username);
        if (perr) return { err: perr };
        const { data: score, err: serr } = await source.getPlayerBest50(variables.username);
        if (serr) return { err: serr };
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                newScores: score.new,
                oldScores: score.old,
            },
            {
                ...options,
                profilePicture: await (async () => {
                    if (options?.profilePicture) return options?.profilePicture;
                    const { data: pfp, err: pfperr } = await source.getPlayerProfilePicture(variables.username);
                    if (pfperr) return undefined;
                    return pfp;
                })(),
            },
        );
    }
}
