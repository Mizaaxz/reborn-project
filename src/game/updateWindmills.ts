import { getGroupID, getPPS } from "../items/items";
import { getHat } from "../moomoo/Hats";
import { PlayerMode } from "../moomoo/PlayerMode";
import Game from "./Game";
import { GameModes } from "./GameMode";

export default function updateWindmills(game: Game) {
  game.windmillTicks++;
  for (let windmill of game.state.gameObjects.filter(
    (gameObj) => gameObj.isPlayerGameObject() && getGroupID(gameObj.data) == 3
  )) {
    let player = game.state.players.find((player) => player.id == windmill.ownerSID);

    if (player && !player.dead) {
      let hat = getHat(player.hatID);

      player.points += getPPS(windmill.data) + (hat?.pps || 0);
      player.xp += getPPS(windmill.data) + (hat?.pps || 0);
    }
  }

  if (game.mode.includes(GameModes.random) && game.windmillTicks % 10 == 0) game.randomizePlayers();

  let waitTickAmt = 5;
  if (game.spikeAdvance > 6800) waitTickAmt = 15;
  else if (game.spikeAdvance > 6000) waitTickAmt = 10;
  else if (game.spikeAdvance > 4500) waitTickAmt = 5;
  else if (game.spikeAdvance > 3000) waitTickAmt = 2;
  else if (game.spikeAdvance > 1500) waitTickAmt = 7;
  if (game.mode.includes(GameModes.royale) && game.windmillTicks % waitTickAmt == 0) {
    game.advanceSpikes();
    game.state.players.forEach((p) => {
      if (
        ((p.invincible && p.mode !== PlayerMode.spectator) ||
          (p.mode == PlayerMode.spectator &&
            (!p.hideLeaderboard || p.invisible) &&
            !getHat(p.hatID)?.invisTimer)) &&
        !p.dead
      )
        p.die();
    });
    game.state.tribes.forEach((t) => {
      game.state.removeTribe(game.state.tribes.indexOf(t));
    });
  }
}
