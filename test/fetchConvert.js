function convert(scores) {
    let arr = [];
    for (let score of scores) {
        arr.push({
            chart: {
                id: score.type == "dx" ? score.id + 10000 : score.id,
                name: score.song_name,
                difficulty: score.level_index,
                level: 13.7,
                maxDxScore: 6666
            },
            combo: (() => {
                switch (score.fc) {
                    case "fc":
                        return 1;
                    case "fcp":
                        return 2;
                    case "ap":
                        return 3;
                    case "app":
                        return 4;
                    default:
                        return 0;
                }
            })(),
            sync: (() => {
                switch (score.fs) {
                    case "sync":
                        return 1;
                    case "fs":
                        return 2;
                    case "fsp":
                        return 3;
                    case "fsd":
                        return 4;
                    case "fsdp":
                        return 5;
                    default:
                        return 0;
                }
            })(),
            achievement: score.achievements,
            dxScore: score.dx_score,
            dxRating: score.dx_rating,
        })
    }
    return arr;
}

const myHeaders = new Headers();
myHeaders.append("Authorization", "YLyt2PK5JIwwIDDIh0MJYXjK38Aim9cMSxiSgMfeTIE=");

const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
};

fetch("https://maimai.lxns.net/api/v0/maimai/player/211532943892789/bests", requestOptions)
.then((response) => response.json())
    .then((result) => {
        console.log(JSON.stringify(convert(result.data.dx)) + ",");
        console.log(JSON.stringify(convert(result.data.standard)));
    })
    .catch((error) => console.error(error));