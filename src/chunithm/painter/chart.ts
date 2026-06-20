import type { Score } from "@chunithm/lib/types";
import { type DataOrError, MissingChartError } from "@common/error";
import { HitokotoModule } from "@common/painter/modules/hitokoto";
import { ImageModule } from "@common/painter/modules/image";
import { TextModule } from "@common/painter/modules/text";
import { ThemeManager } from "@common/painter/theme";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import type { ModuleObjectFromClassArray, SchemaOfModuleTuple } from "@common/utils/misc";
import { truncate } from "@common/utils/number";
import { type Database, Difficulty } from "gcm-database/chunithm";
import type { Chart, Regions } from "gcm-database-local/chunithm";
import upath from "upath";
import { z } from "zod/v4";
import { ProfileModule } from "../../chunithm/painter/modules/profile";
import type { ChunithmScoreAdapter } from "../lib/adapter";
import { ChartGridModule } from "./modules/chartGrid";
import { DetailInfoModule } from "./modules/detailInfo";
import { ChunithmPainter } from "./painter";

const LOADED_SCHEMAS = [DetailInfoModule, ChartGridModule, ProfileModule, ImageModule, TextModule, HitokotoModule] as const;

export class ChartPainter extends ChunithmPainter<typeof ChartPainter.THEME> {
    public static readonly THEME = ThemeManager.BASE_THEME.extend({
        elements: z.array(z.discriminatedUnion("type", LOADED_SCHEMAS.map((v) => v.SCHEMA) as unknown as SchemaOfModuleTuple<typeof LOADED_SCHEMAS>)),
    });

    private static readonly DEFAULT_THEME = "jp-xversex";

    private modules;
    public constructor(private database: Database<Chart>) {
        super({
            theme: {
                schema: ChartPainter.THEME,
                searchPaths: [upath.join(ChartPainter.assetsPath, "themes", "chunithm", "chart")],
                defaultTheme: ChartPainter.DEFAULT_THEME,
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
            chartIdentifier: string;
            scores: Record<Difficulty, Score | null>;
            type: "new" | "recents";
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            region?: Regions;
            version?: "chunithm" | "crystal" | "new" | "verse";
        } = {},
    ): Promise<DataOrError<Buffer>> {
        return this.wrapPainter(async (ctx, currentTheme) => {
            const charts = [];
            for (const difficulty of Object.values(Difficulty)) {
                charts.push(this.database.getChart(variables.chartIdentifier, difficulty));
            }
            if (!charts.length) {
                return {
                    err: new MissingChartError("maidraw.chunithm.painter.chart", variables.chartIdentifier),
                };
            }
            for (const element of currentTheme.content.elements) {
                await this.modules[element.type].draw(ctx, currentTheme, element as unknown as never, {
                    username: variables.username,
                    rating: variables.rating,
                    profilePicture: options?.profilePicture,
                    chartIdentifier: variables.chartIdentifier,
                    scores: variables.scores,
                    type: options.version || variables.type === "new" ? "verse" : "new",
                    region: options?.region,
                    variables: {
                        username: toFullWidth(variables.username),
                        rating: truncate(variables.rating, 0),
                    },
                });
            }
        }, options ?? {});
    }
    public async drawWithScoreSource(
        source: ChunithmScoreAdapter,
        variables: {
            username: string;
            chartIdentifier: string;
            type: "new" | "recents";
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            region?: Regions;
            version?: "chunithm" | "crystal" | "new" | "verse";
        } = {},
    ) {
        const { data: profile, err: perr } = await source.getPlayerInfo(variables.username, variables.type);
        if (perr) return { err: perr };
        const { data: scores, err: serr } = await source.getPlayerScore(variables.username, variables.chartIdentifier);
        if (serr) return { err: serr };
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                chartIdentifier: variables.chartIdentifier,
                scores,
                type: variables.type,
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
