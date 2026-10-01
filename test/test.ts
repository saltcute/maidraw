import upath from "upath";
import "../src/common/utils/injectThrowIf";

const testPath = process.argv.length > 2 ? process.argv.slice(2) : [process.env.TEST_PATH ?? ""];

try {
    console.log(`Running test ${upath.join(__dirname, ...testPath)}`);
    require(upath.join(__dirname, ...testPath));
} catch (e) {
    console.error(e);
    console.log("No test found.");
}
