import upath from "upath";

try {
    console.log(`Running test ${upath.join(__dirname, ...process.argv.slice(2))}`);
    require(upath.join(__dirname, ...process.argv.slice(2)));
} catch (e) {
    console.error(e);
    console.log("No test found.");
}
