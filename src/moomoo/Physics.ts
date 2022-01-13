import Vec2 from "vec2";
import Player from "./Player";
import GameObject from "../gameobjects/GameObject";
import {
  getGameObjLayer,
  getItem,
  getItemGroup,
  getWeaponAttackDetails,
  hasCollision,
} from "../items/items";
import GameState from "../game/GameState";
import { ItemType } from "../items/UpgradeItems";
import { getHat } from "./Hats";
import { PacketType } from "../packet/PacketType";
import { Packet } from "../packet/Packet";
import { PacketFactory } from "../packet/PacketFactory";
import Projectile from "../projectiles/Projectile";
import { getGame } from "../game/Game";
import { Animals, Biomes, Broadcast, randomPos, testBiome } from "./util";
import config from "../config";
import Animal from "./Animal";
import { PlayerMode } from "./PlayerMode";
import animals from "../definitions/animals";
import { GameModes } from "../game/GameMode";
import { Layer } from "../projectiles/projectiles";
import genBallArena from "../game/genBallArena";

function collideCircles(pos1: Vec2, r1: number, pos2: Vec2, r2: number) {
  return pos1.distance(pos2) <= r1 + r2;
}

function collideRectangles(
  x1: number,
  y1: number,
  w1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
) {
  return x1 + w1 >= x2 && x1 <= x2 + w2 && y1 + w1 >= y2 && y1 <= y2 + h2;
}

function moveTowards(
  ent: Player | Animal,
  angle: number,
  speed: number,
  deltaTime: number,
  state: GameState
) {
  if (ent instanceof Player) {
    try {
      ent.velocity.add(
        Math.cos(angle) * speed * 0.0016 * deltaTime,
        Math.sin(angle) * speed * 0.0016 * deltaTime
      );
    } catch (e) {
      if (e == "Error: Infinity detected") {
        console.log("Infinity Error");
        ent.spdMult = config.defaultSpeed || 1;
      } else console.log("Error: " + e);
    }
  } else {
    try {
      ent.velocity.add(
        Math.cos(angle) * speed * 0.0016 * deltaTime,
        Math.sin(angle) * speed * 0.0016 * deltaTime
      );
    } catch (e) {}
  }
}

/**
 * Utility function to collide a player and a GameObject with collideCircles()
 * @param player the player to test collision for
 * @param gameObj the GameObject to test collision for
 */
function collidePlayerGameObject(player: Player, gameObj: GameObject) {
  if (player.mode == PlayerMode.spectator) return false;
  return collideCircles(
    player.location,
    29,
    gameObj.location,
    gameObj.data === ItemType.PitTrap
      ? 0.3 * gameObj.realScale
      : gameObj.realScale
  );
}
/**
 * Utility function to collide an animal and a GameObject with collideCircles()
 * @param animal the animal to test collision for
 * @param gameObj the GameObject to test collision for
 */
function collideAnimalGameObject(animal: Animal, gameObj: GameObject) {
  return collideCircles(
    animal.location,
    animal.size,
    gameObj.location,
    gameObj.data === ItemType.PitTrap
      ? 0.3 * gameObj.realScale
      : gameObj.realScale
  );
}

