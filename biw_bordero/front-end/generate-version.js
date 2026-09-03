import fs from "fs";

const version = new Date().toISOString();

fs.writeFileSync("./dist/version.json", JSON.stringify({ version }, null, 2));

console.log("version.json gerado:", version);
