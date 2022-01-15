import config from "../config";
import Game from "./Game";

export default function genSurvivalArena(game: Game) {
  game.physBounds = [config.mapScale / 4, config.mapScale / 4];
}