function tryMovePlayer(
  player: Player,
  delta: number,
  xVel: number,
  yVel: number,
  state: GameState
) {
  let inTrap = false;
  let packetFactory = PacketFactory.getInstance();

  player.spikeHit > 0 && --player.spikeHit < 0 && (player.spikeHit = 0);
  player.layer = 0;
  player.padHeal = 0;

  let newLocation = new Vec2(player.location.x, player.location.y);

  player.getNearbyGameObjects(state, true, true).forEach((gameObj) => {
    if (collidePlayerGameObject(player, gameObj)) {
      if (gameObj.isPlayerGameObject()) {
        if (!player.client?.seenGameObjects.includes(gameObj.id)) {
          player.client?.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.LOAD_GAME_OBJ, [gameObj.getData()])
            )
          );

          player.client?.seenGameObjects.push(gameObj.id);
        }
        if (gameObj.data == ItemType.Platform) player.layer = 1;

        switch (gameObj.data) {
          case ItemType.PitTrap:
            if (
              !getHat(player.hatID)?.trapImm &&
              gameObj.isEnemy(player, state.tribes)
            )
              inTrap = true;
            break;
          case ItemType.BoostPad:
            player.velocity.add(
              Math.cos(gameObj.angle) * 0.3,
              Math.sin(gameObj.angle) * 0.3
            );
            break;
          case ItemType.HealingPad:
            player.padHeal += 15;
            break;
          case ItemType.Teleporter:
            player.location = randomPos(14400, 14400, 0);
            getGame()?.sendGameObjects(player);
            return;
        }
        if (!hasCollision(gameObj.data)) return;
      }

      let dmg = gameObj.dmg;

      if (
        dmg &&
        !(
          gameObj.isPlayerGameObject() && !gameObj.isEnemy(player, state.tribes)
        ) &&
        !player.spikeHit
      ) {
        let owner = state.players.find(
          (player) => player.id == gameObj.ownerSID
        );
        player.spikeHit = 2;

        let hat = getHat(player.hatID);

        if (hat) {
          dmg *= hat.dmgMult || 1;
        }

        let angle = Math.atan2(
          player.location.y - gameObj.location.y,
          player.location.x - gameObj.location.x
        );
        player.velocity.add(Math.cos(angle), Math.sin(angle));

        if (owner) {
          getGame()?.damageFrom(player, owner, gameObj.dmg, false);
        } else {
          player.health -= gameObj.dmg;
        }

        if (!player.hideLeaderboard)
          state.players
            .find((player) => player.id == gameObj.ownerSID)
            ?.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.HEALTH_CHANGE, [
                  gameObj.location.x +
                    Math.cos(angle) * (gameObj.realScale + 35),
                  gameObj.location.y +
                    Math.sin(angle) * (gameObj.realScale + 35),
                  dmg,
                  1,
                ])
              )
            );
      }

      xVel *= 0.83;
      yVel *= 0.83;

      let angle = Math.atan2(
        newLocation.y - gameObj.location.y,
        newLocation.x - gameObj.location.x
      );

      newLocation = new Vec2(
        gameObj.location.x + Math.cos(angle) * (gameObj.realScale + 35),
        gameObj.location.y + Math.sin(angle) * (gameObj.realScale + 35)
      );
    }
  });

  player.inTrap = inTrap;
  if (inTrap) return;

  // River
  if (
    testBiome(player.location) == Biomes.river &&
    player.layer < 1 &&
    player.mode !== PlayerMode.spectator
  ) {
    if (getHat(player.hatID)?.waterImm) {
      let vel = 0.75;
      xVel *= vel;
      yVel *= vel;

      player.velocity.add(0.0011 * 0.4 * delta * (1 / vel), 0);
    } else {
      let vel = 0.33;
      xVel *= vel;
      yVel *= vel;

      player.velocity.add(0.0011 * delta * (1 / vel), 0);
    }
  }

  if (
    testBiome(player.location) == Biomes.snow &&
    player.mode !== PlayerMode.spectator &&
    !getHat(player.hatID)?.coldM
  ) {
    let vel = 0.66;
    xVel *= vel;
    yVel *= vel;
  }

  let out = player.mode == PlayerMode.spectator ? 500 : 0;

  newLocation.clamp(
    new Vec2(
      0 - out + 35 + (getGame()?.spikeAdvance || 0),
      0 - out + 35 + (getGame()?.spikeAdvance || 0)
    ),
    new Vec2(
      14400 + out - 35 - (getGame()?.spikeAdvance || 0),
      14400 + out - 35 - (getGame()?.spikeAdvance || 0)
    )
  );
  player.location = newLocation.add(delta * xVel, delta * yVel);
}
function tryMoveAnimal(
  animal: Animal,
  delta: number,
  xVel: number,
  yVel: number,
  state: GameState
) {
  let inTrap = false;
  let packetFactory = PacketFactory.getInstance();

  animal.spikeHit > 0 && --animal.spikeHit < 0 && (animal.spikeHit = 0);
  animal.layer = 0;
  animal.padHeal = 0;

  let newLocation = new Vec2(animal.location.x, animal.location.y);

  animal.getNearbyGameObjects(state, true).forEach((gameObj) => {
    if (collideAnimalGameObject(animal, gameObj)) {
      if (animal.health != -1) {
        if (gameObj.isPlayerGameObject()) {
          if (gameObj.data == ItemType.Platform) animal.layer = 1;
          if (
            gameObj.data == ItemType.SpawnPad &&
            animal.type == Animals.moofieball &&
            getGame()?.mode.includes(GameModes.moofieball)
          ) {
            let game = getGame();
            if (!game) return;
            let teamWon = gameObj.ownerSID == -66 ? "a" : "b";
            if (teamWon == "a") game.winsA++;
            else game.winsB++;
            genBallArena(game, false);
            Broadcast(
              `The ${teamWon.toUpperCase()} team won!\nA: ${game.winsA} B: ${
                game.winsB
              }`,
              undefined
            );
          }

          if (
            gameObj.health != -1 &&
            getGameObjLayer(gameObj.data) > Layer.Pad &&
            animal.data.weapon
          )
            animal.isAttacking = true;

          if (
            !(
              getItem(gameObj.data)?.bossImmune &&
              animals.find((a) => a.id == animal.type)?.boss
            )
          ) {
            switch (gameObj.data) {
              case ItemType.PitTrap:
                inTrap = true;
                break;
              case ItemType.BoostPad:
                animal.velocity.add(
                  Math.cos(gameObj.angle) * 0.3,
                  Math.sin(gameObj.angle) * 0.3
                );
                break;
              case ItemType.HealingPad:
                animal.padHeal += 15;
                break;
              case ItemType.Teleporter:
                animal.location = randomPos(14400, 14400, 0);
                return;
            }
          }
          if (!hasCollision(gameObj.data)) return;
        }

        let dmg = gameObj.dmg;

        if (dmg && !animal.spikeHit) {
          let owner = state.players.find(
            (player) => player.id == gameObj.ownerSID
          );
          animal.spikeHit = 2;

          let angle = Math.atan2(
            animal.location.y - gameObj.location.y,
            animal.location.x - gameObj.location.x
          );
          animal.velocity.add(Math.cos(angle), Math.sin(angle));

          if (owner) {
            getGame()?.damageFromAnimal(animal, owner, gameObj.dmg, false);
          } else {
            animal.health -= gameObj.dmg;
          }
          animal.runFrom(gameObj.location);

          if (animal.health <= 0) {
            if (owner) animal.giveDrops(owner);
          }

          state.players
            .find((player) => player.id == gameObj.ownerSID)
            ?.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.HEALTH_CHANGE, [
                  gameObj.location.x +
                    Math.cos(angle) * (gameObj.realScale + 35),
                  gameObj.location.y +
                    Math.sin(angle) * (gameObj.realScale + 35),
                  dmg,
                  1,
                ])
              )
            );
        }
      } else if (!hasCollision(gameObj.data)) return;

      xVel *= 0.83;
      yVel *= 0.83;

      let angle = Math.atan2(
        newLocation.y - gameObj.location.y,
        newLocation.x - gameObj.location.x
      );

      newLocation = new Vec2(
        gameObj.location.x +
          Math.cos(angle) * (gameObj.realScale + animal.size),
        gameObj.location.y + Math.sin(angle) * (gameObj.realScale + animal.size)
      );
    }
  });

  animal.inTrap = inTrap;
  if (inTrap && animal.type !== Animals.quack) return;

  // River
  if (testBiome(animal.location) == Biomes.river && animal.layer < 1) {
    xVel *= 0.33;
    yVel *= 0.33;

    animal.velocity.add(0.0011 * delta * (1 / 0.33), 0);
  }

  newLocation.clamp(
    new Vec2(
      0 + animal.size + (getGame()?.spikeAdvance || 0),
      0 + animal.size + (getGame()?.spikeAdvance || 0)
    ),
    new Vec2(
      14400 - animal.size - (getGame()?.spikeAdvance || 0),
      14400 - animal.size - (getGame()?.spikeAdvance || 0)
    )
  );
  animal.location = newLocation.add(delta * xVel, delta * yVel);
}

