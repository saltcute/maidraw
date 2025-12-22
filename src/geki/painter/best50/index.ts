import upath from "upath";
import { z } from "zod/v4";
import { Canvas } from "canvas";
import { IScore } from "@maidraw/geki/type";

import { OngekiScoreAdapter } from "../../lib/adapter";
import { OngekiPainter, OngekiPainterModule } from "..";

import { Util } from "@maidraw/lib/util";
import { PainterModule, ThemeManager } from "@maidraw/lib/painter";
import { Database } from "@maidraw/geki/lib/database";

export class Best50Painter extends OngekiPainter<typeof Best50Painter.Theme> {
    public static readonly Theme = ThemeManager.BaseTheme.extend({
        elements: z.array(
            z.discriminatedUnion("type", [
                OngekiPainterModule.Profile.schema,
                OngekiPainterModule.Best50.ScoreGrid.schema,
                PainterModule.Image.schema,
                PainterModule.Text.schema,
                PainterModule.Hitokoto.schema,
            ])
        ),
    });
    public constructor() {
        super({
            theme: {
                schema: Best50Painter.Theme,
                searchPaths: [
                    upath.join(
                        Best50Painter.assetsPath,
                        "themes",
                        "ongeki",
                        "best"
                    ),
                ],
                defaultTheme: Best50Painter.DEFAULT_THEME,
            },
        });
    }

    private static readonly DEFAULT_THEME = "jp-refresh-landscape-refresh";

    public async draw(
        variables: {
            username: string;
            rating: number;
            newScores: IScore[];
            oldScores: IScore[];
            recentOrPlatinumScores: IScore[];
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            bestScores?: IScore[];
            type?: "refresh" | "classic";
        }
    ): Promise<Buffer | null> {
        let currentTheme = this.theme.get(this.theme.defaultTheme);
        if (options?.theme) {
            const theme = this.theme.get(options.theme);
            if (theme) {
                currentTheme = theme;
            }
        }
        if (currentTheme) {
            await Database.cacheJackets([
                ...variables.newScores.map((v) => v.chart.id),
                ...variables.oldScores.map((v) => v.chart.id),
            ]);
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
                    case "score-grid": {
                        const gapx =
                            typeof element.scoreBubble.gap == "number"
                                ? element.scoreBubble.gap
                                : element.scoreBubble.gap.x;
                        const gapy =
                            typeof element.scoreBubble.gap == "number"
                                ? element.scoreBubble.gap
                                : element.scoreBubble.gap.y;
                        for (
                            let y = element.y, index = element.index, i = 0;
                            i < element.verticalSize;
                            ++i, y += element.scoreBubble.height + gapy
                        ) {
                            for (
                                let x = element.x, j = 0;
                                j < element.horizontalSize;
                                ++j,
                                    ++index,
                                    x += element.scoreBubble.width + gapx
                            ) {
                                let curScore;
                                if (element.region == "new")
                                    curScore = variables.newScores[index];
                                else if (element.region == "old")
                                    curScore = variables.oldScores[index];
                                else
                                    curScore =
                                        variables.recentOrPlatinumScores[index];
                                if (curScore) {
                                    await OngekiPainterModule.Best50.ScoreGrid.draw(
                                        ctx,
                                        currentTheme,
                                        element,
                                        curScore,
                                        index,
                                        x,
                                        y,
                                        options.type
                                    );
                                }
                            }
                        }
                        break;
                    }
                    case "profile": {
                        await OngekiPainterModule.Profile.draw(
                            ctx,
                            currentTheme,
                            element,
                            variables.username,
                            variables.rating,
                            options?.profilePicture,
                            options?.type
                        );
                        break;
                    }
                    case "text": {
                        function getNaiveRating(
                            type: "refresh" | "classic" = "refresh"
                        ) {
                            const bestScores = options?.bestScores;
                            if (!bestScores) return 0;
                            if (type == "refresh") {
                                const scoreRating = bestScores
                                    .slice(0, 60)
                                    .map((v) => v.rating)
                                    .reduce((sum, v) => sum + v);
                                const starRating =
                                    variables.recentOrPlatinumScores
                                        .slice(0, 50)
                                        .map((v) => v.starRating)
                                        .reduce((sum, v) => sum + v, 0);
                                return (
                                    Util.truncateNumber(scoreRating / 50, 3) +
                                    Util.truncateNumber(starRating / 50, 3)
                                );
                            } else {
                                return Util.truncateNumber(
                                    getRatingAvg(bestScores, 45),
                                    2
                                );
                            }
                        }
                        function getRatingAvg(
                            scores: IScore[],
                            length: number
                        ) {
                            if (scores.length <= 0) return 0;
                            return (
                                scores
                                    .slice(0, length)
                                    .map((v) => v.rating)
                                    .reduce((sum, v) => sum + v, 0) / length
                            );
                        }
                        await PainterModule.Text.draw(ctx, element, {
                            username: Util.HalfFullWidthConvert.toFullWidth(
                                variables.username
                            ),
                            rating: Util.truncate(
                                variables.rating,
                                options.type == "refresh" ? 3 : 2
                            ),
                            naiveRatingAverage: `NAIVE ${options.type == "refresh" ? 60 : 45} average: ${Util.truncate(
                                getNaiveRating(options.type),
                                options.type == "refresh" ? 3 : 2
                            )}`,
                            newScoreRatingAvg: Util.truncate(
                                getRatingAvg(
                                    variables.newScores,
                                    options.type == "refresh" ? 10 : 15
                                ),
                                options.type == "refresh" ? 3 : 2
                            ),
                            oldScoreRatingAvg: Util.truncate(
                                getRatingAvg(
                                    variables.oldScores,
                                    options.type == "refresh" ? 50 : 30
                                ),
                                options.type == "refresh" ? 3 : 2
                            ),
                            recentOrPlatinumScoreAvg: Util.truncate(
                                getRatingAvg(
                                    variables.recentOrPlatinumScores,
                                    options.type == "refresh" ? 50 : 10
                                ),
                                options.type == "refresh" ? 3 : 2
                            ),
                        });
                        break;
                    }
                }
            }
            return canvas.toBuffer();
        } else return null;
    }
    public async drawWithScoreSource(
        source: OngekiScoreAdapter,
        variable: { username: string },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            type?: "refresh" | "classic";
        }
    ) {
        if (!options.type) options.type = "refresh";
        const profile = await source.getPlayerInfo(
            variable.username,
            options.type
        );
        if (!profile) return null;
        let newScores: IScore[],
            oldScores: IScore[],
            recentOrPlatinumScores: IScore[],
            bestScores: IScore[] | undefined;
        if (options.type == "refresh") {
            const score = await source.getPlayerBest60(variable.username);
            if (!score) return null;
            newScores = score.new;
            oldScores = score.old;
            recentOrPlatinumScores = score.plat;
            bestScores = score.best;
        } else if (options.type == "classic") {
            const score = await source.getPlayerBest55(variable.username);
            if (!score) return null;
            recentOrPlatinumScores = score.recent;
            newScores = score.new;
            oldScores = score.old;
            bestScores = score.best;
        } else return null;
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
                profilePicture:
                    options?.profilePicture === null
                        ? undefined
                        : options?.profilePicture ||
                          (await source.getPlayerProfilePicture(
                              variable.username
                          )) ||
                          undefined,
                bestScores,
            }
        );
    }
}
