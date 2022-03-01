import { Animals } from "../sanctuary/util";
import Game from "./Game";

export default function generateBossArena(game: Game) {
  let loc = game.bossLoc;
  let locsize = 777;
  let beginLoc = loc.subtract(locsize, locsize, true);
  let endLoc = loc.add(locsize, locsize, true);
  let locpad = 250;

  game.state.gameObjects
    .filter(
      (o) =>
        o.location.x < endLoc.x + locpad &&
        o.location.x > beginLoc.x - locpad &&
        o.location.y < endLoc.y + locpad &&
        o.location.y > beginLoc.y - locpad
    )
    .map((g) => game.state.removeGameObject(g));

  function genStone(x: number, y: number) {
    game.generateStructure("stone", loc.x + x, loc.y + y, 115);
  }

  let rockAngles: number[] = [];
  let rockBlacklist: number[] = [];
  for (let i = 0; i <= 15; i++) {
    rockBlacklist.push(i);
  }
  for (let i = 350; i <= 365; i++) {
    rockBlacklist.push(i);
  }
  for (let i = 0; i <= 365; i += 11) {
    if (!rockBlacklist.includes(i)) rockAngles.push(i);
  }
  rockAngles.forEach((r) => {
    genStone(
      Math.cos((r * Math.PI) / 180) * locsize,
      Math.sin((r * Math.PI) / 180) * locsize
    );
  });

  game.generateStructure("s", endLoc.x + 90, loc.y + 20, 115);

  summonBossAnimals(game);
}

export function summonBossAnimals(game: Game) {
  game.state.animals
    .filter(
      (a) =>
        a.type == Animals.moostafa ||
        a.type == Animals.moofie ||
        a.type == Animals.treasure
    )
    .map((a) => game.killAnimal(a));

  game.state.addAnimal(
    game.genAnimalSID(),
    game.bossLoc,
    Math.random() > 0.5 ? Animals.moostafa : Animals.moofie,
    "Boss"
  );
  game.state.addAnimal(
    game.genAnimalSID(),
    game.bossLoc,
    Animals.treasure,
    "Treasure"
  );
}