function movePlayer(player: Player, delta: number, state: GameState) {
  tryMovePlayer(player, delta, player.velocity.x, player.velocity.y, state);

  if (player.velocity.x || player.velocity.y) {
    player.velocity = player.velocity.multiply(0.993 ** delta, 0.993 ** delta);
  }

  for (let p of player.getNearbyPlayers(state)) {
    if (
      collideCircles(p.location, 30, player.location, 30) &&
      player.mode !== PlayerMode.spectator &&
      p.mode !== PlayerMode.spectator
    ) {
      let dis = player.location.distance(p.location);
      let angle = Math.atan2(
        p.location.y - player.location.y,
        p.location.x - player.location.x
      );
      let distanceToMove = 30 + 30 - dis;
      p.location.add(
        Math.cos(angle) * distanceToMove,
        Math.sin(angle) * distanceToMove
      );
      player.location.add(
        -Math.cos(angle) * distanceToMove,
        -Math.sin(angle) * distanceToMove
      );
      tryMovePlayer(p, delta, p.velocity.x, p.velocity.y, state);
      tryMovePlayer(player, delta, player.velocity.x, player.velocity.y, state);
    }
  }
}
function moveAnimal(animal: Animal, delta: number, state: GameState) {
  tryMoveAnimal(animal, delta, animal.velocity.x, animal.velocity.y, state);

  if (animal.velocity.x || animal.velocity.y) {
    animal.velocity = animal.velocity.multiply(0.993 ** delta, 0.993 ** delta);
  }

  for (let p of animal.getNearbyPlayers(state)) {
    if (
      collideCircles(p.location, 30, animal.location, animal.size) &&
      p.mode !== PlayerMode.spectator
    ) {
      if (animal.data.crate) {
        animal.giveDrops(p);
        state.game.killAnimal(animal);
        return;
      }

      let dis = animal.location.distance(p.location);
      let angle = Math.atan2(
        p.location.y - animal.location.y,
        p.location.x - animal.location.x
      );
      let distanceToMove = 30 + animal.size - dis;
      p.location.add(
        Math.cos(angle) * distanceToMove,
        Math.sin(angle) * distanceToMove
      );
      animal.location.add(
        -Math.cos(angle) * distanceToMove,
        -Math.sin(angle) * distanceToMove
      );
      tryMovePlayer(p, delta, p.velocity.x, p.velocity.y, state);
      tryMoveAnimal(animal, delta, animal.velocity.x, animal.velocity.y, state);

      let now = Date.now();
      let game = getGame();
      if (
        now - animal.lastHitTime >= animal.data.hitDelay &&
        game &&
        !animal.data.weapon
      ) {
        animal.lastHitTime = now;

        let dmg = game.damageFromBoss(p, animal, animal.data.dmg);

        if (p.health <= 0 && p.client && !p.invincible) game.killPlayer(p);
        else
          p.velocity.add(
            0.6 * Math.cos(animal.angle),
            0.6 * Math.sin(animal.angle)
          );

        p.client?.socket.send(
          PacketFactory.getInstance().serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [
              p.location.x,
              p.location.y,
              p.invincible ? "Invincible!" : Math.round(dmg),
              1,
            ])
          )
        );
      }
    }
  }

  if (
    animal.getNearbyPlayers(state, animal.data.hitRange * 1.2).length &&
    animal.data.weapon
  ) {
    animal.isAttacking = true;
  }
}

