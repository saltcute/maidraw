import upath from "upath";
import { z } from "zod/v4";
import { Canvas } from "canvas";

import { MaimaiPainterModule, MaimaiPainter } from "..";

import { IScore } from "@maidraw/mai/type";
import { Util } from "@maidraw/lib/util";
import { PainterModule, ThemeManager } from "@maidraw/lib/painter";
import { MaimaiUtil } from "../../lib/util";
import { Database } from "../../lib/database";
import _ from "lodash";
import { MaimaiScoreAdapter } from "@maidraw/mai/lib/adapter";

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
    ) {
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
                                    .map((v) =>
                                        MaimaiUtil.calculateRating(
                                            v.chart.level,
                                            v.achievement
                                        )
                                    )
                                    .sort((a, b) => a - b)
                                    .slice(0, length)[0] || 0
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
                            achievement: number
                        ) => {
                            for (let level = 10; level <= 150; ++level) {
                                const calculateRating =
                                    MaimaiUtil.calculateRating(
                                        level / 10,
                                        achievement
                                    );
                                if (
                                    Math.trunc(calculateRating) >
                                    Math.trunc(rating)
                                ) {
                                    return level / 10;
                                }
                            }
                            return null;
                        };
                        function getMilestone(
                            scores: IScore[],
                            length: number
                        ) {
                            const base = getRatingBase(scores, length);
                            const targets = [];
                            for (const score of [
                                100, 100.1, 100.2, 100.3, 100.4, 100.5,
                            ]) {
                                const level = getRatingTargetLevel(base, score);
                                if (level) {
                                    targets.push({
                                        level,
                                        score,
                                    });
                                }
                            }
                            if (scores.length >= length && targets.length > 0)
                                return `Next rating boost: ${_.uniqWith(
                                    targets.sort((a, b) => a.level - b.level),
                                    (a, b) => a.level == b.level
                                )
                                    .map(
                                        (v) =>
                                            `lv. ${Util.ceilWithPercision(v.level, 1)} ${v.score >= 100.5 ? "SSS+" : `SSS ${Util.truncate(v.score, 1)}%`}`
                                    )
                                    .join("/")}`;
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
        source: MaimaiScoreAdapter,
        variables: { username: string },
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        }
    ) {
        const profile = await source.getPlayerInfo(variables.username);
        if (!(profile.status == "success")) return profile;
        const score = await source.getPlayerBest50(variables.username);
        if (!(score.status == "success")) return score;
        const pfp = await source.getPlayerProfilePicture(variables.username);
        if (pfp.status == "success") {
            options.profilePicture = pfp.data;
        }
        return this.draw(
            {
                username: profile.data.name,
                rating: profile.data.rating,
                newScores: score.data.new,
                oldScores: score.data.old,
            },
            {
                ...options,
                profilePicture: options?.profilePicture ?? undefined,
            }
        );
    }
}
