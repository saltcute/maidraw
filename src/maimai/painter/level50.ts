import type { DataOrError } from "@common/error";
import { HitokotoModule } from "@common/painter/modules/hitokoto";
import { ImageModule } from "@common/painter/modules/image";
import { TextModule } from "@common/painter/modules/text";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import type { ModuleObjectFromClassArray } from "@common/utils/misc";
import { truncate } from "@common/utils/number";
import type { Score } from "@maimai/lib/types";
import { ProfileModule } from "@maimai/painter/modules/profile";
import type { Chart, Database } from "gcm-database/maimai";
import upath from "upath";
import type { MaimaiScoreAdapter } from "../lib/adapter";
import { Best50Painter } from "./best50";
import { ScoreGridModule } from "./modules/scoreGrid";
import { MaimaiPainter } from "./painter";

const LOADED_SCHEMAS = [ScoreGridModule, ProfileModule, ImageModule, TextModule, HitokotoModule] as const;

export class Level50Painter extends MaimaiPainter<typeof Best50Painter.THEME> {
    private static readonly DEFAULT_THEME = "jp-circleplus-landscape";

    private modules;
    public constructor(database: Database<Chart>) {
        super({
            theme: {
                schema: Best50Painter.THEME,
                searchPaths: [upath.join(Best50Painter.assetsPath, "themes", "maimai", "best50")],
                defaultTheme: Level50Painter.DEFAULT_THEME,
            },
        });
        this.modules = Object.fromEntries(LOADED_SCHEMAS.map((v) => [v.SCHEMA.shape.type.value, new v(database)])) as ModuleObjectFromClassArray<
            typeof LOADED_SCHEMAS
        >;
    }

    private getTextLevel(level: number, border: number) {
        const realBorder = Math.trunc(level) + border * 0.1;
        if (level < realBorder) return truncate(level, 0);
        else return `${truncate(level, 0)}+`;
    }
    async draw(
        variables: {
            username: string;
            rating: number;
            scores: Score[];
            level: number;
            page: number;
        },
        options?: { scale?: number; theme?: string; profilePicture?: Buffer },
    ): Promise<DataOrError<Buffer>> {
        return this.wrapPainter(async (ctx, currentTheme) => {
            const newScores = variables.scores.slice(0, 15);
            const oldScores = variables.scores.slice(15, 50);
            for (const element of currentTheme.content.elements) {
                await this.modules[element.type].draw(ctx, currentTheme, element as unknown as never, {
                    username: variables.username,
                    rating: variables.rating,
                    profilePicture: options?.profilePicture,
                    scores: {
                        new: newScores,
                        old: oldScores,
                    },
                    variables: {
                        username: toFullWidth(variables.username),
                        rating: truncate(variables.rating, 0),
                        level50Title: `Top Scores From Lv. ${this.getTextLevel(variables.level, 6)}`,
                        level50Subtitle: `(Showing scores from ${(variables.page - 1) * 50 + 1} to ${variables.page * 50})`,
                    },
                });
            }
        }, options ?? {});
    }
    async drawWithScoreSource(
        source: MaimaiScoreAdapter,
        variables: { username: string; level: number; page: number },
        options?: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        },
    ) {
        const { data: profile, err: perr } = await source.getPlayerInfo(variables.username);
        if (perr) return { err: perr };
        const { data: score, err: serr } = await source.getPlayerLevel50(variables.username, variables.level, variables.page);
        if (serr) return { err: serr };
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                scores: score,
                level: variables.level,
                page: variables.page,
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
