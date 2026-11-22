// Runs the standalone server (required by next.config.mjs output: "standalone").
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const root = path.join(__dirname, "..");
const sa = path.join(root, ".next", "standalone");
if (!fs.existsSync(path.join(sa, "server.js"))) {
  console.error("No standalone build found. Run `npm run build` first.");
  process.exit(1);
}
// Standalone needs static assets + public alongside it.
const link = (src, dest) => {
  if (!fs.existsSync(src) || fs.existsSync(dest)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.symlinkSync(src, dest, "dir");
};
link(path.join(root, ".next", "static"), path.join(sa, ".next", "static"));
link(path.join(root, "public"), path.join(sa, "public"));
const child = spawn(process.execPath, ["server.js"], { cwd: sa, stdio: "inherit", env: process.env });
child.on("exit", (c) => process.exit(c ?? 0));
