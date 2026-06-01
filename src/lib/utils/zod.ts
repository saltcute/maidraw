import Color from "color";
import z from "zod/v4";

export function color() {
    return z.string().refine((str) => {
        try {
            new Color(str);
            return true;
        } catch {
            return false;
        }
    });
}
