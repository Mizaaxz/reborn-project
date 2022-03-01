import { getGroupID, getPPS } from "../items/items";
import { getHat } from "../sanctuary/Hats";
import { PlayerMode } from "../sanctuary/PlayerMode";
import Game from "./Game";
import { GameModes } from "./GameMode";

export default function updateWindmills(game: Game) {
  game.windmillTicks++;
  game.state.gameObjects
    .filter(
      (gameObj) => gameObj.isPlayerGameObject() && getGroupID(gameObj.data) == 3
    )
    .forEach((windmill) => {
      let player = game.state.players.find(
        (player) => player.id == windmill.ownerSID
      );
      if (player && !player.dead) {
        let pps = getPPS(windmill.data);
        player.points += pps;
        player.xp += pps;
        player.score += pps;
      }
    });
  game.state.players.forEach((plr) => {
    let hat = getHat(plr.hatID);
    if (!plr.dead && hat?.pps) {
      plr.points += hat.pps;
      plr.xp += hat.pps;
      plr.score += hat.pps;
    }
  });

  if (game.mode.includes(GameModes.random) && game.windmillTicks % 10 == 0)
    game.randomizePlayers();

  let waitTickAmt = 5;
  if (game.spikeAdvance > 6800) waitTickAmt = 15;
  else if (game.spikeAdvance > 6000) waitTickAmt = 10;
  else if (game.spikeAdvance > 4500) waitTickAmt = 5;
  else if (game.spikeAdvance > 3000) waitTickAmt = 2;
  else if (game.spikeAdvance > 1500) waitTickAmt = 7;
  if (
    game.mode.includes(GameModes.royale) &&
    game.windmillTicks % waitTickAmt == 0
  ) {
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
    game.state.tribes.map((t) => t.delete());
  }
}
