import _ from "lodash";
import upath from "upath";
import { z } from "zod/v4";
import { Canvas } from "canvas";

import { EDifficulty, IScore } from "../../type";
import { OngekiScoreAdapter } from "../../lib/adapter";

import { Util } from "@maidraw/lib/util";
import { OngekiPainter, OngekiPainterModule } from "..";
import { PainterModule, ThemeManager } from "@maidraw/lib/painter";
import { Database } from "../../lib/database";

export class ChartPainter extends OngekiPainter<typeof ChartPainter.Theme> {
    public static readonly Theme = ThemeManager.BaseTheme.extend({
        elements: z.array(
            z.discriminatedUnion("type", [
                OngekiPainterModule.Profile.schema,
                OngekiPainterModule.Chart.ChartGrid.schema,
                OngekiPainterModule.Chart.DetailInfo.schema,
                OngekiPainterModule.Chart.CharacterInfo.schema,
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
                        "ongeki",
                        "chart"
                    ),
                ],
                defaultTheme: ChartPainter.DEFAULT_THEME,
            },
        });
    }

    private static readonly DEFAULT_THEME = "jp-refresh";

    public async draw(
        variables: {
            username: string;
            rating: number;
            chartId: number;
            scores: (IScore | null)[];
            type: "refresh" | "classic";
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            region?: "JPN";
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
        for (let i = EDifficulty.BASIC; i <= EDifficulty.LUNATIC; ++i) {
            charts.push(Database.getLocalChart(variables.chartId, i));
        }
        if (!charts.length) {
            const res = {
                status: "invalid-chart",
                message: `${variables.chartId} is not a valid chart.`,
                data: { chartId: variables.chartId },
            } as const;
            return res;
        }
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
                        await OngekiPainterModule.Chart.ChartGrid.draw(
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
                        await OngekiPainterModule.Chart.DetailInfo.draw(
                            ctx,
                            currentTheme,
                            element,
                            variables.chartId
                        );
                        break;
                    }
                    case "character-info": {
                        await OngekiPainterModule.Chart.CharacterInfo.draw(
                            ctx,
                            currentTheme,
                            element,
                            charts.find((v) => v != undefined)?.meta.boss
                        );
                        break;
                    }
                    case "profile": {
                        await OngekiPainterModule.Profile.draw(
                            ctx,
                            currentTheme,
                            element,
                            variables.username,
                            variables.rating,
                            options?.profilePicture
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
            const res = {
                status: "success",
                message: "Image drawn successfully.",
                data: canvas.toBuffer(),
            } as const;
            return res;
        } else {
            const res = {
                status: "no-theme",
                message: "Cannot find any valid theme to use for drawing.",
                data: null,
            } as const;
            return res;
        }
    }
    public async drawWithScoreSource(
        source: OngekiScoreAdapter,
        variables: {
            username: string;
            chartId: number;
            type: "refresh" | "classic";
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            region?: "JPN";
        } = {}
    ) {
        const profile = await source.getPlayerInfo(
            variables.username,
            variables.type
        );
        if (!(profile.status == "success")) return profile;
        const score = await source.getPlayerScore(
            variables.username,
            variables.chartId
        );
        if (!(score.status == "success")) return score;
        const pfp = await source.getPlayerProfilePicture(variables.username);
        if (pfp.status == "success") {
            options.profilePicture = pfp.data;
        }
        return this.draw(
            {
                username: profile.data.name,
                rating: profile.data.rating,
                chartId: variables.chartId,
                scores: [
                    score.data.basic,
                    score.data.advanced,
                    score.data.expert,
                    score.data.master,
                    score.data.lunatic,
                ],
                type: variables.type,
            },
            {
                ...options,
                profilePicture: options?.profilePicture ?? undefined,
            }
        );
    }
}