function pointCircle(point: Vec2, circlePos: Vec2, r: number) {
  if (point.distance(circlePos) <= r) {
    return true;
  }

  return false;
}

function getAttackLocation(player: Player) {
  let range = getWeaponAttackDetails(player.selectedWeapon).attackRange;
  return new Vec2(
    Math.cos(player.angle) * range,
    Math.sin(player.angle) * range
  ).add(player.location);
}
function getAttackLocationAnimal(animal: Animal) {
  let range = animal.data.scale / 2;
  return new Vec2(
    Math.cos(animal.angle) * range,
    Math.sin(animal.angle) * range
  ).add(animal.location);
}

function checkAttack(player: Player, players: Player[]) {
  let hitPlayers: Player[] = [];

  for (let hitPlayer of players) {
    if (
      pointCircle(getAttackLocation(player), hitPlayer.location, 35 * 2) &&
      hitPlayer.mode !== PlayerMode.spectator
    )
      hitPlayers.push(hitPlayer);
  }

  return hitPlayers;
}
function checkAttackAnimal(animal: Animal, players: Player[]) {
  let hitPlayers: Player[] = [];

  for (let hitPlayer of players) {
    if (
      pointCircle(
        getAttackLocationAnimal(animal),
        hitPlayer.location,
        animal.data.hitRange / 2
      ) &&
      hitPlayer.mode !== PlayerMode.spectator
    )
      hitPlayers.push(hitPlayer);
  }

  return hitPlayers;
}
function checkAnimalAttack(player: Player, animals: Animal[]) {
  let hitAnimals: Animal[] = [];

  for (let hitAnimal of animals) {
    if (
      pointCircle(
        getAttackLocation(player),
        hitAnimal.location,
        hitAnimal.data.scale || 35 * 2
      ) &&
      hitAnimal.health != -1
    )
      hitAnimals.push(hitAnimal);
  }

  return hitAnimals;
}

