import { loadImage as loadImageCanvas } from "canvas";
import sharp from "sharp";

/**
 * Safely load a image buffer in common formats to canvas.
 * Replaces the image with a placeholder checker board if the image provided is not recognizable.
 *
 * @param src Buffer containing image binary.
 * @returns Canvas Image.
 */
export async function loadImage(src: Buffer) {
    let safeImage: Buffer;
    try {
        safeImage = await sharp(src).png().toBuffer();
    } catch {
        const unitSize = 16,
            unitCount = 8,
            channels = 4;
        safeImage = Buffer.alloc(
            unitSize * unitSize * unitCount * unitCount * channels,
        );
        for (let i = 0; i < unitCount; ++i) {
            for (let j = 0; j < unitCount; ++j) {
                for (let x = i * unitSize; x < (i + 1) * unitSize; ++x) {
                    for (let y = j * unitSize; y < (j + 1) * unitSize; ++y) {
                        const idx = (y * unitSize * unitCount + x) * channels;
                        if ((i + j) % 2 === 0) {
                            safeImage[idx + 0] = 0xff;
                            safeImage[idx + 1] = 0x00;
                            safeImage[idx + 2] = 0xff;
                        } else {
                            safeImage[idx + 0] = 0x00;
                            safeImage[idx + 1] = 0x00;
                            safeImage[idx + 2] = 0x00;
                        }
                        safeImage[idx + 3] = 0xff;
                    }
                }
            }
        }
        safeImage = await sharp(safeImage, {
            raw: {
                width: unitSize * unitCount,
                height: unitSize * unitCount,
                channels: channels,
            },
        })
            .png()
            .toBuffer();
    }
    return loadImageCanvas(safeImage);
}
