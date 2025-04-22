switch (process.argv[2]) {
    case "maimai":
        switch (process.argv[3]) {
            case "render":
                require("./maimai/render");
                break;
            case "kamaifilters":
                require("./maimai/kamaifilters");
                break;
            default:
                console.log("No test found.");
                break;
        }
        break;
    case "chunithm":
        switch (process.argv[3]) {
            case "render":
                require("./chunithm/render");
                break;
            case "jacket":
                require("./chunithm/jacket");
                break;
            default:
                console.log("No test found.");
                break;
        }
        break;
    case "ongeki":
        switch (process.argv[3]) {
            case "render":
                require("./ongeki/render");
                break;
            case "jacket":
                require("./ongeki/jacket");
                break;
            default:
                console.log("No test found.");
                break;
        }
        break;
    default:
        console.log("No test found.");
        break;
}
