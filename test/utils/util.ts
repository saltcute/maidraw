import fs from "node:fs";
import { globalLogger } from "@saltcute/logger";
import { Canvas, loadImage } from "canvas";
import sharp from "sharp";
import { join } from "upath";
import type { DataOrError } from "../../src/common/error";

export const logger = globalLogger.child();

export const localDatabasePath = join(__dirname, "..", "..", "..", "maimai-songs-database");

export async function createCheckerBoardCanvas(...args: ConstructorParameters<typeof Canvas>) {
    const canvas = new Canvas(...args);
    const ctx = canvas.getContext("2d");

    const [width, height] = args;
    const unitSize = 12,
        unitCountW = Math.ceil(width / unitSize),
        unitCountH = Math.ceil(height / unitSize),
        channels = 4;
    const backgroundBuffer = Buffer.alloc(unitSize * unitSize * unitCountW * unitCountH * channels);
    for (let i = 0; i < unitCountW; ++i) {
        for (let j = 0; j < unitCountH; ++j) {
            for (let x = i * unitSize; x < (i + 1) * unitSize; ++x) {
                for (let y = j * unitSize; y < (j + 1) * unitSize; ++y) {
                    const idx = (y * unitSize * unitCountW + x) * channels;
                    if ((i + j) % 2 === 0) {
                        backgroundBuffer[idx + 0] = 0x5c;
                        backgroundBuffer[idx + 1] = 0x5c;
                        backgroundBuffer[idx + 2] = 0x5c;
                        backgroundBuffer[idx + 3] = 0xff;
                    } else {
                        backgroundBuffer[idx + 0] = 0x00;
                        backgroundBuffer[idx + 1] = 0x00;
                        backgroundBuffer[idx + 2] = 0x00;
                        backgroundBuffer[idx + 3] = 0x00;
                    }
                }
            }
        }
    }
    const background = await sharp(backgroundBuffer, {
        raw: {
            width: unitSize * unitCountW,
            height: unitSize * unitCountH,
            channels: channels,
        },
    })
        .png()
        .toBuffer();
    ctx.drawImage(await loadImage(background), 0, 0);

    return canvas;
}

export async function painterTestWrapper(callback: () => Promise<DataOrError<Buffer>>) {
    const begin = performance.now();
    const result = await callback();
    const lapsed = performance.now() - begin;
    if (result.err !== undefined) {
        console.error(result.err);
    } else {
        fs.writeFileSync(join(__dirname, "..", "result.webp"), result.data);
    }

    logger.info(`Finished after ${lapsed.toFixed(1)}ms`);
    process.exit(0);
}

export async function moduleTestWrapper(width: number, height: number, useCheckerBoard: boolean, callback: (canvas: Canvas) => Promise<Canvas>) {
    const canvas = useCheckerBoard ? await createCheckerBoardCanvas(width, height, "image") : new Canvas(width, height, "image");
    const result = await callback(canvas);
    fs.writeFileSync(join(__dirname, "..", "result.webp"), await sharp(result.toBuffer("image/png")).webp({ quality: 100 }).toBuffer());
    process.exit(0);
}

const alphabet = "abcdefghijklmnopqrstuvwxyz";
const number = "1234567890";
export function getRandomChar(charset = `${alphabet}${alphabet.toUpperCase()}${number}`) {
    return charset[Math.floor(charset.length * Math.random())];
}
export function getRandomEnum<T extends object>(anEnum: T): T[keyof T] {
    const enumValues = Object.values(anEnum) as unknown as T[keyof T][];
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    const randomEnumValue = enumValues[randomIndex];
    return randomEnumValue;
}

export function getRandomString(length: number, charset?: string) {
    return Array.from({ length }, () => getRandomChar(charset)).join("");
}
