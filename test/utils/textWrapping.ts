import assert from "node:assert/strict";
import { test } from "node:test";
import { drawText } from "@common/utils/textDraw/drawText";
import { createCanvas } from "canvas";

function wrap(content: string, maxWidth: number) {
    const ctx = createCanvas(1, 1).getContext("2d");
    const lines: { text: string; y: number }[] = [];
    ctx.fillText = (text, _x, y) => {
        lines.push({ text, y });
    };
    drawText(ctx, content, 0, 0, 20, 0, { maxWidth, font: "monospace", widthConstraintType: "break-lines" });
    return lines;
}

test("oversized words terminate and preserve every character", () => {
    const word = "Supercalifragilisticexpialidocious";
    for (const width of [0, 5, 30]) {
        const lines = wrap(word, width).map((line) => line.text);
        assert.equal(lines.join(""), word);
        assert.ok(lines.every((line) => line.length > 0));
        if (width <= 5) assert.deepEqual(lines, [...word]);
        else assert.ok(lines.every((line) => line.length <= 2));
    }
});

test("fallback preserves grapheme clusters", () => {
    const graphemes = ["👩‍👩‍👧‍👦", "e\u0301", "😀", "🇯🇵"];
    assert.deepEqual(
        wrap(graphemes.join(""), 5).map((line) => line.text),
        graphemes,
    );
});

test("mandatory breaks preserve blank lines and line spacing", () => {
    for (const separator of ["\n", "\r\n", "\r", "\v", "\f", "\u0085", "\u2028", "\u2029"]) {
        assert.deepEqual(wrap(`${separator}one${separator}${separator}two${separator}`, Infinity), [
            { text: "", y: 0 },
            { text: "one", y: 26 },
            { text: "", y: 52 },
            { text: "two", y: 78 },
            { text: "", y: 104 },
        ]);
    }
});

test("ordinary wrapping prefers word boundaries", () => {
    assert.deepEqual(
        wrap("one two three", 90).map((line) => line.text),
        ["one two", "three"],
    );
    assert.deepEqual(
        wrap("one abcdefghi end", 60).map((line) => line.text),
        ["one", "abcd", "efgh", "i", "end"],
    );
    assert.deepEqual(wrap("", 5), [{ text: "", y: 0 }]);
    assert.deepEqual(wrap("one two", Infinity), [{ text: "one two", y: 0 }]);
});
