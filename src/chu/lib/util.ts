import _ from "lodash";

import Util from "@maidraw/lib/util";
import { Database } from "./database";

export namespace ChunithmUtil {
    export class Version {
        static readonly CHUNITHM = {
            name: "CHUNITHM",
            gameVersion: {
                major: 1,
                minor: 0,
            },
        };
        static readonly CHUNITHM_PLUS = {
            name: "CHUNITHM PLUS",
            gameVersion: {
                major: 1,
                minor: 5,
            },
        };
        static readonly AIR = {
            name: "CHUNITHM AIR",
            gameVersion: {
                major: 1,
                minor: 10,
            },
        };
        static readonly AIR_PLUS = {
            name: "CHUNITHM AIR PLUS",
            gameVersion: {
                major: 1,
                minor: 15,
            },
        };
        static readonly STAR = {
            name: "CHUNITHM STAR",
            gameVersion: {
                major: 1,
                minor: 20,
            },
        };
        static readonly STAR_PLUS = {
            name: "CHUNITHM STAR PLUS",
            gameVersion: {
                major: 1,
                minor: 25,
            },
        };
        static readonly AMAZON = {
            name: "CHUNITHM AMAZON",
            gameVersion: {
                major: 1,
                minor: 30,
            },
        };
        static readonly AMAZON_PLUS = {
            name: "CHUNITHM AMAZON PLUS",
            gameVersion: {
                major: 1,
                minor: 35,
            },
        };
        static readonly CRYSTAL = {
            name: "CHUNITHM CRYSTAL",
            gameVersion: {
                major: 1,
                minor: 40,
            },
        };
        static readonly CRYSTAL_PLUS = {
            name: "CHUNITHM CRYSTAL PLUS",
            gameVersion: {
                major: 1,
                minor: 45,
            },
        };
        static readonly PARADISE = {
            name: "CHUNITHM PARADISE",
            gameVersion: {
                major: 1,
                minor: 50,
            },
        };
        static readonly NEW = {
            name: "CHUNITHM NEW!!",
            gameVersion: {
                major: 2,
                minor: 0,
            },
        };
        static readonly NEW_PLUS = {
            name: "CHUNITHM NEW PLUS!!",
            gameVersion: {
                major: 2,
                minor: 5,
            },
        };
        static readonly SUN = {
            name: "CHUNITHM SUN",
            gameVersion: {
                major: 2,
                minor: 10,
            },
        };
        static readonly SUN_PLUS = {
            name: "CHUNITHM SUN PLUS",
            gameVersion: {
                major: 2,
                minor: 15,
            },
        };
        static readonly LUMINOUS = {
            name: "CHUNITHM LUMINOUS",
            gameVersion: {
                major: 2,
                minor: 20,
            },
        };
        static readonly LUMINOUS_PLUS = {
            name: "CHUNITHM LUMINOUS PLUS",
            gameVersion: {
                major: 2,
                minor: 25,
            },
        };
        static readonly VERSE = {
            name: "CHUNITHM VERSE",
            gameVersion: {
                major: 2,
                minor: 30,
            },
        };
        static readonly X_VERSE = {
            name: "CHUNITHM X-VERSE",
            gameVersion: {
                major: 2,
                minor: 40,
            },
        };
        private static versions: Database.IVersion[] = [
            Version.CHUNITHM,
            Version.CHUNITHM_PLUS,
            Version.AIR,
            Version.AIR_PLUS,
            Version.STAR,
            Version.STAR_PLUS,
            Version.AMAZON,
            Version.AMAZON_PLUS,
            Version.CRYSTAL,
            Version.CRYSTAL_PLUS,
            Version.PARADISE,
            Version.NEW,
            Version.NEW_PLUS,
            Version.SUN,
            Version.SUN_PLUS,
            Version.LUMINOUS,
            Version.LUMINOUS_PLUS,
            Version.VERSE,
            Version.X_VERSE,
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
    } /**
     * Calculate the rating of a score.
     * @param internalLevel Internal level of the chart.
     * @param score Score, range between 0 to 1010000.
     * @returns Raw decimal rating value.
     */
    export function calculateRating(
        internalLevel: number,
        score: number
    ): number {
        let bonus = 0;
        switch (true) {
            case score >= 1009000: {
                bonus = 2.15;
                break;
            }
            case score >= 1007500: {
                bonus =
                    2 + Util.truncateNumber((score - 1007500) / 100, 0) * 0.01;
                break;
            }
            case score >= 1005000: {
                bonus =
                    1.5 + Util.truncateNumber((score - 1005000) / 50, 0) * 0.01;
                break;
            }
            case score >= 1000000: {
                bonus =
                    1 + Util.truncateNumber((score - 1000000) / 100, 0) * 0.01;
                break;
            }
            case score >= 975000: {
                bonus =
                    0 + Util.truncateNumber((score - 975000) / 250, 0) * 0.01;
                break;
            }
            // case score >= 925000: {
            //     bonus = 0 - ((975000 - score) / 50000) * 3.0;
            //     break;
            // }
            // case score >= 900000: {
            //     bonus = -3.0 - ((925000 - score) / 50000) * 2.0;
            //     break;
            // }
            case score >= 900000: {
                bonus = -0.0 - ((975000 - score) / 75000) * 5.0;
                break;
            }
            case score >= 800000: {
                bonus =
                    -5.0 -
                    ((900000 - score) / 100000) * ((internalLevel - 5.0) / 2);
                break;
            }
            case score >= 500000: {
                bonus =
                    -5.0 -
                    (internalLevel - 5.0) / 2 -
                    ((800000 - score) / 300000) * ((internalLevel - 5.0) / 2);
                break;
            }
            default: {
                bonus = -internalLevel;
            }
        }
        return internalLevel + bonus;
    }
}
