import _ from "lodash";

import Util from "@maidraw/lib/util";
import { Database } from "./database";
import { EBellTypes, EComboTypes } from "../type";

export namespace OngekiUtil {
    export class Version {
        static readonly ONGEKI = {
            name: "オンゲキ",
            gameVersion: {
                major: 1,
                minor: 0,
            },
        };
        static readonly ONGEKI_PLUS = {
            name: "オンゲキ PLUS",
            gameVersion: {
                major: 1,
                minor: 10,
            },
        };
        static readonly SUMMER = {
            name: "オンゲキ SUMMER",
            gameVersion: {
                major: 1,
                minor: 10,
            },
        };
        static readonly SUMMER_PLUS = {
            name: "オンゲキ SUMMER PLUS",
            gameVersion: {
                major: 1,
                minor: 15,
            },
        };
        static readonly RED = {
            name: "オンゲキ R.E.D.",
            gameVersion: {
                major: 1,
                minor: 20,
            },
        };
        static readonly RED_PLUS = {
            name: "オンゲキ R.E.D. PLUS",
            gameVersion: {
                major: 1,
                minor: 25,
            },
        };
        static readonly BRIGHT = {
            name: "オンゲキ bright",
            gameVersion: {
                major: 1,
                minor: 30,
            },
        };
        static readonly BRIGHT_MEMORY_ACT1 = {
            name: "オンゲキ bright MEMORY Act.1",
            gameVersion: {
                major: 1,
                minor: 35,
            },
        };
        static readonly BRIGHT_MEMORY_ACT2 = {
            name: "オンゲキ bright MEMORY Act.2",
            gameVersion: {
                major: 1,
                minor: 40,
            },
        };
        static readonly BRIGHT_MEMORY_ACT3 = {
            name: "オンゲキ bright MEMORY Act.3",
            gameVersion: {
                major: 1,
                minor: 45,
            },
        };
        static readonly REFRESH = {
            name: "オンゲキ Re:Fresh",
            gameVersion: {
                major: 1,
                minor: 50,
            },
        };