function collideGameObjects(gameObject1: GameObject, gameObject2: GameObject) {
  return collideCircles(
    gameObject1.location,
    gameObject1.realScale * 0.9,
    gameObject2.location,
    gameObject2.realScale
  );
}

function checkAttackGameObj(player: Player, gameObjects: GameObject[]) {
  const GATHER_RANGE = Math.PI / 2.6;
  let hitGameObjects: GameObject[] = [];
  let range = getWeaponAttackDetails(player.selectedWeapon).attackRange;

  for (let gameObject of gameObjects) {
    if (
      range + gameObject.scale <
      gameObject.location.distance(player.location)
    )
      continue;

    let angle = Math.atan2(
      gameObject.location.y - player.location.y,
      gameObject.location.x - player.location.x
    );
    let angleDist = Math.abs(player.angle - angle) % (2 * Math.PI);

    if (angleDist > Math.PI) angleDist = 2 * Math.PI - angleDist;
    if (angleDist <= GATHER_RANGE) hitGameObjects.push(gameObject);
  }

  return hitGameObjects;
}
function checkAttackGameObjAnimal(animal: Animal, gameObjects: GameObject[]) {
  const GATHER_RANGE = Math.PI / 2.3;
  let hitGameObjects: GameObject[] = [];
  let range = animal.data.hitRange;

  for (let gameObject of gameObjects) {
    if (
      range + gameObject.scale <
      gameObject.location.distance(animal.location)
    )
      continue;

    let angle = Math.atan2(
      gameObject.location.y - animal.location.y,
      gameObject.location.x - animal.location.x
    );
    let angleDist = Math.abs(animal.angle - angle) % (2 * Math.PI);

    if (angleDist > Math.PI) angleDist = 2 * Math.PI - angleDist;
    if (angleDist <= GATHER_RANGE) hitGameObjects.push(gameObject);
  }

  return hitGameObjects;
}

function collideProjectilePlayer(projectile: Projectile, player: Player) {
  if (player.mode == PlayerMode.spectator) return false;
  return collideCircles(projectile.location, 10, player.location, 35);
}
function collideProjectileAnimal(projectile: Projectile, animal: Animal) {
  return (
    collideCircles(projectile.location, 10, animal.location, animal.size) &&
    animal.health != -1
  );
}
function collideProjectileGameObject(
  projectile: Projectile,
  gameObj: GameObject
) {
  let col = collideCircles(
    projectile.location,
    10,
    gameObj.location,
    gameObj.scale
  );
  let objLayer = getGameObjLayer(gameObj.data);
  if (!gameObj.isPlayerGameObject()) return col;
  if (gameObj.data == ItemType.Platform) return false;
  if (objLayer == Layer.Pad) return false;
  if (objLayer == Layer.Platform) return col;
  if (objLayer == Layer.Player && projectile.layer == Layer.Platform)
    return false;
  return col;
}

export {
  collideCircles,
  collideRectangles,
  moveTowards,
  checkAttack,
  checkAnimalAttack,
  collideGameObjects,
  checkAttackGameObj,
  movePlayer,
  moveAnimal,
  getAttackLocation,
  collideProjectilePlayer,
  collideProjectileAnimal,
  collideProjectileGameObject,
  pointCircle,
  checkAttackAnimal,
  checkAttackGameObjAnimal,
};
