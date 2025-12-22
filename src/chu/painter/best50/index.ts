import upath from "upath";
import { z } from "zod/v4";
import { Canvas } from "canvas";

import { ChunithmScoreAdapter } from "../../lib/adapter";
import { ChunithmPainter, ChunithmPainterModule } from "..";

import { Util } from "@maidraw/lib/util";
import { IScore } from "@maidraw/chu/type";
import { PainterModule, ThemeManager } from "@maidraw/lib/painter";
import { Database } from "@maidraw/chu/lib/database";

export class Best50Painter extends ChunithmPainter<typeof Best50Painter.Theme> {
    public static readonly Theme = ThemeManager.BaseTheme.extend({
        elements: z.array(
            z.discriminatedUnion("type", [
                ChunithmPainterModule.Profile.schema,
                ChunithmPainterModule.Best50.ScoreGrid.schema,
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
                        "chunithm",
                        "best"
                    ),
                ],
                defaultTheme: Best50Painter.DEFAULT_THEME,
            },
        });
    }

    private static readonly DEFAULT_THEME = "jp-xverse-landscape-new";

    public async draw(
        variables: {
            username: string;
            rating: number;
            newScores: IScore[];
            oldScores: IScore[];
        },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            bestScores?: IScore[];
            type?: "new" | "recents";
            version?: "chunithm" | "crystal" | "new" | "verse";
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
            const version = (() => {
                const type = options?.type;
                const version = options?.version;
                if (!type || version) return version;
                if (type == "recents") return "crystal";
                else return "verse";
            })();
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
                        for (
                            let y = element.y, index = element.index, i = 0;
                            i < element.verticalSize;
                            ++i,
                                y +=
                                    element.scoreBubble.height +
                                    element.scoreBubble.gap
                        ) {
                            for (
                                let x = element.x, j = 0;
                                j < element.horizontalSize;
                                ++j,
                                    ++index,
                                    x +=
                                        element.scoreBubble.width +
                                        element.scoreBubble.gap
                            ) {
                                let curScore;
                                if (element.region == "new")
                                    curScore = variables.newScores[index];
                                else curScore = variables.oldScores[index];
                                if (curScore) {
                                    await ChunithmPainterModule.Best50.ScoreGrid.draw(
                                        ctx,
                                        currentTheme,
                                        element,
                                        curScore,
                                        index,
                                        x,
                                        y,
                                        version
                                    );
                                }
                            }
                        }
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
                            version
                        );
                        break;
                    }
                    case "text": {
                        function getNaiveRating(length: number) {
                            const bestScores = options?.bestScores;
                            if (!bestScores) return 0;
                            return getRatingAvg(
                                bestScores.slice(0, length),
                                length
                            );
                        }
                        function getRatingAvg(
                            scores: IScore[],
                            length: number
                        ) {
                            if (scores.length <= 0) return 0;
                            return (
                                scores
                                    .map((v) => v.rating)
                                    .reduce((sum, v) => sum + v, 0) / length
                            );
                        }
                        await PainterModule.Text.draw(ctx, element, {
                            username: Util.HalfFullWidthConvert.toFullWidth(
                                variables.username
                            ),
                            rating: Util.truncate(variables.rating, 2),
                            naiveBest30: Util.truncate(getNaiveRating(30), 2),
                            naiveBest50: Util.truncate(getNaiveRating(50), 2),
                            newScoreRatingAvg: Util.truncate(
                                getRatingAvg(
                                    variables.newScores,
                                    options.type == "recents" ? 10 : 20
                                ),
                                2
                            ),
                            oldScoreRatingAvg: Util.truncate(
                                getRatingAvg(
                                    variables.oldScores.slice(0, 30),
                                    30
                                ),
                                2
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
        source: ChunithmScoreAdapter,
        variables: { username: string },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            type?: "new" | "recents";
            version?: "chunithm" | "crystal" | "new" | "verse";
        }
    ) {
        if (!options.type) options.type = "new";
        const profile = await source.getPlayerInfo(
            variables.username,
            options.type
        );
        if (!profile) return null;
        let newScores: IScore[],
            oldScores: IScore[],
            bestScores: IScore[] | undefined;
        if (options.type == "new") {
            const score = await source.getPlayerBest50(variables.username);
            if (!score) return null;
            newScores = score.new;
            oldScores = score.old;
            bestScores = score.best;
        } else if (options.type == "recents") {
            const score = await source.getPlayerRecent40(variables.username);
            if (!score) return null;
            newScores = score.recent;
            oldScores = score.best;
            bestScores = score.best;
        } else return null;
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                newScores,
                oldScores,
            },
            {
                ...options,
                profilePicture:
                    options?.profilePicture === null
                        ? undefined
                        : options?.profilePicture ||
                          (await source.getPlayerProfilePicture(
                              variables.username
                          )) ||
                          undefined,
                bestScores,
            }
        );
    }
}
