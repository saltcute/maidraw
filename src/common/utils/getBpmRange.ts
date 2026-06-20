import _ from "lodash";

export function getBpmRange(bpms: number[]) {
    const uniqueBpms = _.uniq(bpms);
    if (uniqueBpms.length <= 0) return "0";
    else if (uniqueBpms.length === 1) return `${uniqueBpms[0]}`;
    else {
        const minBpm = Math.min(...uniqueBpms);
        const maxBpm = Math.max(...uniqueBpms);
        return `${minBpm}-${maxBpm}`;
    }
}
