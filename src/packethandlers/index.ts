import fs from "fs";
import Game from "../moomoo/Game";

export default function initPacketHandlers(game: Game) {
  let dir = __dirname + "/";
  fs.readdirSync(dir).forEach((p) => {
    if (p !== "index.js") {
      require(dir + p);
    }
  });
}
