import assert from "node:assert/strict";
import { ScoreGridModule as ChunithmScoreGridModule } from "@chunithm/painter/modules/scoreGrid";
import { ScoreGridModule as MaimaiScoreGridModule } from "@maimai/painter/modules/scoreGrid";
import { ScoreGridModule as OngekiScoreGridModule } from "@ongeki/painter/modules/scoreGrid";
import type z from "zod/v4";

type OptionalCount<Schema extends z.ZodType<{ scoreBubble: { strictScoreCount?: number } }>> = Pick<
    z.infer<Schema>["scoreBubble"],
    "strictScoreCount"
>;

// These assignments also check that callers can omit the property in z.infer.
const maimai: OptionalCount<typeof MaimaiScoreGridModule.SCHEMA> = {};
const chunithm: OptionalCount<typeof ChunithmScoreGridModule.SCHEMA> = {};
const ongeki: OptionalCount<typeof OngekiScoreGridModule.SCHEMA> = {};

for (const [schema, omitted] of [
    [MaimaiScoreGridModule.SCHEMA.shape.scoreBubble, maimai],
    [ChunithmScoreGridModule.SCHEMA.shape.scoreBubble, chunithm],
    [OngekiScoreGridModule.SCHEMA.shape.scoreBubble, ongeki],
] as const) {
    const countSchema = schema.pick({ strictScoreCount: true });
    assert.deepEqual(countSchema.parse(omitted), { strictScoreCount: 0 });
    assert.deepEqual(countSchema.parse({ strictScoreCount: undefined }), { strictScoreCount: 0 });
    assert.deepEqual(countSchema.parse({ strictScoreCount: 10 }), { strictScoreCount: 10 });
    assert.equal(countSchema.safeParse({ strictScoreCount: "10" }).success, false);
}
console.log("Score-grid optional count and default checks passed");
