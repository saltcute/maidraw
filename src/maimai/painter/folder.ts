import type { DataOrError } from "@common/error";
import { HitokotoModule } from "@common/painter/modules/hitokoto";
import { ImageModule } from "@common/painter/modules/image";
import { TextModule } from "@common/painter/modules/text";
import { ThemeManager } from "@common/painter/theme";
import { toFullWidth } from "@common/utils/halfFullWidthConvert";
import type { ModuleObjectFromClassArray, SchemaOfModuleTuple } from "@common/utils/misc";
import { truncate } from "@common/utils/number";
import type { Folder, Score } from "@maimai/lib/types";
import { FolderModule, type FolderModulePainterContext } from "@maimai/painter/modules/folder";
import { ProfileModule } from "@maimai/painter/modules/profile";
import type { Chart, Database, Difficulty } from "gcm-database/maimai";
import upath from "upath";
import { z } from "zod/v4";
import type { MaimaiScoreAdapter } from "../lib/adapter";
import { MaimaiPainter } from "./painter";

const LOADED_SCHEMAS = [FolderModule, ProfileModule, ImageModule, TextModule, HitokotoModule] as const;

export class FolderPainter extends MaimaiPainter<typeof FolderPainter.THEME> {
    public static readonly THEME = ThemeManager.BASE_THEME.extend({
        elements: z.array(z.discriminatedUnion("type", LOADED_SCHEMAS.map((v) => v.SCHEMA) as unknown as SchemaOfModuleTuple<typeof LOADED_SCHEMAS>)),
    });

    private static readonly DEFAULT_THEME = "jp-prismplus";

    private modules;
    public constructor(database: Database<Chart>) {
        super({
            theme: {
                schema: FolderPainter.THEME,
                searchPaths: [upath.join(FolderPainter.assetsPath, "themes", "maimai", "folder")],
                defaultTheme: FolderPainter.DEFAULT_THEME,
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
            folders: Folder[];
            scores: FolderModulePainterContext["scores"];
        },
        options?: { scale?: number; theme?: string; profilePicture?: Buffer },
    ): Promise<DataOrError<Buffer>> {
        return this.wrapPainter({
            ...options,
            modules: this.modules,
            painterCtx: {
                username: variables.username,
                rating: variables.rating,
                profilePicture: options?.profilePicture,
                folders: variables.folders,
                scores: variables.scores,
                variables: {
                    username: toFullWidth(variables.username),
                    rating: truncate(variables.rating, 0),
                },
            },
        });
    }
    public async drawWithScoreSource(
        source: MaimaiScoreAdapter,
        variables: {
            username: string;
            folders: Folder[];
        },
        options?: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        },
    ) {
        const { data: profile, err: perr } = await source.getPlayerInfo(variables.username);
        if (perr) return { err: perr };

        const scores: FolderModulePainterContext["scores"] = {};
        const identifiers = new Set(variables.folders.flatMap((folder) => folder.elements.map((chart) => chart.identifier)));
        await Promise.all(
            [...identifiers].map(async (identifier) => {
                const { data, err } = await source.getPlayerScore(variables.username, identifier);
                if (err) return;
                const played: Partial<Record<Difficulty, Score>> = {};
                for (const [difficulty, score] of Object.entries(data)) {
                    if (score) played[difficulty as Difficulty] = score;
                }
                scores[identifier] = played;
            }),
        );

        return this.draw(
            {
                username: profile.name,
                rating: profile.rating,
                folders: variables.folders,
                scores,
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
