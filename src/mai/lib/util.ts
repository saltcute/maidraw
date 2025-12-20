import _ from "lodash";

import { EAchievementTypes } from "../type";
import { Database } from "./database";
import Util from "@maidraw/lib/util";

export namespace MaimaiUtil {
    export class Version {
        static readonly DX = {
            name: "maimai でらっくす",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 0,
            },
        };
        static readonly DX_PLUS = {
            name: "maimai でらっくす PLUS",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 5,
            },
        };
        static readonly SPLASH = {
            name: "maimai でらっくす Splash",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 10,
            },
        };
        static readonly SPLASH_PLUS = {
            name: "maimai でらっくす Splash PLUS",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 15,
            },
        };
        static readonly UNIVERSE = {
            name: "maimai でらっくす UNiVERSE",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 20,
            },
        };
        static readonly UNIVERSE_PLUS = {
            name: "maimai でらっくす UNiVERSE PLUS",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 25,
            },
        };
        static readonly FESTIVAL = {
            name: "maimai でらっくす FESTiVAL",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 30,
            },
        };
        static readonly FESTIVAL_PLUS = {
            name: "maimai でらっくす FESTiVAL PLUS",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 35,
            },
        };
        static readonly BUDDIES = {
            name: "maimai でらっくす BUDDiES",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 40,
            },
        };
        static readonly BUDDIES_PLUS = {
            name: "maimai でらっくす BUDDiES PLUS",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 45,
            },
        };
        static readonly PRISM = {
            name: "maimai でらっくす PRiSM",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 50,
            },
        };
        static readonly PRISM_PLUS = {
            name: "maimai でらっくす PRiSM PLUS",
            gameVersion: {
                isDX: true,
                major: 1,
                minor: 55,
            },
        };
        private static versions: Database.IVersion[] = [
            Version.DX,
            Version.DX_PLUS,
            Version.SPLASH,
            Version.SPLASH_PLUS,
            Version.UNIVERSE,
            Version.UNIVERSE_PLUS,
            Version.FESTIVAL,
            Version.FESTIVAL_PLUS,
            Version.BUDDIES,
            Version.BUDDIES_PLUS,
            Version.PRISM,
            Version.PRISM_PLUS,
        ];
        static getNextVersion(version: Database.IVersion) {
            const index = _.findIndex(Version.versions, (v) => {
                return (
                    _.isEqual(v.gameVersion.isDX, version.gameVersion.isDX) &&
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
                region: "DX",
            };
            event.gameVersion.release = 0;
            return event as Database.IEventVersion;
        }
    }
    export const RATING_CONSTANTS = {
        [EAchievementTypes.D]: {
            [0.4]: 6.4,
            [0.3]: 4.8,
            [0.2]: 3.2,
            [0.1]: 1.6,
            [0]: 0,
        },
        [EAchievementTypes.C]: 13.6,
        [EAchievementTypes.B]: 13.6,
        [EAchievementTypes.BB]: 13.6,
        [EAchievementTypes.BBB]: 13.6,
        [EAchievementTypes.A]: 13.6,
        [EAchievementTypes.AA]: 15.2,
        [EAchievementTypes.AAA]: 16.8,
        [EAchievementTypes.S]: 20.0,
        [EAchievementTypes.SP]: 20.3,
        [EAchievementTypes.SS]: 20.8,
        [EAchievementTypes.SSP]: 21.1,
        [EAchievementTypes.SSS]: 21.6,
        [EAchievementTypes.SSSP]: 22.4,
    };
    /**
     * Calculate the rating of a score.
     * @param internalLevel Internal level of the chart.
     * @param achievement Achivement in percentage, range between 0 to 101.0000.
     * @returns Raw decimal rating value.
     */
    export function calculateRating(
        internalLevel: number,
        achievement: number
    ): number {
        let ratingConstant = 0;
        switch (true) {
            case achievement >= 100.5: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.SSSP];
                break;
            }
            case achievement >= 100: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.SSS];
                break;
            }
            case achievement >= 99.5: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.SSP];
                break;
            }
            case achievement >= 99: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.SS];
                break;
            }
            case achievement >= 98: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.SP];
                break;
            }
            case achievement >= 97: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.S];
                break;
            }
            case achievement >= 94: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.AAA];
                break;
            }
            case achievement >= 90: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.AA];
                break;
            }
            case achievement >= 80: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.A];
                break;
            }
            case achievement >= 75: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.BBB];
                break;
            }
            case achievement >= 70: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.BB];
                break;
            }
            case achievement >= 60: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.B];
                break;
            }
            case achievement >= 50: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.C];
                break;
            }
            case achievement >= 40: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.D]["0.4"];
                break;
            }
            case achievement >= 30: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.D]["0.3"];
                break;
            }
            case achievement >= 20: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.D]["0.2"];
                break;
            }
            case achievement >= 10: {
                ratingConstant = RATING_CONSTANTS[EAchievementTypes.D]["0.1"];
                break;
            }
        }
        return Util.truncateNumber(
            (Math.min(achievement, 100.5) / 100) *
                ratingConstant *
                internalLevel,
            0
        );
    }
}
