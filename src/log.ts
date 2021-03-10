import fs from "fs";

let logFilePath = "";

function getDate() {
  return new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
}
function log(data: string) {
  fs.writeFileSync(logFilePath, `\n[${getDate()}] ${data}`);
}
function initLogs() {
  logFilePath = `data/server.log`;
  fs.writeFileSync(logFilePath, `[${getDate()}] Server Started.`);
}
function returnLogs(lines: number) {
  return String(fs.readFileSync(logFilePath));
}

export { log, initLogs, returnLogs };
