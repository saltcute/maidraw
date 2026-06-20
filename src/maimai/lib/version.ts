import type { Regions } from "gcm-database-local/maimai";

export const DX_LATEST = 65;
export const EX_LATEST = 60;
export const CN_LATEST = 55;

const MAIMAI_VERSIONS = [99, 95, 90, 85, 80, 70, 60, 50, 40, 30, 20, 10, 0] as const;
const MAIMAIDX_VERSIONS = [65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0] as const;
const WUMENGDX_VERSIONS = [55, 50, 40, 30, 20, 10, 0] as const;

const targetMap = {
    // biome-ignore lint/style/useNamingConvention: region code
    OLD: MAIMAI_VERSIONS,
    // biome-ignore lint/style/useNamingConvention: region code
    DX: MAIMAIDX_VERSIONS,
    // biome-ignore lint/style/useNamingConvention: region code
    EX: MAIMAIDX_VERSIONS,
    // biome-ignore lint/style/useNamingConvention: region code
    CN: WUMENGDX_VERSIONS,
};

function getTargetFromRegion<T extends Regions>(major: number, region: T) {
    return major >= 2 ? targetMap[region] : targetMap.OLD;
}

export function findMinorVersion(major: number, minor: number, region: Regions) {
    return getTargetFromRegion(major, region).find((v) => minor >= v) ?? null;
}

export function findNewerMinorVersion(major: number, minor: number, region: Regions) {
    const target = getTargetFromRegion(major, region);
    const adjustedMinor = findMinorVersion(major, minor, region);
    if (!adjustedMinor) return null;
    const indexOfCurrentVersion = (target as unknown as number[]).indexOf(adjustedMinor);
    return target[indexOfCurrentVersion - 1] ?? null;
}

export function findOlderMinorVersion(major: number, minor: number, region: Regions) {
    const target = getTargetFromRegion(major, region);
    const adjustedMinor = findMinorVersion(major, minor, region);
    if (!adjustedMinor) return null;
    const indexOfCurrentVersion = (target as unknown as number[]).indexOf(adjustedMinor);
    return target[indexOfCurrentVersion + 1] ?? null;
}
