import _ from "lodash";
import upath from "upath";
import { z } from "zod/v4";
import { Canvas } from "canvas";

import { EDifficulty, IScore } from "../../type";
import { ChunithmScoreAdapter } from "../../lib/adapter";

import { Util } from "@maidraw/lib/util";
import { ChunithmPainter, ChunithmPainterModule } from "..";
import { PainterModule, ThemeManager } from "@maidraw/lib/painter";
import { Database } from "../../lib/database";
import { MissingChartError, MissingThemeError } from "@maidraw/lib/type";

export class ChartPainter extends ChunithmPainter<typeof ChartPainter.Theme> {
    public static readonly Theme = ThemeManager.BaseTheme.extend({
        elements: z.array(
            z.discriminatedUnion("type", [
                ChunithmPainterModule.Profile.schema,
                ChunithmPainterModule.Chart.ChartGrid.schema,
                ChunithmPainterModule.Chart.DetailInfo.schema,
                PainterModule.Image.schema,
                PainterModule.Text.schema,
                PainterModule.Hitokoto.schema,
            ])
        ),
    });
    public constructor() {
        super({
            theme: {
                schema: ChartPainter.Theme,
                searchPaths: [
                    upath.join(
                        ChartPainter.assetsPath,
                        "themes",
                        "chunithm",
                        "chart"
                    ),
                ],
                defaultTheme: ChartPainter.DEFAULT_THEME,
            },
        });
    }

    private static readonly DEFAULT_THEME = "jp-xverse";

    public async draw(
        variables: {
            username: string;
            rating: number;
            chartId: number;
            scores: (IScore | null)[];
            type: "new" | "recents";
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            region?: "JPN" | "INT" | "CHN";
            version?: "chunithm" | "crystal" | "new" | "verse";
        } = {}
    ) {
        let currentTheme = this.theme.get(this.theme.defaultTheme);
        if (options?.theme) {
            const theme = this.theme.get(options.theme);
            if (theme) {
                currentTheme = theme;
            }
        }
        const charts = [];
        for (let i = EDifficulty.BASIC; i <= EDifficulty.WORLDS_END; ++i) {
            charts.push(Database.getLocalChart(variables.chartId, i));
        }
        if (!charts.length)
            return {
                err: new MissingChartError(
                    "maidraw.chunithm.painter.chart",
                    variables.chartId
                ),
            };
        if (currentTheme) {
            await Database.cacheJackets([variables.chartId]);
            const canvas = new Canvas(
                currentTheme.content.width * (options?.scale ?? 1),
                currentTheme.content.height * (options?.scale ?? 1)
            );
            const ctx = canvas.getContext("2d");
            if (options?.scale) ctx.scale(options.scale, options.scale);
            ctx.imageSmoothingEnabled = true;
            for (const element of currentTheme.content.elements) {
                switch (element.type) {
                    case "image": {
                        await PainterModule.Image.draw(
                            ctx,
                            currentTheme,
                            element
                        );
                        break;
                    }
                    case "hitokoto": {
                        await PainterModule.Hitokoto.draw(
                            ctx,
                            currentTheme,
                            element
                        );
                        break;
                    }
                    case "chart-grid": {
                        await ChunithmPainterModule.Chart.ChartGrid.draw(
                            ctx,
                            currentTheme,
                            element,
                            variables.chartId,
                            variables.scores,
                            options?.region
                        );
                        break;
                    }
                    case "detail-info": {
                        await ChunithmPainterModule.Chart.DetailInfo.draw(
                            ctx,
                            currentTheme,
                            element,
                            variables.chartId
                        );
                        break;
                    }
                    case "profile": {
                        await ChunithmPainterModule.Profile.draw(
                            ctx,
                            currentTheme,
                            element,
                            variables.username,
                            variables.rating,
                            options?.profilePicture,
                            (() => {
                                const type = variables.type;
                                const version = options?.version;
                                if (!type || version) return version;
                                if (type == "recents") return "crystal";
                                else return "verse";
                            })()
                        );
                        break;
                    }
                    case "text": {
                        await PainterModule.Text.draw(ctx, element, {
                            username: Util.HalfFullWidthConvert.toFullWidth(
                                variables.username
                            ),
                            rating: Util.truncate(variables.rating, 0),
                        });
                        break;
                    }
                }
            }
            return { data: canvas.toBuffer() };
        } else
            return {
                err: new MissingThemeError("maidraw.chunithm.painter.chart"),
            };
    }
    public async drawWithScoreSource(
        source: ChunithmScoreAdapter,
        variables: {
            username: string;
            chartId: number;
            type: "new" | "recents";
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            region?: "JPN" | "INT" | "CHN";
            version?: "chunithm" | "crystal" | "new" | "verse";
        } = {}
    ) {
        const { data: profile, err: perr } = await source.getPlayerInfo(
            variables.username,
            variables.type
        );
        if (perr) return { err: perr };
        const { data: score, err: serr } = await source.getPlayerScore(
            variables.username,
            variables.chartId
        );
        if (serr) return { err: serr };
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                chartId: variables.chartId,
                scores: [
                    score.basic,
                    score.advanced,
                    score.expert,
                    score.master,
                    score.ultima,
                    score.worldsEnd,
                ],
                type: variables.type,
            },
            {
                ...options,
                profilePicture: await (async () => {
                    if (options?.profilePicture) return options?.profilePicture;
                    const { data: pfp, err: pfperr } =
                        await source.getPlayerProfilePicture(
                            variables.username
                        );
                    if (pfperr) return undefined;
                    return pfp;
                })(),
            }
        );
    }
}
