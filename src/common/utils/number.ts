/**
 * Pretty much ignores percision loss.
 */
export function truncate(payload: number, percision: number, roundingPosition: number = 10): string {
    const str = payload.toFixed(roundingPosition);
    let [int, dec] = str.split(".");
    if (!int) int = "";
    if (!dec) dec = "";
    if (percision <= 0) return int;
    return `${int}.${dec.substring(0, percision).padEnd(percision, "0")}`;
}
export function truncateNumber(payload: number, percision: number, roundingPosition: number = 10): number {
    return parseFloat(truncate(payload, percision, roundingPosition));
}
/**
 * Dirty implementation, pretty much ignores percision loss.
 */
export function ceilWithPercision(payload: number, percision: number): string {
    const str = payload.toString();
    let [int, dec] = str.split(".");
    if (!int) int = "";
    if (!dec) {
        if (percision <= 0) return `${int}`;
        else return `${int}.${"0".repeat(percision)}`;
    } else {
        if (percision <= 0) return `${parseInt(int, 10) + 1}`;
        else {
            if (dec.length < percision) return `${int}.${dec.padEnd(percision, "0")}`;
            const result = Math.ceil(parseFloat(`${int}${dec.substring(0, percision)}.${dec.substring(percision)}`)).toString();
            if (result.length < percision) return result;
            return `${result.substring(0, result.length - percision)}.${result.substring(result.length - percision)}`;
        }
    }
}
