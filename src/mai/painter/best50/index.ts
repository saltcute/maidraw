import upath from "upath";
import { z } from "zod/v4";
import { Canvas } from "canvas";

import ScoreTrackerAdapter from "../../lib/adapter";
import { MaimaiPainterModule, MaimaiPainter } from "..";

import {
    EAchievementTypes,
    IScore,
    RANK_BORDERS,
    RATING_CONSTANTS,
} from "@maidraw/mai/type";
import { Util } from "@maidraw/lib/util";
import { PainterModule, ThemeManager } from "@maidraw/lib/painter";
import { MaimaiUtil } from "../../lib/util";
import { Database } from "../../lib/database";

export class Best50Painter extends MaimaiPainter<typeof Best50Painter.Theme> {
    public static readonly Theme = ThemeManager.BaseTheme.extend({
        elements: z.array(
            z.discriminatedUnion("type", [
                MaimaiPainterModule.Profile.schema,
                MaimaiPainterModule.Best50.ScoreGrid.schema,
                PainterModule.Image.schema,
                PainterModule.Text.schema,
                PainterModule.Hitokoto.schema,
            ])
        ),
    });

    private static readonly DEFAULT_THEME = "jp-prism-landscape";
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
                defaultTheme: Best50Painter.DEFAULT_THEME,
            },
        });
    }

    public async draw(
        variables: {
            username: string;
            rating: number;
            newScores: IScore[];
            oldScores: IScore[];
        },
        options?: { scale?: number; theme?: string; profilePicture?: Buffer }
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
                                    await MaimaiPainterModule.Best50.ScoreGrid.draw(
                                        ctx,
                                        currentTheme,
                                        element,
                                        {
                                            x,
                                            y,
                                            index,
                                            score: curScore,
                                            scale: curScore.optionalData?.scale,
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
                        const getRatingBase = (
                            scores: IScore[],
                            length: number
                        ) => {
                            if (scores.length < length) return 0;
                            return (
                                scores
                                    .slice(0, length)
                                    .map((v) =>
                                        MaimaiUtil.calculateRating(
                                            v.chart.level,
                                            v.achievement
                                        )
                                    )
                                    .sort((a, b) => a - b)[0] || 0
                            );
                        };
                        function getRatingAvg(
                            scores: IScore[],
                            length: number
                        ) {
                            if (scores.length <= 0) return 0;
                            return (
                                scores
                                    .map((v) => v.dxRating)
                                    .reduce((sum, v) => sum + v, 0) / length
                            );
                        }
                        const getRatingTargetLevel = (
                            rating: number,
                            target: EAchievementTypes
                        ) => {
                            if (target == EAchievementTypes.D) {
                                return 0;
                            }
                            const naiveLevel =
                                rating /
                                (RATING_CONSTANTS[target] *
                                    RANK_BORDERS[target]);
                            return Math.ceil(naiveLevel * 10) / 10;
                        };
                        function getMilestone(
                            scores: IScore[],
                            length: number
                        ) {
                            const base = getRatingBase(scores, length);
                            let sssTarget, ssspTarget;
                            const sssLevel = getRatingTargetLevel(
                                base,
                                EAchievementTypes.SSS
                            );
                            const ssspLevel = getRatingTargetLevel(
                                base,
                                EAchievementTypes.SSSP
                            );
                            if (sssLevel > 0 && sssLevel < 15) {
                                sssTarget = sssLevel;
                            }
                            if (ssspLevel > 0 && ssspLevel < 15) {
                                ssspTarget = ssspLevel;
                            }
                            if (sssTarget && ssspTarget)
                                return `Next rating boost: lv. ${Util.ceilWithPercision(
                                    ssspTarget,
                                    1
                                )} SSS+/${Util.ceilWithPercision(sssTarget, 1)} SSS`;
                            else if (sssTarget)
                                return `Next rating boost: lv. ${Util.ceilWithPercision(
                                    sssTarget,
                                    1
                                )} SSS`;
                            else if (ssspTarget)
                                return `Next rating boost: lv. ${Util.ceilWithPercision(
                                    ssspTarget,
                                    1
                                )} SSS+`;
                            else return "Good job!";
                        }
                        await PainterModule.Text.draw(ctx, element, {
                            username: Util.HalfFullWidthConvert.toFullWidth(
                                variables.username
                            ),
                            rating: Util.truncate(variables.rating, 0),
                            newScoreRatingAvgString: `NEW scores average: ${Util.ceilWithPercision(
                                getRatingAvg(variables.newScores, 15),
                                0
                            )}`,
                            oldScoreRatingAvgString: `OLD scores average: ${Util.ceilWithPercision(
                                getRatingAvg(variables.oldScores, 35),
                                0
                            )}`,
                            newScoreMilestone: getMilestone(
                                variables.newScores,
                                15
                            ),
                            oldScoreMilestone: getMilestone(
                                variables.oldScores,
                                35
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
        source: ScoreTrackerAdapter,
        variables: { username: string },
        options?: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        }
    ) {
        const profile = await source.getPlayerInfo(variables.username);
        const score = await source.getPlayerBest50(variables.username);
        if (!profile || !score) return null;
        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                newScores: score.new,
                oldScores: score.old,
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
