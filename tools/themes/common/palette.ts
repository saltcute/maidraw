/**
 * Difficulty bubble colours.
 *
 * Only three distinct palettes exist across every theme in the repository, one per game, so they
 * live here instead of being repeated in each manifest.
 */
export const maimaiDifficultyColors = {
    basic: "#70E262",
    advanced: "#FFBB00",
    expert: "#FF4A5A",
    master: "#A04FDA",
    remaster: "#DDBDF5",
    utage: "#70E262",
} as const;

export const chunithmDifficultyColors = {
    basic: "#70E262",
    advanced: "#FFBB00",
    expert: "#FF4A5A",
    master: "#A04FDA",
    ultima: "#591C28",
    worldsEnd: "#70E262",
} as const;

export const ongekiDifficultyColors = {
    basic: "#70E262",
    advanced: "#FFBB00",
    expert: "#FF4A5A",
    master: "#A04FDA",
    lunatic: "#591C28",
} as const;
