import upath from "upath";
import { Canvas } from "canvas";

import { IScore } from "../../type";
import ScoreTrackerAdapter from "../../lib/adapter";
import { Best50Painter } from "../best50";
import { MaimaiPainterModule, MaimaiPainter } from "..";

import { Util } from "@maidraw/lib/util";
import { PainterModule } from "@maidraw/lib/painter";
import { Database } from "../../lib/database";

export class Level50Painter extends MaimaiPainter<typeof Best50Painter.Theme> {
    private static readonly DEFAULT_THEME = "jp-circle-landscape";
    public constructor() {
        super({
            theme: {
                schema: Best50Painter.Theme,
                searchPaths: [
                    upath.join(
                        Best50Painter.assetsPath,
                        "themes",
                        "maimai",
                        "best50"
                    ),
                ],
                defaultTheme: Level50Painter.DEFAULT_THEME,
            },
        });
    }

    async draw(
        variables: {
            username: string;
            rating: number;
            scores: IScore[];
            level: number;
            page: number;
        },
        options?: { scale?: number; theme?: string; profilePicture?: Buffer }
    ): Promise<Buffer | null> {
        const newScores = variables.scores.slice(0, 15);
        const oldScores = variables.scores.slice(15, 50);

        let currentTheme = this.theme.get(this.theme.defaultTheme);
        if (options?.theme) {
            const theme = this.theme.get(options.theme);
            if (theme) {
                currentTheme = theme;
            }
        }
        if (currentTheme) {
            await Database.cacheJackets(
                variables.scores.map((v) => v.chart.id)
            );
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
                                    curScore = newScores[index];
                                else curScore = oldScores[index];
                                if (curScore) {
                                    await MaimaiPainterModule.Best50.ScoreGrid.draw(
                                        ctx,
                                        currentTheme,
                                        element,
                                        {
                                            x,
                                            y,
                                            score: curScore,
                                            index:
                                                (variables.page - 1) * 50 +
                                                (element.region == "old"
                                                    ? index + 15
                                                    : index),
                                        }
                                    );
                                }
                            }
                        }
                        break;
                    }
                    case "profile": {
                        await MaimaiPainterModule.Profile.draw(
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
                        function getTextLevel(level: number, border: number) {
                            const realBorder = Math.trunc(level) + border * 0.1;
                            if (level < realBorder)
                                return Util.truncate(level, 0);
                            else return Util.truncate(level, 0) + "+";
                        }
                        await PainterModule.Text.draw(ctx, element, {
                            username: Util.HalfFullWidthConvert.toFullWidth(
                                variables.username
                            ),
                            rating: Util.truncate(variables.rating, 0),
                            level50Title: `Top Scores From Lv. ${getTextLevel(variables.level, 6)}`,
                            level50Subtitle: `(Showing scores from ${(variables.page - 1) * 50 + 1} to ${variables.page * 50})`,
                        });
                        break;
                    }
                }
            }
            return canvas.toBuffer();
        } else return null;
    }
    async drawWithScoreSource(
        source: ScoreTrackerAdapter,
        variables: { username: string; level: number; page: number },
        options?: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        }
    ) {
        const profile = await source.getPlayerInfo(variables.username);
        const score = await source.getPlayerLevel50(
            variables.username,
            variables.level,
            variables.page
        );
        if (!profile || !score) return null;
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
                profilePicture:
                    options?.profilePicture === null
                        ? undefined
                        : options?.profilePicture ||
                          (await source.getPlayerProfilePicture(
                              variables.username
                          )) ||
                          undefined,
            }
        );
    }
}
