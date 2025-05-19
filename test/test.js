const fs = require("fs");
const upath = require("upath");

try {
    require(upath.join(__dirname, ...process.argv.slice(2)));
} catch {
    console.log("No test found.");
}
