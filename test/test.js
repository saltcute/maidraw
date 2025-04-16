switch (process.argv[2]) {
    case "maimai":
        require("./maimai");
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
    default:
        console.log("No test found.");
        break;
}