        private static versions: Database.IVersion[] = [
            Version.ONGEKI,
            Version.ONGEKI_PLUS,
            Version.SUMMER,
            Version.SUMMER_PLUS,
            Version.RED,
            Version.RED_PLUS,
            Version.BRIGHT,
            Version.BRIGHT_MEMORY_ACT1,
            Version.BRIGHT_MEMORY_ACT2,
            Version.BRIGHT_MEMORY_ACT3,
            Version.REFRESH,
        ];
        static getNextVersion(version: Database.IVersion) {
            const index = _.findIndex(Version.versions, (v) => {
                return (
                    _.isEqual(v.gameVersion.major, version.gameVersion.major) &&
                    _.isEqual(v.gameVersion.minor, version.gameVersion.minor)
                );
            });
            if (index == -1) {
                return version;
            } else if (index == this.versions.length - 1) {
                return this.versions[index];
            }
            return this.versions[index + 1];
        }
        static getPreviousVersion(version: Database.IVersion) {
            const index = _.findIndex(Version.versions, (v) => {
                return _.isEqual(v.gameVersion, version.gameVersion);
            });
            if (index == -1) {
                return version;
            } else if (index == 0) {
                return this.versions[index];
            }
            return this.versions[index - 1];
        }
        static toEventVersion(version: Database.IVersion) {
            const event = {
                ...version,
                region: "JPN",
            };
            event.gameVersion.release = 0;
            return event as Database.IEventVersion;
        }
    }
    export function getNumberVersion(version: Database.IVersion) {
        return version.gameVersion.major * 100 + version.gameVersion.minor;
    }
    /**
     * Calculate the rating of a score.
     * @param internalLevel Internal level of the chart.
     * @param score Score, range between 0 to 1010000.
     * @param bell Full Bell or None.
     * @param combo All Break Plus, All Break, Full Combo or None.
     * @returns Raw decimal rating value.
     */
    export function calculateReFreshScoreRating(
        internalLevel: number,
        score: number,
        bell: EBellTypes,
        combo: EComboTypes
    ): number {
        let bonus = 0,
            scoreCoef = 0;
        switch (true) {
            case score >= 1010000: {
                scoreCoef = 2.0;
                break;
            }
            case score >= 1007500: {
                // scoreCoef = 1.75 + ((score - 1007500) / 2500) * 0.25;
                scoreCoef = 1.75 + (score - 1007500) / 10000;
                bonus += 0.3; // SSS+ bonus;
                break;
            }
            case score >= 1000000: {
                // scoreCoef = 1.25 + ((score - 1000000) / 7500) * 0.5;
                scoreCoef = 1.25 + (score - 1000000) / 15000;
                bonus += 0.2; // SSS bonus;
                break;
            }
            case score >= 990000: {
                // scoreCoef = 0.75 + ((score - 990000) / 10000) * 0.5;
                scoreCoef = 0.75 + (score - 990000) / 20000;
                bonus += 0.1; // SS bonus;
                break;
            }
            case score >= 970000: {
                // scoreCoef = 0 + ((score - 970000) / 20000) * 0.75;
                scoreCoef = 0 + ((score - 970000) / 80000) * 3;
                break;
            }
            case score >= 900000: {
                scoreCoef = -4.0 - ((900000 - score) / 70000) * 4.0;
                break;
            }
            case score >= 800000: {
                scoreCoef = -6.0 - ((800000 - score) / 100000) * 2.0;
                break;
            }
            default: {
                scoreCoef =
                    -internalLevel - (-score / 800000) * (internalLevel - 6.0);
            }
        }
        switch (bell) {
            case EBellTypes.FULL_BELL:
                bonus += 0.05;
                break;
        }
        switch (combo) {
            case EComboTypes.ALL_BREAK_PLUS:
                bonus += 0.35;
                break;
            case EComboTypes.ALL_BREAK:
                bonus += 0.3;
                break;
            case EComboTypes.FULL_COMBO:
                bonus += 0.1;
                break;
        }

        return Math.max(
            0,
            parseFloat(
                (
                    internalLevel +
                    Util.truncateNumber(scoreCoef, 3) +
                    bonus
                ).toFixed(3)
            )
        );
    }

    export function getStar(starRatio: number) {
        let starCount = 0;
        if (starRatio >= 0.98) starCount = 5;
        else if (starRatio >= 0.97) starCount = 4;
        else if (starRatio >= 0.96) starCount = 3;
        else if (starRatio >= 0.95) starCount = 2;
        else if (starRatio >= 0.94) starCount = 1;
        return starCount;
    }

    export function calculateReFreshStarRating(
        internalLevel: number,
        starCount: number
    ) {
        return Math.floor(starCount * internalLevel * internalLevel) / 1000;
    }

    export function calculateScoreRating(internalLevel: number, score: number) {
        let scoreCoef = 0;
        switch (true) {
            case score >= 1007500: {
                scoreCoef = 2.0;
                break;
            }
            case score >= 1000000: {
                scoreCoef = 1.5 + ((score - 1000000) / 7500) * 0.5;
                break;
            }
            case score >= 970000: {
                scoreCoef = 0 + ((score - 970000) / 30000) * 1.5;
                break;
            }
            case score >= 900000: {
                scoreCoef = -4.0 - ((900000 - score) / 70000) * 4.0;
                break;
            }
            case score >= 800000: {
                scoreCoef = -6.0 - ((800000 - score) / 100000) * 2.0;
                break;
            }
            default: {
                scoreCoef =
                    -internalLevel - (-score / 800000) * (internalLevel - 6.0);
            }
        }

        return Math.max(0, internalLevel + Util.truncateNumber(scoreCoef, 2));
    }
}
