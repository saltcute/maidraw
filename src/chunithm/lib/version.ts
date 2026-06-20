import type { Regions } from "gcm-database-local/chunithm";

export const JPN_LATEST = 245;
export const INT_LATEST = 140;
export const CHN_LATEST = 120;

const CHUNITHM_VERSIONS = [245, 240, 230, 225, 220, 215, 210, 205, 200, 155, 150, 145, 140, 135, 130, 125, 120, 115, 110, 105, 100] as const;
const CHUNITHM_INT_VERSIONS = [140, 135, 130, 125, 120, 115, 110, 105, 100] as const;
const ZHONGERJIEZOU_VERSIONS = [120, 110, 100] as const;

const targetMap = {
    // biome-ignore lint/style/useNamingConvention: region code
    JPN: CHUNITHM_VERSIONS,
    // biome-ignore lint/style/useNamingConvention: region code
    INT: CHUNITHM_INT_VERSIONS,
    // biome-ignore lint/style/useNamingConvention: region code
    CHN: ZHONGERJIEZOU_VERSIONS,
};

function getTargetFromRegion<T extends Regions>(region: T) {
    return targetMap[region];
}

export function getNumberVersion(major: number, minor: number) {
    return major * 100 + minor;
}

export function findVersion(major: number, minor: number, region: Regions) {
    return getTargetFromRegion(region).find((v) => getNumberVersion(major, minor) >= v) ?? null;
}

export function findNewerVersion(major: number, minor: number, region: Regions) {
    const target = getTargetFromRegion(region);
    const adjustedMinor = findVersion(major, minor, region);
    if (!adjustedMinor) return null;
    const indexOfCurrentVersion = (target as unknown as number[]).indexOf(adjustedMinor);
    return target[indexOfCurrentVersion - 1] ?? null;
}

export function findOlderMinorVersion(major: number, minor: number, region: Regions) {
    const target = getTargetFromRegion(region);
    const adjustedMinor = findVersion(major, minor, region);
    if (!adjustedMinor) return null;
    const indexOfCurrentVersion = (target as unknown as number[]).indexOf(adjustedMinor);
    return target[indexOfCurrentVersion + 1] ?? null;
}
