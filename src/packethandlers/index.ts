import fs from "fs";
import Game from "../game/Game";

export default function initPacketHandlers(game: Game) {
  let dir = __dirname + "/";
  fs.readdirSync(dir).forEach((p) => {
    if (p !== "index.js" && p !== "template.js") {
      require(dir + p);
    }
  });
}
