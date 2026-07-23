import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("[build] Building server in server/ directory...");
execSync("npm install && npm run build", {
  cwd: path.join(process.cwd(), "server"),
  stdio: "inherit",
});

console.log("[build] Creating root dist/index.js entrypoint for Render...");
const distDir = path.join(process.cwd(), "dist");
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(
  path.join(distDir, "index.js"),
  'import "../server/dist/index.js";\n',
  "utf8"
);

console.log("[build] Successfully prepared dist/index.js!");
