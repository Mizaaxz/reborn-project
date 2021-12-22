import fs from "fs";

let logFilePath = "";

function getDate() {
  return new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
}
function log(data: string) {
  let old = String(fs.readFileSync(logFilePath));
  fs.writeFileSync(logFilePath, `${old}\n[${getDate()}] ${data}`);
}
function initLogs() {
  logFilePath = `data/server.log`;
  if (fs.existsSync(logFilePath))
    fs.renameSync(
      logFilePath,
      logFilePath.replace("server", `server_${Date.now()}`)
    );
  fs.writeFileSync(logFilePath, `[${getDate()}] Server Started.`);
}
function returnLogs(lines: number) {
  let content = String(fs.readFileSync(logFilePath)).split("\n");
  return content.slice(content.length - lines, content.length).join("\n");
}

export { log, initLogs, returnLogs };
