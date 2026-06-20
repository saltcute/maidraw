import { type DataOrError, IllegalArgumentError } from "@common/error";
import { HitokotoModule } from "@common/painter/modules/hitokoto";
import { ImageModule } from "@common/painter/modules/image";
import { TextModule } from "@common/painter/modules/text";
import { ThemeManager } from "@common/painter/theme";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import type { ModuleObjectFromClassArray, SchemaOfModuleTuple } from "@common/utils/misc";
import { truncate, truncateNumber } from "@common/utils/number";
import type { Chart, Database } from "gcm-database/ongeki";
import upath from "upath";
import { z } from "zod/v4";
import type { OngekiScoreAdapter } from "../lib/adapter";
import type { Score } from "../lib/types";
import { ProfileModule } from "./modules/profile";
import { ScoreGridModule } from "./modules/scoreGrid";
import { OngekiPainter } from "./painter";

const LOADED_SCHEMAS = [ScoreGridModule, ProfileModule, ImageModule, TextModule, HitokotoModule] as const;

export class Best50Painter extends OngekiPainter<typeof Best50Painter.THEME> {
    public static readonly THEME = ThemeManager.BASE_THEME.extend({
        elements: z.array(z.discriminatedUnion("type", LOADED_SCHEMAS.map((v) => v.SCHEMA) as unknown as SchemaOfModuleTuple<typeof LOADED_SCHEMAS>)),
    });

    private static readonly DEFAULT_THEME = "jp-refresh-landscape-refresh";

    private modules;
    public constructor(database: Database<Chart>) {
        super({
            theme: {
                schema: Best50Painter.THEME,
                searchPaths: [upath.join(Best50Painter.assetsPath, "themes", "ongeki", "best")],
                defaultTheme: Best50Painter.DEFAULT_THEME,
            },
        });
        this.modules = Object.fromEntries(LOADED_SCHEMAS.map((v) => [v.SCHEMA.shape.type.value, new v(database)])) as ModuleObjectFromClassArray<
            typeof LOADED_SCHEMAS
        >;
    }

    public async draw(
        variables: {
            username: string;
            rating: number;
            newScores: Score[];
            oldScores: Score[];
            recentOrPlatinumScores: Score[];
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            bestScores?: Score[];
            type?: "refresh" | "classic";
        } = {},
    ): Promise<DataOrError<Buffer>> {
        const type = options.type ?? "refresh";
        return this.wrapPainter(async (ctx, currentTheme) => {
            const getRatingAvg = (scores: Score[], length: number, ratingType: "score" | "star" = "score") => {
                if (scores.length <= 0) return 0;
                return scores.slice(0, length).reduce((sum, v) => sum + (ratingType === "star" ? v.starRating : v.rating), 0) / length;
            };
            const getNaiveRating = () => {
                const bestScores = options.bestScores;
                if (!bestScores) return 0;
                if (type === "refresh") {
                    const scoreRating = bestScores
                        .slice(0, 60)
                        .map((v) => v.rating)
                        .reduce((sum, v) => sum + v, 0);
                    const starRating = variables.recentOrPlatinumScores
                        .slice(0, 50)
                        .map((v) => v.starRating)
                        .reduce((sum, v) => sum + v, 0);
                    return truncateNumber(scoreRating / 50, 3) + truncateNumber(starRating / 50, 3);
                } else {
                    return truncateNumber(getRatingAvg(bestScores, 45), 2);
                }
            };
            for (const element of currentTheme.content.elements) {
                await this.modules[element.type].draw(ctx, currentTheme, element as unknown as never, {
                    username: variables.username,
                    rating: variables.rating,
                    profilePicture: options?.profilePicture,
                    type,
                    scores: {
                        new: variables.newScores,
                        old: variables.oldScores,
                        recent: variables.recentOrPlatinumScores,
                    },
                    variables: {
                        username: toFullWidth(variables.username),
                        rating: truncate(variables.rating, type === "refresh" ? 3 : 2),
                        naiveRatingAverage: `NAIVE ${type === "refresh" ? 60 : 45} average: ${truncate(getNaiveRating(), type === "refresh" ? 3 : 2)}`,
                        newScoreRatingAvg: truncate(getRatingAvg(variables.newScores, type === "refresh" ? 10 : 15), type === "refresh" ? 3 : 2),
                        oldScoreRatingAvg: truncate(getRatingAvg(variables.oldScores, type === "refresh" ? 50 : 30), type === "refresh" ? 3 : 2),
                        recentOrPlatinumScoreAvg: truncate(
                            getRatingAvg(variables.recentOrPlatinumScores, type === "refresh" ? 50 : 10, type === "refresh" ? "star" : "score"),
                            type === "refresh" ? 3 : 2,
                        ),
                    },
                });
            }
        }, options ?? {});
    }
    public async drawWithScoreSource(
        source: OngekiScoreAdapter,
        variables: { username: string },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            type?: "refresh" | "classic";
        } = {},
    ) {
        const type = options.type ?? "refresh";
        const { data: profile, err: perr } = await source.getPlayerInfo(variables.username, type);
        if (perr) return { err: perr };
        let newScores: Score[], oldScores: Score[], recentOrPlatinumScores: Score[], bestScores: Score[] | undefined;
        if (type === "refresh") {
            const { data: score, err: serr } = await source.getPlayerBest60(variables.username);
            if (serr) return { err: serr };
            newScores = score.new;
            oldScores = score.old;
            recentOrPlatinumScores = score.plat;
            bestScores = score.best;
        } else if (type === "classic") {
            const { data: score, err: serr } = await source.getPlayerBest55(variables.username);
            if (serr) return { err: serr };
            recentOrPlatinumScores = score.recent;
            newScores = score.new;
            oldScores = score.old;
            bestScores = score.best;
        } else {
            return {
                err: new IllegalArgumentError("maidraw.ongeki.painter.best50", `Type can only be "refresh" or "classic". Found ${type}.`),
            };
        }
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                newScores,
                oldScores,
                recentOrPlatinumScores,
            },
            {
                ...options,
                type,
                profilePicture: await (async () => {
                    if (options?.profilePicture) return options?.profilePicture;
                    const { data: pfp, err: pfperr } = await source.getPlayerProfilePicture(variables.username);
                    if (pfperr) return undefined;
                    return pfp;
                })(),
                bestScores,
            },
        );
    }
}
