import type { Score } from "@chunithm/lib/types";
import { ProfileModule } from "@chunithm/painter/modules/profile";
import { type DataOrError, IllegalArgumentError } from "@common/error";
import { HitokotoModule } from "@common/painter/modules/hitokoto";
import { ImageModule } from "@common/painter/modules/image";
import { TextModule } from "@common/painter/modules/text";
import { ThemeManager } from "@common/painter/theme";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import type { ModuleObjectFromClassArray, SchemaOfModuleTuple } from "@common/utils/misc";
import { truncate } from "@common/utils/number";
import type { Chart, Database } from "gcm-database/chunithm";
import upath from "upath";
import { z } from "zod/v4";
import type { ChunithmScoreAdapter } from "../lib/adapter";
import { ScoreGridModule } from "./modules/scoreGrid";
import { ChunithmPainter } from "./painter";

const LOADED_SCHEMAS = [ScoreGridModule, ProfileModule, ImageModule, TextModule, HitokotoModule] as const;

export class BestPainter extends ChunithmPainter<typeof BestPainter.THEME> {
    public static readonly THEME = ThemeManager.BASE_THEME.extend({
        elements: z.array(z.discriminatedUnion("type", LOADED_SCHEMAS.map((v) => v.SCHEMA) as unknown as SchemaOfModuleTuple<typeof LOADED_SCHEMAS>)),
    });

    private static readonly DEFAULT_THEME = "jp-xversex-landscape-new";

    private modules;
    public constructor(database: Database<Chart>) {
        super({
            theme: {
                schema: BestPainter.THEME,
                searchPaths: [upath.join(BestPainter.assetsPath, "themes", "chunithm", "best")],
                defaultTheme: BestPainter.DEFAULT_THEME,
            },
        });
        this.modules = Object.fromEntries(LOADED_SCHEMAS.map((v) => [v.SCHEMA.shape.type.value, new v(database)])) as ModuleObjectFromClassArray<
            typeof LOADED_SCHEMAS
        >;
    }
    private getNaiveRating(bestScores: Score[], length: number) {
        return this.getRatingAvg(bestScores.slice(0, length), length);
    }
    private getRatingAvg(scores: Score[], length: number) {
        if (scores.length <= 0) return 0;
        return scores.map((v) => v.rating).reduce((sum, v) => sum + v, 0) / length;
    }
    public async draw(
        variables: {
            username: string;
            rating: number;
            newScores: Score[];
            oldScores: Score[];
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            bestScores?: Score[];
            type?: "new" | "recents";
            version?: "chunithm" | "crystal" | "new" | "verse";
        },
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
                    type: options.version ?? (options.type === "new" ? "verse" : "new"),
                    variables: {
                        username: toFullWidth(variables.username),
                        rating: truncate(variables.rating, 0),
                        naiveBest30: truncate(this.getNaiveRating(options.bestScores ?? [], 30), 2),
                        naiveBest50: truncate(this.getNaiveRating(options.bestScores ?? [], 50), 2),
                        newScoreRatingAvg: truncate(this.getRatingAvg(variables.newScores, options.type === "recents" ? 10 : 20), 2),
                        oldScoreRatingAvg: truncate(this.getRatingAvg(variables.oldScores.slice(0, 30), 30), 2),
                    },
                });
            }
        }, options ?? {});
    }
    public async drawWithScoreSource(
        source: ChunithmScoreAdapter,
        variables: { username: string },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            type?: "new" | "recents";
            version?: "chunithm" | "crystal" | "new" | "verse";
        },
    ) {
        if (!options.type) options.type = "new";
        const { data: profile, err: perr } = await source.getPlayerInfo(variables.username, options.type);
        if (perr) return { err: perr };
        let newScores: Score[], oldScores: Score[], bestScores: Score[] | undefined;
        if (options.type === "new") {
            const { data: score, err: serr } = await source.getPlayerBest50(variables.username);
            if (serr) return { err: serr };
            newScores = score.new;
            oldScores = score.old;
            bestScores = score.best;
        } else if (options.type === "recents") {
            const { data: score, err: serr } = await source.getPlayerRecent40(variables.username);
            if (serr) return { err: serr };
            newScores = score.recent;
            oldScores = score.best;
            bestScores = score.best;
        } else {
            return {
                err: new IllegalArgumentError("maidraw.chunithm.painter.best50", `Type can only be "recents" or "new". Found ${options.type}.`),
            };
        }
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                newScores,
                oldScores,
            },
            {
                ...options,
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
