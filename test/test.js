switch (process.argv[2]) {
    case "maimai":
        require("./maimai");
        break;
    case "chunithm":
        require("./chunithm");
        break;
    default:
        console.log("No test found.");
        break;
}
