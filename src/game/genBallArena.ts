import Vec2 from "vec2";
import GameObject from "../gameobjects/GameObject";
import {
  getGameObjDamage,
  getGameObjHealth,
  getScale,
  WeaponModes,
  Weapons,
} from "../items/items";
import { ItemType } from "../items/UpgradeItems";
import Animal from "../moomoo/Animal";
import Player from "../moomoo/Player";
import { Animals } from "../moomoo/util";
import Game from "./Game";

export default function genBallArena(game: Game, makeTeams: boolean = true) {
  let loc = new Vec2(14400 / 2, 14400 / 2 - 1000);
  let wallPos = 0;
  let lastWallPos = 0;
  let wallCount = 0;
  let totalWalls = 10;

  let pos = {
    topleft: new Vec2(0, 0),
    topright: new Vec2(0, 0),
    bottomleft: new Vec2(0, 0),
    bottomright: new Vec2(0, 0),
  };
  let wallGen = [];

  while (wallCount < totalWalls) {
    let wallLoc = new Vec2(loc.x + wallPos, loc.y);
    wallGen.push([wallLoc.x, wallLoc.y]);
    wallCount++;
    wallPos += 100;
  }
  pos.bottomright = new Vec2(loc.x + wallPos - 100, loc.y);

  lastWallPos = wallPos;
  wallPos = 0;
  wallCount = 0;
  while (wallCount < totalWalls) {
    let wallLoc = new Vec2(loc.x + lastWallPos, loc.y + wallPos);
    wallGen.push([wallLoc.x, wallLoc.y]);
    wallCount++;
    wallPos -= 100;
  }
  pos.topright = new Vec2(loc.x + lastWallPos, loc.y + wallPos + 100);

  wallPos = -125;
  wallCount = 0;
  while (wallCount < totalWalls) {
    let wallLoc = new Vec2(loc.x + wallPos, loc.y);
    wallGen.push([wallLoc.x, wallLoc.y]);
    wallCount++;
    wallPos -= 100;
  }
  pos.bottomleft = new Vec2(loc.x + wallPos + 100, loc.y);

  lastWallPos = wallPos;
  wallPos = 0;
  wallCount = 0;
  while (wallCount < totalWalls) {
    let wallLoc = new Vec2(loc.x + lastWallPos, loc.y + wallPos);
    wallGen.push([wallLoc.x, wallLoc.y]);
    wallCount++;
    wallPos -= 100;
  }
  pos.topleft = new Vec2(loc.x + lastWallPos, loc.y + wallPos + 100);

  lastWallPos = wallPos;
  wallPos = -totalWalls * 100 - 100;
  wallCount = -2;
  while (wallCount < totalWalls * 2) {
    let wallLoc = new Vec2(loc.x + wallPos, loc.y + lastWallPos);
    wallGen.push([wallLoc.x, wallLoc.y]);
    wallCount++;
    wallPos += 100;
  }

  while (game.state.gameObjects?.length) {
    game.state.gameObjects.forEach((o) => {
      game.state.removeGameObject(o);
    });
  }
  if (game.spawnAnimalsInt) clearInterval(game.spawnAnimalsInt);
  while (game.state.animals?.length) {
    game.state.animals.forEach((a) => {
      a.die();
    });
  }

  wallGen.forEach((wall: any[]) => {
    game.generateStructure("stone:normal", wall[0], wall[1], 90);
  });

  let centerPos = new Vec2(
    pos.topleft.x + (pos.topright.x - pos.topleft.x) / 2,
    pos.topleft.y + (pos.bottomleft.y - pos.topleft.y) / 2
  );

  let startPadPos = pos.topleft.add(125, 40, true);
  let padGen: [number, number, number][] = [];
  let pad = ItemType.SpawnPad;
  let numPads = 9;
  while (numPads > 0) {
    padGen.push([startPadPos.x, startPadPos.y, 65]);
    startPadPos.add(0, getScale(pad) * 2);
    numPads--;
  }
  numPads = 9;
  startPadPos = pos.topright.subtract(125, 0, true);
  startPadPos.add(0, 40);
  while (numPads > 0) {
    padGen.push([startPadPos.x, startPadPos.y, 66]);
    startPadPos.add(0, getScale(pad) * 2);
    numPads--;
  }

  padGen.forEach((pd: number[]) => {
    game.state.gameObjects.push(
      new GameObject(
        game.getNextGameObjectID(),
        new Vec2(pd[0], pd[1]),
        0,
        getScale(pad),
        -1,
        undefined,
        pad,
        -pd[2],
        getGameObjHealth(pad),
        getGameObjDamage(pad),
        true
      )
    );
  });

  let playersArray = game.state.players.sort(() => {
    return 0.5 - Math.random();
  });
  let chunkLength = Math.max(playersArray?.length / 2, 1);
  let chunks = [];
  for (let i = 0; i < 2; i++) {
    if (chunkLength * (i + 1) <= playersArray?.length)
      chunks.push(playersArray.slice(chunkLength * i, chunkLength * (i + 1)));
  }
  if (!makeTeams) {
    let a = game.state.tribes.find((t) => t.name == "Team A");
    let b = game.state.tribes.find((t) => t.name == "Team B");
    if (!a || !b) return;
    chunks[0] = a.allMembers;
    chunks[1] = b.allMembers;
  }
  let playerTeams: { [key: string]: (Player | undefined)[] } = {
    a: chunks[0],
    b: chunks[1],
  };

  while (game.state.tribes?.length) {
    game.state.tribes.map((t) => t.delete());
  }

  Object.keys(playerTeams).forEach((letter) => {
    let players = playerTeams[letter];
    let tribe = game.state.addTribe(
      `Team ${letter.toUpperCase()}`,
      letter == "a" ? -65 : -66
    );
    if (typeof tribe == "boolean") return;
    players?.forEach((p) => {
      if (p && typeof tribe !== "boolean") {
        p.location =
          letter == "a"
            ? centerPos.subtract(750, 0, true)
            : centerPos.add(750, 0, true);
        p.selectedWeapon = Weapons.Sword;
        p.weaponMode = WeaponModes.NoSelect;
        p.primaryWeaponExp = p.secondaryWeaponExp = 0;
        p.invincible = true;
        p.spdMult = 3.5;
        game.sendGameObjects(p);
        tribe.addPlayer(p);
      }
    });
    game.state.updateClanPlayers(tribe);
  });

  game.state.animals.push(
    new Animal(game.genAnimalSID(), centerPos, Animals.moofieball, "Ball")
  );
  game.sendAnimalUpdates();
}
