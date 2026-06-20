import type { Regions } from "gcm-database-local/ongeki";

export const JPN_LATEST = 150;

const ONGEKI_VERSIONS = [150, 145, 140, 135, 130, 125, 120, 115, 110, 105, 100] as const;

const targetMap = {
    // biome-ignore lint/style/useNamingConvention: region code
    JPN: ONGEKI_VERSIONS,
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

export function findOlderVersion(major: number, minor: number, region: Regions) {
    const target = getTargetFromRegion(region);
    const adjustedMinor = findVersion(major, minor, region);
    if (!adjustedMinor) return null;
    const indexOfCurrentVersion = (target as unknown as number[]).indexOf(adjustedMinor);
    return target[indexOfCurrentVersion + 1] ?? null;
}
