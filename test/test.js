const fs = require("fs");
const upath = require("upath");

if (fs.existsSync(upath.join(__dirname, ...process.argv.slice(2)))) {
    require(upath.join(__dirname, ...process.argv.slice(2)));
} else {
    console.log("No test found.");
}
