import WebSocket from "ws";
import Client from "../sanctuary/Client";
import Player from "../sanctuary/Player";
import NanoTimer from "nanotimer";
import db from "enhanced.db";
import {
  randomPos,
  chunk,
  stableSort,
  Broadcast,
  testBiome,
  Biomes,
  peerName,
} from "../sanctuary/util";
import msgpack from "msgpack-lite";
import GameState from "./GameState";
import * as Physics from "../sanctuary/Physics";
import { Packet, Side } from "../packet/Packet";
import GameObject from "../gameobjects/GameObject";
import { PacketType } from "../packet/PacketType";
import { PacketFactory } from "../packet/PacketFactory";
import {
  getWeaponDamage,
  getWeaponAttackDetails,
  getItemCost,
  getPlaceable,
  getWeaponGatherAmount,
  getGroupID,
  Weapons,
  getWeaponSpeedMultiplier,
  getStructureDamage,
  isRangedWeapon,
  getProjectileType,
  getRecoil,
  WeaponModes,
  getItem,
  getRandomItem,
  getRandomWeapon,
  getScale,
  getGameObjHealth,
  getGameObjDamage,
} from "../items/items";
import { gameObjectSizes, GameObjectType } from "../gameobjects/gameobjects";
import { getAccessory } from "../sanctuary/Accessories";
import { getHat } from "../sanctuary/Hats";
import { WeaponVariants } from "../sanctuary/Weapons";
import { ItemType } from "../items/UpgradeItems";
import {
  getProjectileCosts,
  getProjectileRange,
  getProjectileSpeed,
  Layer,
  ProjectileType,
} from "../projectiles/projectiles";
import config from "../config";
import Vec2 from "vec2";
import { GameModes } from "./GameMode";
import { readdirSync } from "fs";
import Animal from "../sanctuary/Animal";
import animals from "../definitions/animals";
import items from "../definitions/items";
import ms from "ms";
import weapons from "../definitions/weapons";
import hats from "../definitions/hats";
import accessories from "../definitions/accessories";
import { PlayerMode } from "../sanctuary/PlayerMode";
import { PacketHandler, PacketHandlerCallback } from "../packet/PacketHandler";
import initPacketHandlers from "../packethandlers";
import updateWindmills from "./updateWindmills";
import generateStructures from "./generateStructures";
import { AdminLevel } from "../sanctuary/Admin";
import genBallArena from "./genBallArena";
import genSurvivalArena from "./genSurvivalArena";

let currentGame: Game | null = null;

const DEFAULT_MAX_CPS = 25;

let MAX_CPS = (config.maxCPS && parseInt(config.maxCPS, 10)) || DEFAULT_MAX_CPS;
if (isNaN(MAX_CPS)) MAX_CPS = DEFAULT_MAX_CPS;

export default class Game {
  public state: GameState;
  public clients: Client[] = [];
  public lastTick: number = 0;
  public started: boolean = false;
  public mode: GameModes[] = [GameModes.normal];
  public MAX_CPS = MAX_CPS;
  lastUpdate: number = 0;
  physTimer: NanoTimer | undefined;

  constructor() {
    let defaultMode = (
      readdirSync("data").filter((f) => f.startsWith("DEFAULT_GAMEMODE="))[0] ||
      ""
    ).split("=")[1] as GameModes;
    if (defaultMode && GameModes[defaultMode]) this.mode = [defaultMode];

    this.state = new GameState(this);
    this.update = this.update.bind(this);

    if (!currentGame) currentGame = this;
  }

  /**
   * Starts the server loop
   */
  public locked: string = "";
  public spawnAnimalsInt: NodeJS.Timeout | undefined;
  public physDelay: number = 66;
  start() {
    this.started = true;
    this.lastUpdate = Date.now();
    this.physTimer = new NanoTimer();
    this.physTimer.setInterval(
      this.physUpdate.bind(this),
      "",
      `${this.physDelay}m`
    );
    generateStructures(this);
    this.spawnAnimals();

    let g = this;
    setInterval(() => updateWindmills(g), 1000);
    this.spawnAnimalsInt = setInterval(this.spawnAnimals.bind(this), 10000);

    initPacketHandlers(this);

    process.nextTick(this.update);
  }
  public closing: NodeJS.Timeout | undefined;
  close(reason: string = "Server Closed", doneMax: number = 10) {
    let g = this;
    let doneTimer = 0;
    if (this.closing) clearInterval(this.closing);
    this.closing = setInterval(function () {
      if (doneTimer > doneMax) {
        g.clients.forEach((c) => {
          g.kickClient(c, reason);
        });
        if (!g.clients.length) process.exit();
      } else {
        g.clients.forEach((c) => {
          Broadcast(
            `Server closing in ${ms((doneMax - doneTimer) * 1000, {
              long: true,
            })}...`,
            c
          );
        });
        doneTimer++;
      }
    }, 1000);
  }
  cancelClose() {
    if (this.closing) clearInterval(this.closing);
    this.closing = undefined;
  }

  ball() {
    this.mode = [GameModes.moofieball];
    genBallArena(this, true);
  }
  survivalMode() {
    this.mode = [GameModes.survival];
    genSurvivalArena(this);
  }

  exec(code: string, source: Player | undefined) {
    let game = this;
    let $db = db;
    let self = source;
    let $players = new (class {
      constructor() {}
      each(doEach: Function) {
        game.state.players.forEach((p) => {
          doEach(
            new (class {
              constructor() {}
              kill() {
                p.die();
              }
            })()
          );
        });
      }
    })();
    try {
      return [true, eval(code.replace(/\(\$\./g, "($=>$."))];
    } catch (e) {
      return [false, e];
    }
  }

  getNextGameObjectID() {
    return this.state.gameObjects.length > 0
      ? Math.max(...this.state.gameObjects.map((gameObj) => gameObj.id)) + 1
      : 0;
  }

  public bossLoc = new Vec2(
    config.biomeSize / 2,
    config.mapScale - config.biomeSize / 2
  );

  generateStructure(
    objType: string,
    x: number,
    y: number,
    objSize?: number | undefined
  ) {
    let obj = objType.split(":")[0];
    let params = objType.split(":")[1];

    let type = GameObjectType.Mine;
    switch (obj) {
      case "tree":
      case "wood":
      case "w":
        type = GameObjectType.Tree;
        break;
      case "bush":
      case "food":
      case "f":
        type = GameObjectType.Bush;
        break;
      case "mine":
      case "stone":
      case "rock":
      case "s":
        type = GameObjectType.Mine;
        break;
      case "goldmine":
      case "gold":
      case "g":
        type = GameObjectType.GoldMine;
        break;
    }

    let sizes = gameObjectSizes[type];
    let location = new Vec2(x, y);

    let damage =
      type == GameObjectType.Bush && testBiome(location) == Biomes.desert
        ? 35
        : 0;
    if (params == "dmg") damage = 35;

    if (sizes) {
      let size = objSize || sizes[Math.floor(Math.random() * sizes.length)];

      let newGameObject = new GameObject(
        this.getNextGameObjectID(),
        location,
        0,
        size,
        type,
        type == GameObjectType.Tree || type == GameObjectType.Bush
          ? size * 0.6
          : size,
        {},
        -1,
        -1,
        damage
      );

      this.state.gameObjects.push(newGameObject);

      for (let plr of this.clients) {
        if (plr.player) this.sendGameObjects(plr.player);
      }
    }
  }

  spawnAnimals() {
    outerLoop: for (let i = 0; i < 25; i++) {
      if (this.state.animals.filter((a) => !a.data.fixedSpawn).length >= 25)
        break;
      let location = randomPos(config.mapScale, config.mapScale);

      let allowedTypes = animals.filter((a) => !a.boss && !a.static && !a.noAi);
      let type =
        allowedTypes[Math.floor(Math.random() * allowedTypes.length)].id;

      let newAnimal = new Animal(
        this.genAnimalSID(),
        location,
        type,
        "Test Subject"
      );

      if (newAnimal.getNearbyAnimals(this.state).length) {
        i--;
        continue outerLoop;
      }

      this.state.animals.push(newAnimal);
    }
  }

  public clientConnectionInfractions: { [key: string]: number } = {};
  addClient(id: string, socket: WebSocket, ip: string) {
    // Only start on first connection to save resources
    if (!this.started) this.start();

    let packetFactory = PacketFactory.getInstance();

    if (this.clients.some((client) => client.id === id))
      throw `There is already a client with ID ${id} in this Game!`;

    let client =
      this.clients[this.clients.push(new Client(id, socket, ip)) - 1];

    if (
      this.clients.filter((client) => client.ip === ip).length >
      config.maxSessions
    ) {
      let clientConnectionInfractions =
        this.clientConnectionInfractions[client.ip] || 0;
      this.kickClient(
        client,
        `Only 2 connections allowed! Only ${
          5 - clientConnectionInfractions
        } times before a ban.`
      );
      setTimeout(function () {
        socket.terminate();
      }, 5);
      clientConnectionInfractions++;
      this.clientConnectionInfractions[client.ip] = clientConnectionInfractions;

      if (clientConnectionInfractions > 5) this.banIP(client.ip);
      return;
    }

    socket.addListener("close", () => {
      if (client.player) {
        const index = this.state.players.indexOf(client.player);

        if (index > -1) {
          this.state.players.splice(index, 1);
        }

        this.state.gameObjects
          .filter((gameObj) => gameObj.ownerSID === client.player?.id)
          .forEach((gameObj) => this.state.removeGameObject(gameObj));

        let inTribe = this.state.tribes.find(
          (tribe) => tribe.owner?.id == client.player?.id
        );
        if (inTribe) inTribe.removePlayer(client.player);
      }
      client.savePlayTime();

      let clientIndex = this.clients.indexOf(client);
      if (clientIndex > -1) this.clients.splice(clientIndex, 1);

      this.sendLeaderboardUpdates();
    });

    socket.addListener("message", (msg) => {
      let infractionsIP = db.get(`infractions_ip_${client.ip}`);
      try {
        if (msg instanceof ArrayBuffer) {
          this.onMsg(client, packetFactory.deserializePacket(msg, Side.Server));
        } else if (msg instanceof Buffer) {
          this.onMsg(
            client,
            packetFactory.deserializePacket(
              msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength),
              Side.Server
            )
          );
        } else {
          console.log("MessagePacket issue. Not a buffer.");
          this.kickClient(client, "disconnected");
          socket.terminate();
        }
      } catch (e) {
        console.log("MessagePacket issue.", e);
        this.kickClient(client, "disconnected");
        socket.terminate();
      }
    });

    socket.send(
      packetFactory.serializePacket(new Packet(PacketType.IO_INIT, [id]))
    );
    socket.send(
      packetFactory.serializePacket(
        new Packet(PacketType.CLAN_LIST, [
          {
            teams: this.state.tribes.map((tribe) => ({
              sid: tribe.name,
              owner: tribe.owner?.id || tribe.tribeIden,
            })),
          },
        ])
      )
    );

    socket.on("error", (err) => {
      console.error("SOCKET_ERR:" + err);
      if (
        String(err) == "RangeError: Invalid WebSocket frame: RSV1 must be clear"
      ) {
        let clientConnectionInfractions =
          this.clientConnectionInfractions[client.ip] || 0;
        this.kickClient(client, "Error.");
        setTimeout(function () {
          socket.terminate();
        }, 1);
        clientConnectionInfractions++;
        this.clientConnectionInfractions[client.ip] =
          clientConnectionInfractions;

        if (clientConnectionInfractions > 5) this.banIP(client.ip);
      }
    });

    console.log(`Added player ${id} with ip ${ip}.`);
  }

  kickClient(client: Client, reason: string = "Kicked from game.") {
    client.savePlayTime();
    this.clients.splice(this.clients.indexOf(client), 1);
    console.log(`Kicked ${client.id}: ${reason}`);

    client.socket.send(msgpack.encode(["d", [reason]]));

    setTimeout(() => {
      try {
        client.socket.close();
        setTimeout(() => {
          client.socket.terminate();
        }, 120);
      } catch (e) {
        client.socket.terminate();
      }
    }, 1);
  }

  banClient(client: Client, reason: string = "Banned by a moderator.") {
    if (!((db.get("bannedIPs") as any[]) || []).includes(client.ip)) {
      let bannedIPs = (db.get("bannedIPs") as any[]) || [];
      bannedIPs.push(client.ip);
      db.set("bannedIPs", bannedIPs);
    }

    this.kickClient(client, reason);
  }
  banIP(ip: String) {
    if (!((db.get("bannedIPs") as any[]) || []).includes(ip)) {
      let bannedIPs = (db.get("bannedIPs") as any[]) || [];
      bannedIPs.push(ip);
      db.set("bannedIPs", bannedIPs);
    }
  }
  banName(name: string) {
    let bannedNames = (db.get("BANNED_NAMES") as string[]) || [];
    bannedNames.push(name);
    db.set("BANNED_NAMES", bannedNames);
  }
  unbanIP(ip: string) {
    let bannedIPs = (db.get("bannedIPs") as any[]) || [];
    if (bannedIPs.includes(ip)) {
      bannedIPs.splice(bannedIPs.indexOf(ip), 1);
      db.set("bannedIPs", bannedIPs);
    }
  }

  killPlayer(player: Player) {
    let packetFactory = PacketFactory.getInstance();

    player.die();

    for (let nearbyPlayer of player.getNearbyPlayers(this.state)) {
      nearbyPlayer.client?.socket?.send(
        packetFactory.serializePacket(
          new Packet(PacketType.PLAYER_UPDATE, [
            this.makePlayerUpdateForClient(nearbyPlayer.client),
          ])
        )
      );
    }

    this.sendLeaderboardUpdates();
  }

  killAnimal(animal: Animal) {
    animal.die();

    this.sendAnimalUpdates();
  }

  makePlayerUpdateForClient(client: Client) {
    let playerUpdate: (number | string | null)[] = [];

    if (client.player) {
      if (!client.player.dead)
        playerUpdate = client.player.getUpdateData(this.state, true);

      for (let player of client.player.getNearbyPlayers(this.state)) {
        if (
          !player.invisible &&
          !(
            player.mode == PlayerMode.spectator &&
            client.player.mode !== PlayerMode.spectator
          )
        ) {
          playerUpdate = playerUpdate.concat(player.getUpdateData(this.state));
        }
      }
    }

    return playerUpdate;
  }

  sendPlayerUpdates() {
    let packetFactory = PacketFactory.getInstance();

    for (let client of Object.values(this.clients)) {
      for (let peer of this.clients) {
        if (
          peer.player &&
          client.player &&
          client.player != peer.player &&
          client.player.getNearbyPlayers(this.state).includes(peer.player) &&
          !client.seenPlayers.includes(peer.player.id) &&
          !peer.player.dead
        ) {
          client.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.PLAYER_ADD, [
                [
                  peer.id,
                  peer.player.id,
                  peerName(client.player, peer.player),
                  peer.player.location.x,
                  peer.player.location.y,
                  0,
                  100,
                  100,
                  35,
                  peer.player.skinColor,
                ],
                false,
              ])
            )
          );
          client.seenPlayers.push(peer.player.id);
        }
      }

      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.PLAYER_UPDATE, [
            this.makePlayerUpdateForClient(client),
          ])
        )
      );
    }
  }
  sendAnimalUpdates() {
    let packetFactory = PacketFactory.getInstance();

    let animalData = this.state.animals.reduce<(number | string)[]>(
      (acc, animal) => {
        if (!animal) return acc;

        return acc.concat([
          animal.id, // sid
          animal.type, // animal index id
          animal.location.x, // locx
          animal.location.y, // locy
          animal.angle, // angle (dir?)
          animal.health, // health
          animal.name, // cow name index - now cow name string
        ]);
      },
      []
    );

    this.state.players.forEach((plr: Player) => {
      plr.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPDATE_ANIMALS, [animalData])
        )
      );
    });
  }

  sendLeaderboardUpdates() {
    let packetFactory = PacketFactory.getInstance();
    let leaderboardUpdate: (string | number)[] = [];

    for (let player of stableSort(
      this.state.players.filter(
        (player) => !player.dead && !player.hideLeaderboard
      ),
      (a, b) => {
        if (a.score < b.score) return -1;
        if (a.score > b.score) return 1;
        return 0;
      }
    )
      .reverse()
      .slice(0, 10)) {
      leaderboardUpdate = leaderboardUpdate.concat([
        player.id,
        player.name,
        player.score,
      ]);
    }

    for (let client of this.clients) {
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.LEADERBOARD_UPDATE, [leaderboardUpdate])
        )
      );
    }
  }

  /**
   * Called every once in a while to send new data
   */
  tick() {
    this.sendPlayerUpdates();
    this.sendAnimalUpdates();
  }

  /**
   * Sends GameObject updates to players
   */
  sendGameObjects(player: Player) {
    let packetFactory = PacketFactory.getInstance();

    let newGameObjects = player
      .getNearbyGameObjects(this.state)
      .filter(
        (gameObject) => !player.client?.seenGameObjects.includes(gameObject.id)
      );

    if (newGameObjects) {
      let gameObjectArray: (number | boolean | object)[] = [];

      for (let gameObject of newGameObjects) {
        gameObjectArray = gameObjectArray.concat(gameObject.getData());
        player.client?.seenGameObjects.push(gameObject.id);
      }

      player.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.LOAD_GAME_OBJ, [gameObjectArray])
        )
      );
    }
  }

  public projectileDelta: number = Date.now();
  updateProjectiles() {
    let deltaTime = Date.now() - this.projectileDelta;
    this.projectileDelta = Date.now();
    let packetFactory = PacketFactory.getInstance();

    this.state.projectiles.forEach((projectile) => {
      projectile.location.add(
        projectile.speed * Math.cos(projectile.angle) * deltaTime,
        projectile.speed * Math.sin(projectile.angle) * deltaTime
      );
      projectile.distance += projectile.speed * deltaTime;

      if (projectile.distance > (getProjectileRange(projectile.type) || 1000))
        this.state.removeProjectile(projectile);

      let owner = this.state.players.find(
        (player) => player.id == projectile.ownerSID
      );
      if (!owner)
        owner = this.state.players.find(
          (p) => p.id == projectile.source?.ownerSID
        );

      this.state.getPlayersNearProjectile(projectile).forEach((player) => {
        if (
          player.client &&
          !player.client.seenProjectiles.includes(projectile.id)
        ) {
          player.client?.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.ADD_PROJECTILE, [
                projectile.location.x,
                projectile.location.y,
                projectile.angle,
                (getProjectileRange(projectile.type) || 100) -
                  projectile.distance,
                getProjectileSpeed(projectile.type),
                projectile.type,
                projectile.layer,
                projectile.id,
              ])
            )
          );
          player.client.seenProjectiles.push(projectile.id);
        }

        if (
          Physics.collideProjectilePlayer(projectile, player) &&
          player.id != projectile.ownerSID &&
          !owner?.tribe?.allMembers.includes(player) &&
          projectile.source?.ownerSID !== player.id
        ) {
          let dmg = projectile.damage;
          if (owner)
            dmg = this.damageFrom(player, owner, projectile.damage, false);

          player.velocity.add(
            0.0075 * Math.cos(projectile.angle) * deltaTime,
            0.0075 * Math.sin(projectile.angle) * deltaTime
          );
          if (player.health <= 0) this.killPlayer(player);

          if (owner && !player.hideLeaderboard) {
            owner.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.HEALTH_CHANGE, [
                  player.location.x,
                  player.location.y,
                  player.invincible ? "Invincible!" : dmg,
                  1,
                ])
              )
            );
          }
          player.client?.socket.send(
            packetFactory.serializePacket(
              new Packet(PacketType.HEALTH_CHANGE, [
                player.location.x,
                player.location.y,
                player.invincible ? "Invincible!" : dmg,
                1,
              ])
            )
          );
          this.state.removeProjectile(projectile);
        }
      });
      this.state.animals.forEach((animal) => {
        if (Physics.collideProjectileAnimal(projectile, animal)) {
          let dmg = projectile.damage;
          if (owner) {
            dmg = this.damageFromAnimal(
              animal,
              owner,
              projectile.damage,
              false
            );
            if (!animal.data.hostile) animal.runFrom(owner.location);
          }

          animal.velocity.add(
            0.01 * Math.cos(projectile.angle) * deltaTime,
            0.01 * Math.sin(projectile.angle) * deltaTime
          );
          if (animal.health <= 0) {
            if (owner) animal.giveDrops(owner);
            this.killAnimal(animal);
          }

          if (owner) {
            owner.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.HEALTH_CHANGE, [
                  animal.location.x,
                  animal.location.y,
                  dmg,
                  1,
                ])
              )
            );
          }
          this.state.removeProjectile(projectile);
        }
      });

      this.state.gameObjects.forEach((gameObj) => {
        if (
          Physics.collideProjectileGameObject(projectile, gameObj) &&
          projectile.source?.id !== gameObj.id
        ) {
          this.state.removeProjectile(projectile);

          for (let nearbyPlayer of this.state.getPlayersNearProjectile(
            projectile
          )) {
            nearbyPlayer.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.WIGGLE, [projectile.angle, gameObj.id])
              )
            );
          }

          if (gameObj.isPlayerGameObject()) {
            let gameObjOwner = this.state.players.find(
              (p) => p.id == gameObj.ownerSID
            );

            if (gameObj.health != -1) {
              gameObj.health -= projectile.damage * 1.5;

              if (gameObj.health <= 0) {
                if (owner) {
                  let itemCost = getItemCost(gameObj.data);
                  let costs = chunk(itemCost, 2) as [string, number][];

                  for (let cost of costs) {
                    switch (cost[0]) {
                      case "food":
                        owner.food += cost[1] * gameObj.lootMult;
                        break;
                      case "wood":
                        owner.wood += cost[1] * gameObj.lootMult;
                        break;
                      case "stone":
                        owner.stone += cost[1] * gameObj.lootMult;
                        break;
                    }

                    if (owner.selectedWeapon == owner.weapon)
                      owner.primaryWeaponExp += cost[1] * gameObj.lootMult;
                    else owner.secondaryWeaponExp += cost[1] * gameObj.lootMult;
                  }
                }

                if (gameObj.data == 20 && gameObjOwner && gameObjOwner.client) {
                  gameObjOwner.client.spawnPos = false;
                }

                if (gameObjOwner) {
                  let placedAmount = this.state.gameObjects.filter(
                    (gameObj) =>
                      gameObj.data === gameObj.data &&
                      gameObj.ownerSID == gameObj.ownerSID
                  ).length;
                  gameObjOwner.client?.socket.send(
                    packetFactory.serializePacket(
                      new Packet(PacketType.UPDATE_PLACE_LIMIT, [
                        getGroupID(gameObj.data),
                        placedAmount - 1,
                      ])
                    )
                  );
                }

                this.state.removeGameObject(gameObj);
                if (owner) this.sendGameObjects(owner);

                for (let otherPlayer of this.state.getPlayersNearProjectile(
                  projectile
                )) {
                  this.sendGameObjects(otherPlayer);
                }
              }
            }
          }
        }
      });
    });
  }

  damageFrom(to: Player, from: Player, dmg: number, direct = true) {
    let packetFactory = PacketFactory.getInstance();

    let attackerHat = getHat(from.hatID);
    let recieverHat = getHat(to.hatID);

    let attackerAcc = getAccessory(from.accID);
    let recieverAcc = getAccessory(to.accID);

    let healAmount =
      ((attackerHat?.healD || 0) +
        (attackerAcc?.healD || 0) +
        ((from.selectedWeapon == from.weapon
          ? WeaponVariants[from.primaryWeaponVariant]
          : WeaponVariants[from.secondaryWeaponVariant]
        ).lifeSteal || 0)) *
      dmg;
    from.health = Math.min(from.health + healAmount, 100);

    if (healAmount) {
      from.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.HEALTH_CHANGE, [
            from.location.x,
            from.location.y,
            Math.round(-healAmount),
            1,
          ])
        )
      );
    }

    if (attackerHat && attackerHat.dmgMultO) dmg *= attackerHat.dmgMultO;

    if (to.selectedWeapon == Weapons.Shield) dmg *= 0.2;

    if (recieverHat) {
      dmg *= recieverHat.dmgMult || 1;

      if (recieverHat.dmg) {
        from.health -= recieverHat.dmg * dmg;
      }

      if (recieverHat.dmgK && direct) {
        let knockback = recieverHat.dmgK;
        from.velocity.add(
          knockback * Math.cos((from.angle - Math.PI) % (2 * Math.PI)),
          knockback * Math.sin((from.angle - Math.PI) % (2 * Math.PI))
        );
      }
    }

    if (recieverAcc) {
      if (recieverAcc.dmg) {
        from.health -= recieverAcc.dmg * dmg;
      }
    }

    if (to.health - dmg <= 0 && !to.invincible) {
      from.kills++;
      from.points += to.age * 100 * (attackerHat?.kScrM || 1);

      if (attackerHat?.goldSteal) {
        from.points += attackerHat.goldSteal * to.points;
      }
    }

    to.health -= dmg;
    return dmg;
  }
  damageFromBoss(to: Player, from: Animal, dmg: number, direct = true) {
    let recieverHat = getHat(to.hatID);

    let recieverAcc = getAccessory(to.accID);

    if (to.selectedWeapon == Weapons.Shield) dmg *= 0.2;

    if (recieverHat) {
      dmg *= recieverHat.dmgMult || 1;

      if (recieverHat.dmg) {
        from.health -= recieverHat.dmg * dmg;
      }

      if (recieverHat.dmgK && direct) {
        let knockback = recieverHat.dmgK;
        from.velocity.add(
          knockback * Math.cos((from.angle - Math.PI) % (2 * Math.PI)),
          knockback * Math.sin((from.angle - Math.PI) % (2 * Math.PI))
        );
      }
    }

    if (recieverAcc) {
      if (recieverAcc.dmg) {
        from.health -= recieverAcc.dmg * dmg;
      }
    }

    to.health -= dmg;
    return dmg;
  }
  damageFromAnimal(to: Animal, from: Player, dmg: number, direct = true) {
    let packetFactory = PacketFactory.getInstance();

    let attackerHat = getHat(from.hatID);
    let attackerAcc = getAccessory(from.accID);

    let healAmount =
      ((attackerHat?.healD || 0) + (attackerAcc?.healD || 0)) * dmg;
    from.health = Math.min(from.health + healAmount, 100);

    if (healAmount) {
      from.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.HEALTH_CHANGE, [
            from.location.x,
            from.location.y,
            Math.round(-healAmount),
            1,
          ])
        )
      );
    }

    if (attackerHat && attackerHat.dmgMultO) dmg *= attackerHat.dmgMultO;

    to.health -= dmg;
    return dmg;
  }
  /**
   * Called as often as possible for things like physics calculations
   */
  update() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;

    let packetFactory = PacketFactory.getInstance();

    const TICK_INTERVAL = process.env.TICK_INTERVAL || 0; // not sure

    if (Date.now() - this.lastTick >= TICK_INTERVAL) {
      this.lastTick = Date.now();
      this.tick();
    }

    this.state.players.forEach((player) => {
      let tribeMembers: number[] = [];

      if (player.tribe)
        tribeMembers = player.tribe.allMembers
          .filter((m) => m !== player)
          .reduce<number[]>((acc, otherMember) => {
            if (!otherMember || otherMember.dead) return acc;

            return acc.concat([
              otherMember?.location.x,
              otherMember?.location.y,
            ]);
          }, []);

      if (player.mode == PlayerMode.spectator)
        tribeMembers = this.state.players
          .filter((m) => m !== player && m.mode !== PlayerMode.spectator)
          .reduce<number[]>(
            (acc, otherMember) => {
              if (!otherMember || otherMember.dead) return acc;

              return acc.concat([
                otherMember?.location.x,
                otherMember?.location.y,
              ]);
            },
            [-1, -1]
          );

      let highKills = this.state.players
        .filter((p) => p.getUpdateData(this.state)[11] == 1 && p !== player)
        .reduce<number[]>((acc, otherMember) => {
          if (!otherMember || otherMember.dead) return acc;

          return acc.concat([otherMember?.location.x, otherMember?.location.y]);
        }, []);

      player?.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.MINIMAP, [
            tribeMembers,
            highKills,
            this.spikeAdvance > 0
              ? [this.spikeAdvance, config.mapScale - this.spikeAdvance * 2]
              : [],
          ])
        )
      );
    });

    this.state.gameObjects
      .filter((o) => o.data == ItemType.Turret)
      .forEach((turret) => {
        let Turret = getItem(ItemType.Turret);
        let nearbyPlayers = this.state.players.filter(
          (p) =>
            turret.ownerSID !== p.id &&
            !this.state.tribes.find(
              (t) =>
                t.allMemberIDs.includes(turret.ownerSID) &&
                t.allMemberIDs.includes(p.id)
            ) &&
            p.location.distance(turret.location) < (Turret?.shootRange || 0) &&
            p.mode !== PlayerMode.spectator &&
            !p.dead
        );
        let nearestPlayer = nearbyPlayers.find(
          (p) =>
            p.location ==
            turret.location.nearest(nearbyPlayers.map((p) => p.location))
        );

        if (turret.lastShoot < Date.now() && nearestPlayer) {
          turret.lastShoot = Date.now() + (Turret?.shootRate || 0);
          let turretAngle = Math.atan2(
            nearestPlayer.location.y - turret.location.y,
            nearestPlayer.location.x - turret.location.x
          );
          this.state.players
            .filter((p) => p.getNearbyGameObjects(this.state).includes(turret))
            .forEach((player) => {
              player?.client?.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.SHOOT_TURRET, [turret.id, turretAngle])
                )
              );
            });

          this.state.addProjectile(
            ProjectileType.Turret,
            turret.location.add(0, 0, true),
            undefined,
            turretAngle,
            Layer.Platform
          ).source = turret;
        }
      });

    this.state.players.forEach((p) => {
      let h = getHat(p.hatID);
      if (h?.turret) {
        let nearbyPlayers = this.state.players.filter(
          (pl) =>
            p.id !== pl.id &&
            !this.state.tribes.find(
              (t) => t.allMembers.includes(p) && t.allMembers.includes(pl)
            ) &&
            pl.location.distance(pl.location) < (h?.turret?.range || 0)
        );
        let nearestPlayer = nearbyPlayers.find(
          (pl) =>
            pl.location ==
            pl.location.nearest(nearbyPlayers.map((plr) => plr.location))
        );

        if (p.lastShoot < Date.now() && nearestPlayer) {
          p.lastShoot = Date.now() + (h.turret.rate || 0);
          let turretAngle = Math.atan2(
            nearestPlayer.location.y - p.location.y,
            nearestPlayer.location.x - p.location.x
          );

          this.state.addProjectile(
            ProjectileType.Turret,
            p.location.add(0, 0, true),
            undefined,
            turretAngle,
            Layer.Platform
          );
        }
      }
    });

    this.state.animals.forEach((animal) => {
      if (animal.data.hostile) {
        let near = animal.getNearbyPlayers(this.state, animal.data.viewRange);
        let nearest = near
          .filter(
            (p) =>
              (animal.data.weapon
                ? p.location.distance(animal.location) >=
                  animal.data.hitRange / 1.5
                : true) &&
              !p.invisible &&
              !p.invincible
          )
          .sort((p1, p2) => {
            return p1.location.distance(animal.location) >
              p2.location.distance(animal.location)
              ? 1
              : -1;
          })[0];
        if (nearest) animal.runTo(nearest.location);
        else animal.stopRunning();
      }

      Physics.moveAnimal(animal, this.physDelay, this.state);

      if (Date.now() - animal.lastDot >= 1000) {
        animal.damageOverTime();
        animal.lastDot = now;
      }

      if (animal.moving) {
        Physics.moveTowards(
          animal,
          animal.angle,
          animal.data.speed * 900,
          deltaTime,
          this.state
        );
      }

      if (animal.isAttacking) {
        if (now - animal.lastHitTime >= animal.data.hitDelay) {
          animal.lastHitTime = now;
          animal.isAttacking = false;
          if (animal.data.weapon) this.gatherAnimBoss(animal);

          let nearbyPlayers = animal.getNearbyPlayers(this.state);

          let hitPlayers = Physics.checkAttackAnimal(animal, nearbyPlayers);
          let hitGameObjects = Physics.checkAttackGameObjAnimal(
            animal,
            animal.getNearbyGameObjects(this.state)
          );

          for (let hitPlayer of hitPlayers) {
            let dmg = this.damageFromBoss(hitPlayer, animal, animal.data.dmg);

            if (
              hitPlayer.health <= 0 &&
              hitPlayer.client &&
              !hitPlayer.invincible
            )
              this.killPlayer(hitPlayer);
            else
              hitPlayer.velocity.add(
                0.3 * Math.cos(animal.angle),
                0.3 * Math.sin(animal.angle)
              );

            hitPlayer.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.HEALTH_CHANGE, [
                  hitPlayer.location.x,
                  hitPlayer.location.y,
                  hitPlayer.invincible ? "Invincible!" : Math.round(dmg),
                  1,
                ])
              )
            );
          }

          for (let hitGameObject of hitGameObjects) {
            if (
              hitGameObject.health != -1 &&
              hitGameObject.isPlayerGameObject()
            ) {
              hitGameObject.health -= animal.data.dmg * 3;
              if (hitGameObject.health < 1)
                this.state.removeGameObject(hitGameObject);
            }

            for (let nearbyPlayer of nearbyPlayers) {
              nearbyPlayer.client?.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.WIGGLE, [
                    Math.atan2(
                      hitGameObject.location.y - animal.location.y,
                      hitGameObject.location.x - animal.location.x
                    ),
                    hitGameObject.id,
                  ])
                )
              );
            }
          }
        }
      }
    });

    this.state.players.forEach((player) => {
      if (player.dead) return;

      Physics.movePlayer(player, this.physDelay, this.state);

      if (Date.now() - player.lastDot >= 1000) {
        player.damageOverTime();
        player.lastDot = now;
      }

      if (getHat(player.hatID)?.invisTimer) {
        let invisTimer = getHat(player.hatID)?.invisTimer || 0;
        if (player.lastMove + invisTimer > Date.now()) player.invisible = false;
        else player.invisible = true;
        this.sendPlayerUpdates();
      }

      function sendOneTapped(x: number, y: number) {
        player.client?.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.HEALTH_CHANGE, [x, y, "One Tapped!", 1])
          )
        );
      }

      if (
        player.isAttacking &&
        player.selectedWeapon != Weapons.Shield &&
        player.buildItem == -1
      ) {
        if (now - player.lastHitTime >= player.getWeaponHitTime()) {
          player.lastHitTime = now;
          player.lastMove = now;

          if (isRangedWeapon(player.selectedWeapon)) {
            let projectileDistance = 35 / 1.5;
            let cost = getProjectileCosts(
              getProjectileType(player.selectedWeapon)
            );

            if (
              !this.mode.includes(GameModes.sandbox) &&
              (player.wood < cost.wood || player.stone < cost.stone)
            )
              return;

            if (weapons.find((w) => w.id == player.selectedWeapon)?.spread) {
              let shotGunAngles = [
                -0.2, -0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2,
              ];
              if (player.weaponMode == WeaponModes.SuperShot) {
                shotGunAngles = [];
                let startingAngle = -(Math.PI * 2);
                let endingAngle = Math.PI * 2;
                for (let i = startingAngle; i < endingAngle; i += 0.05) {
                  shotGunAngles.push(i);
                }
                player.lastHitTime = now - 500;
              } else if (player.weaponMode == WeaponModes.BigShot) {
                shotGunAngles = [];
                let startingAngle = -0.25;
                let endingAngle = 0.25;
                for (let i = startingAngle; i < endingAngle; i += 0.005) {
                  shotGunAngles.push(i);
                }
                player.lastHitTime = now - 500;
              }
              shotGunAngles.forEach((ang) => {
                this.state.addProjectile(
                  getProjectileType(player.selectedWeapon),
                  player.location.add(
                    projectileDistance * Math.cos(player.angle),
                    projectileDistance * Math.sin(player.angle),
                    true
                  ),
                  player,
                  player.angle + ang,
                  player.layer
                );
              });

              for (let pl of player.getNearbyPlayers(this.state)) {
                pl.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.SHOTGUN_HIT, [player.id])
                  )
                );
              }
              player.client?.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.SHOTGUN_HIT, [player.id])
                )
              );
            } else {
              this.state.addProjectile(
                getProjectileType(player.selectedWeapon),
                player.location.add(
                  projectileDistance * Math.cos(player.angle),
                  projectileDistance * Math.sin(player.angle),
                  true
                ),
                player,
                player.angle,
                player.layer
              );
            }

            if (!this.mode.includes(GameModes.sandbox)) {
              player.wood -= cost.wood;
              player.stone -= cost.stone;
            }

            let recoilAngle = (player.angle + Math.PI) % (2 * Math.PI);
            player.velocity.add(
              getRecoil(player.selectedWeapon) * Math.cos(recoilAngle),
              getRecoil(player.selectedWeapon) * Math.sin(recoilAngle)
            );
          } else {
            let hat = getHat(player.hatID);

            let nearbyPlayers = player.getNearbyPlayers(this.state);
            let nearbyAnimals = player.getNearbyAnimals(this.state);

            let hitPlayers = Physics.checkAttack(player, nearbyPlayers);
            let hitAnimals = Physics.checkAnimalAttack(player, nearbyAnimals);
            let hitGameObjects = Physics.checkAttackGameObj(
              player,
              player.getNearbyGameObjects(this.state)
            );

            let weaponVariant =
              player.selectedWeapon == player.weapon
                ? player.primaryWeaponVariant
                : player.secondaryWeaponVariant;
            for (let hitPlayer of hitPlayers) {
              if (
                hitPlayer.tribe?.id == player.tribe?.id &&
                hitPlayer.tribe != null
              )
                continue;

              let dmg = getWeaponDamage(player.selectedWeapon, weaponVariant);
              if (player.weaponMode == WeaponModes.OneTap) dmg = 8642;

              dmg = this.damageFrom(hitPlayer, player, dmg);

              let poison = WeaponVariants[weaponVariant].poison;
              if (poison) {
                hitPlayer.bleedDmg = 5;
                hitPlayer.bleedAmt = 0;
                hitPlayer.maxBleedAmt = poison;
              } else if (hat?.poisonDmg) {
                hitPlayer.bleedDmg = hat.poisonDmg;
                hitPlayer.bleedAmt = 0;
                hitPlayer.maxBleedAmt = hat.poisonTime;
              }

              if (
                hitPlayer.health <= 0 &&
                hitPlayer.client &&
                !hitPlayer.invincible
              ) {
                this.killPlayer(hitPlayer);
              } else {
                let attackDetails = getWeaponAttackDetails(
                  player.selectedWeapon
                );
                let knockback = attackDetails.kbMultiplier * 0.3;
                hitPlayer.velocity.add(
                  knockback * Math.cos(player.angle),
                  knockback * Math.sin(player.angle)
                );
              }

              switch (player.selectedWeapon) {
                case Weapons.McGrabby:
                  let addpp = Math.min(250, hitPlayer.points);
                  player.points += addpp;
                  hitPlayer.points -= Math.min(250, hitPlayer.points);
                  break;
              }

              if (
                player.weaponMode !== WeaponModes.OneTap &&
                !player.hideLeaderboard
              )
                player.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.HEALTH_CHANGE, [
                      hitPlayer.location.x,
                      hitPlayer.location.y,
                      hitPlayer.invincible ? "Invincible!" : Math.round(dmg),
                      1,
                    ])
                  )
                );
              else if (player.weaponMode == WeaponModes.OneTap)
                sendOneTapped(hitPlayer.location.x, hitPlayer.location.y);
            }

            for (let hitAnimal of hitAnimals) {
              let dmg = getWeaponDamage(player.selectedWeapon, weaponVariant);
              if (player.weaponMode == WeaponModes.OneTap) dmg = 124650;

              dmg = this.damageFromAnimal(hitAnimal, player, dmg);

              let poison = WeaponVariants[weaponVariant].poison;
              if (poison) {
                hitAnimal.bleedDmg = 5;
                hitAnimal.bleedAmt = 0;
                hitAnimal.maxBleedAmt = poison;
              } else if (hat?.poisonDmg) {
                hitAnimal.bleedDmg = hat.poisonDmg;
                hitAnimal.bleedAmt = 0;
                hitAnimal.maxBleedAmt = hat.poisonTime;
              }

              if (hitAnimal.health <= 0) {
                this.killAnimal(hitAnimal);
                hitAnimal.giveDrops(player);
              } else {
                let attackDetails = getWeaponAttackDetails(
                  player.selectedWeapon
                );
                let knockback = attackDetails.kbMultiplier * 0.3;
                hitAnimal.velocity.add(
                  knockback * Math.cos(player.angle),
                  knockback * Math.sin(player.angle)
                );
                if (!hitAnimal.data.hostile) hitAnimal.runFrom(player.location);
              }

              if (player.weaponMode !== WeaponModes.OneTap)
                player.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.HEALTH_CHANGE, [
                      hitAnimal.location.x,
                      hitAnimal.location.y,
                      Math.round(dmg),
                      1,
                    ])
                  )
                );
              else sendOneTapped(hitAnimal.location.x, hitAnimal.location.y);
            }

            for (let hitGameObject of hitGameObjects) {
              if (player.weaponMode == WeaponModes.Inspect) {
                Broadcast(
                  JSON.stringify({
                    ownerSID: hitGameObject.ownerSID,
                    health: hitGameObject.health,
                    protected: hitGameObject.protect,
                  }),
                  player.client
                );
              }

              if (hitGameObject.health !== -1) {
                let hitGameObjectOwner = this.state.players.find(
                  (player: { id: any }) => player.id == hitGameObject.ownerSID
                );

                let dmgMult = 1;
                if (player.weaponMode == WeaponModes.OneTap)
                  dmgMult = hitGameObject.health;

                if (hat && hat.bDmg) dmgMult *= hat.bDmg;

                if (!hitGameObject.protect)
                  hitGameObject.health -=
                    getStructureDamage(player.selectedWeapon, weaponVariant) *
                    dmgMult;
                else if (hitGameObjectOwner == player)
                  hitGameObject.health -=
                    getStructureDamage(player.selectedWeapon, weaponVariant) *
                    dmgMult;
                else if (player.weaponMode == WeaponModes.OneTap)
                  hitGameObject.health -=
                    getStructureDamage(player.selectedWeapon, weaponVariant) *
                    dmgMult;

                if (hitGameObject.health <= 0) {
                  let itemCost = getItemCost(hitGameObject.data);
                  let costs = chunk(itemCost, 2) as [string, number][];

                  for (let cost of costs) {
                    switch (cost[0]) {
                      case "food":
                        player.food += cost[1] * hitGameObject.lootMult;
                        break;
                      case "wood":
                        player.wood += cost[1] * hitGameObject.lootMult;
                        break;
                      case "stone":
                        player.stone += cost[1] * hitGameObject.lootMult;
                        break;
                    }

                    if (player.selectedWeapon == player.weapon)
                      player.primaryWeaponExp +=
                        cost[1] * hitGameObject.lootMult;
                    else
                      player.secondaryWeaponExp +=
                        cost[1] * hitGameObject.lootMult;
                  }

                  if (
                    hitGameObject.data == 20 &&
                    hitGameObjectOwner &&
                    hitGameObjectOwner.client
                  ) {
                    hitGameObjectOwner.client.spawnPos = false;
                  }

                  if (hitGameObjectOwner) {
                    let placedAmount = this.state.gameObjects.filter(
                      (gameObj) =>
                        gameObj.data === hitGameObject.data &&
                        gameObj.ownerSID == hitGameObject.ownerSID
                    ).length;
                    hitGameObjectOwner.client?.socket.send(
                      packetFactory.serializePacket(
                        new Packet(PacketType.UPDATE_PLACE_LIMIT, [
                          getGroupID(hitGameObject.data),
                          placedAmount - 1,
                        ])
                      )
                    );
                  }

                  this.state.removeGameObject(hitGameObject);
                  this.sendGameObjects(player);

                  for (let otherPlayer of player.getNearbyPlayers(this.state)) {
                    this.sendGameObjects(otherPlayer);
                  }
                }
              }

              for (let nearbyPlayer of nearbyPlayers) {
                nearbyPlayer.client?.socket.send(
                  packetFactory.serializePacket(
                    new Packet(PacketType.WIGGLE, [
                      Math.atan2(
                        hitGameObject.location.y - player.location.y,
                        hitGameObject.location.x - player.location.x
                      ),
                      hitGameObject.id,
                    ])
                  )
                );
              }

              let gather = getWeaponGatherAmount(
                player.selectedWeapon,
                weaponVariant
              );

              switch (hitGameObject.type) {
                case GameObjectType.Bush:
                  player.food += gather;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon)
                    player.primaryWeaponExp += gather;
                  else player.secondaryWeaponExp += gather;
                  break;
                case GameObjectType.Mine:
                  player.stone += gather;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon)
                    player.primaryWeaponExp += gather;
                  else player.secondaryWeaponExp += gather;
                  break;
                case GameObjectType.Tree:
                  player.wood += gather;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon)
                    player.primaryWeaponExp += gather;
                  else player.secondaryWeaponExp += gather;
                  break;
                case GameObjectType.GoldMine:
                  let gatherpp =
                    gather == 1 || player.selectedWeapon == Weapons.McGrabby
                      ? 5
                      : gather;
                  player.points += gatherpp;
                  player.score += gatherpp;
                  player.xp += 4 * gather;

                  if (player.selectedWeapon == player.weapon)
                    player.primaryWeaponExp += gather == 1 ? 5 : gather;
                  else
                    player.secondaryWeaponExp +=
                      gather == 1 || player.selectedWeapon == Weapons.McGrabby
                        ? 5
                        : gather;
                  break;
              }

              if (hitGameObject.isPlayerGameObject()) {
                switch (hitGameObject.data) {
                  case ItemType.Sapling:
                    player.wood += gather;
                    player.xp += 4 * gather;

                    if (player.selectedWeapon == player.weapon)
                      player.primaryWeaponExp += gather;
                    else player.secondaryWeaponExp += gather;
                    break;
                  case ItemType.Mine:
                    player.stone += gather;
                    player.xp += 4 * gather;

                    if (player.selectedWeapon == player.weapon)
                      player.primaryWeaponExp += gather;
                    else player.secondaryWeaponExp += gather;
                    break;
                }
              }

              if (
                hitGameObject.type !== GameObjectType.GoldMine &&
                hitGameObject.health == -1
              ) {
                let hitpp =
                  ((hat?.extraGold || 0) +
                    ((player.selectedWeapon == player.weapon
                      ? WeaponVariants[player.primaryWeaponVariant].extraGold
                      : WeaponVariants[player.secondaryWeaponVariant]
                          .extraGold) || 0)) *
                  gather;
                player.points += hitpp;
                player.score += hitpp;
              }

              player.client?.socket.send(
                packetFactory.serializePacket(
                  new Packet(PacketType.WIGGLE, [
                    Math.atan2(
                      hitGameObject.location.y - player.location.y,
                      hitGameObject.location.x - player.location.x
                    ),
                    hitGameObject.id,
                  ])
                )
              );

              if (
                hitGameObject.health == -1 &&
                player.weaponMode == WeaponModes.OneTap
              ) {
                this.state.removeGameObject(hitGameObject);
              }

              if (player.weaponMode == WeaponModes.OneTap)
                sendOneTapped(
                  hitGameObject.location.x,
                  hitGameObject.location.y
                );
            }

            this.gatherAnim(player, hitGameObjects.length > 0);
          }
        }
      }

      if (player.moveDirection !== null && !player.dead) {
        let speedMult =
          player.location.y > 2400 ? player.spdMult : 0.8 * player.spdMult;

        if (player.hatID !== -1) {
          speedMult *= getHat(player.hatID)?.spdMult || 1;
        }
        if (player.accID !== -1) {
          speedMult *= getAccessory(player.accID)?.spdMult || 1;
        }

        if (player.buildItem == -1) {
          speedMult *= getWeaponSpeedMultiplier(player.selectedWeapon);
        } else {
          speedMult *= 0.5;
        }

        Physics.moveTowards(
          player,
          player.moveDirection,
          speedMult,
          deltaTime,
          this.state
        );

        player.lastMove = Date.now();
        this.sendGameObjects(player);
      }
    });

    this.lastUpdate = Date.now();
  }

  physUpdate() {
    this.update();
    this.updateProjectiles();
  }

  /**
   * Generates a unique SID for a new player
   */
  public lastSID = 0;
  genSID() {
    return (this.lastSID += 1);
  }
  public lastAnimalSID = 0;
  genAnimalSID() {
    return (this.lastAnimalSID += 1);
  }

  /**
   * A manual attack
   * @param player the player doing the attacking
   */
  normalAttack(player: Player, angle: number | undefined) {
    player.angle = angle || player.angle;

    if (player.buildItem != -1) {
      let item = player.buildItem;
      let buildCostMult = getHat(player.hatID)?.buildMult || 1;

      if (
        player.useItem(
          item,
          this.state,
          this.getNextGameObjectID(),
          buildCostMult
        )
      ) {
        if (getPlaceable(item)) {
          player
            .getNearbyPlayers(this.state)
            .forEach((nearbyPlayer) => this.sendGameObjects(nearbyPlayer));
          this.sendGameObjects(player);
        }

        let itemCost = getItemCost(item);
        let costs = chunk(itemCost, 2) as [string, number][];

        for (let cost of costs) {
          switch (cost[0]) {
            case "food":
              player.food -= cost[1] * buildCostMult;
              break;
            case "wood":
              player.wood -= cost[1] * buildCostMult;
              break;
            case "stone":
              player.stone -= cost[1] * buildCostMult;
              break;
          }
        }

        player.buildItem = -1;
      }
    } else {
      player.isAttacking = true;
    }
  }

  /**
   * An auto attack
   * @param player the player doing the attacking
   */
  autoAttack(player: Player) {
    player.isAttacking = true;
  }

  gatherAnim(player: Player, hit: boolean) {
    let packetFactory = PacketFactory.getInstance();

    for (let client of this.clients) {
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.GATHER_ANIM, [
            player.id,
            hit ? 1 : 0,
            player.selectedWeapon,
          ])
        )
      );
    }
  }
  gatherAnimBoss(animal: Animal) {
    let packetFactory = PacketFactory.getInstance();

    for (let client of this.clients) {
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.ANIMAL_HIT, [animal.id])
        )
      );
    }
  }

  randomizePlayers() {
    let packetFactory = PacketFactory.getInstance();
    this.state.players.forEach((plr) => {
      let weaponsArray = [];
      plr.weapon = getRandomWeapon(0);
      plr.secondaryWeapon = -1;
      weaponsArray = [plr.weapon];
      let wvs = Object.values(WeaponVariants).map((v) => v.xp);
      plr.primaryWeaponExp = plr.secondaryWeaponExp =
        wvs[Math.floor(Math.random() * wvs.length)];

      let randomRes = [100, 200, 250, 300, 500];
      plr.wood = randomRes[Math.floor(Math.random() * randomRes.length)];
      plr.stone = randomRes[Math.floor(Math.random() * randomRes.length)];
      plr.food = randomRes[Math.floor(Math.random() * randomRes.length)];
      plr.age = plr.xp = 0;

      let hatArr = hats.map((h) => h.id);
      let accArr = accessories.map((a) => a.id);
      plr.hatID = hatArr[Math.floor(Math.random() * hatArr.length)];
      plr.accID = accArr[Math.floor(Math.random() * accArr.length)];
      plr.invisible = false;

      let selected = plr.items.indexOf(plr.buildItem);
      let groups = items.map((i) => i.group).filter((g) => g != 0 && g != 13);
      plr.items = [
        getRandomItem(0),
        getRandomItem(groups[Math.floor(Math.random() * groups.length)]),
      ];
      plr.upgradeAge = 10;

      if (selected == -1) plr.selectedWeapon = plr.weapon;
      else
        plr.buildItem =
          plr.items[selected == 0 || selected == 1 ? selected : 1];

      plr.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPDATE_ITEMS, [plr.items, 0])
        )
      );
      plr.client?.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPDATE_ITEMS, [weaponsArray, 1])
        )
      );
      plr.client?.socket.send(
        packetFactory.serializePacket(new Packet(PacketType.UPGRADES, [0, 0]))
      );
      plr.updateResources();
      this.sendLeaderboardUpdates();
      this.sendPlayerUpdates();
    });
  }
  advanceSpikes() {
    let gens: [number, number][] = [];
    let i = ItemType.GreaterSpikes;
    let addAmt = getScale(i) * 1.8;
    let stillAlive = this.state.players.filter(
      (p) => !p.dead && !p.invincible && p.mode !== PlayerMode.spectator
    );

    if (stillAlive.length <= 1 && !this.closing) {
      this.close(
        `Game Finished<br>Winner: ${
          stillAlive.map((p) => p.name).join(", ") || "None"
        }`,
        10
      );
    }

    let currentPos = new Vec2(0 + this.spikeAdvance, 0 + this.spikeAdvance);
    while (currentPos.x < config.mapScale - this.spikeAdvance) {
      gens.push([currentPos.x, currentPos.y]);
      currentPos.add(addAmt, 0);
    }
    currentPos = new Vec2(
      0 + this.spikeAdvance,
      config.mapScale - this.spikeAdvance
    );
    while (currentPos.x < config.mapScale - this.spikeAdvance + addAmt) {
      gens.push([currentPos.x, currentPos.y]);
      currentPos.add(addAmt, 0);
    }
    currentPos = new Vec2(
      config.mapScale - this.spikeAdvance,
      0 + addAmt + this.spikeAdvance
    );
    while (currentPos.y < config.mapScale - this.spikeAdvance) {
      gens.push([currentPos.x, currentPos.y]);
      currentPos.add(0, addAmt);
    }
    currentPos = new Vec2(
      0 + this.spikeAdvance,
      0 + addAmt + this.spikeAdvance
    );
    while (currentPos.y < config.mapScale - this.spikeAdvance) {
      gens.push([currentPos.x, currentPos.y]);
      currentPos.add(0, addAmt);
    }

    let packetFactory = PacketFactory.getInstance();

    this.state.gameObjects
      .filter(
        (g) =>
          g.location.x > this.spawnBounds ||
          g.location.x < this.spikeAdvance ||
          g.location.y > this.spawnBounds ||
          g.location.y < this.spikeAdvance
      )
      .forEach((g) => {
        this.state.removeGameObject(g);
        if (g.isPlayerGameObject()) {
          let placedAmount = this.state.gameObjects.filter(
            (gameObj) =>
              gameObj.data === g.data && gameObj.ownerSID == g.ownerSID
          ).length;
          this.state.players
            .find((p) => p.id == g.ownerSID)
            ?.client?.socket.send(
              packetFactory.serializePacket(
                new Packet(PacketType.UPDATE_PLACE_LIMIT, [
                  getGroupID(g.data),
                  placedAmount,
                ])
              )
            );
        }
      });

    gens.forEach((g) => {
      let sid = this.getNextGameObjectID();
      this.state.gameObjects.push(
        new GameObject(
          sid,
          new Vec2(g[0], g[1]),
          0,
          getScale(i),
          -1,
          undefined,
          i,
          0,
          getGameObjHealth(i),
          getGameObjDamage(i),
          true
        )
      );
    });

    this.state.players.forEach((p) => {
      this.sendGameObjects(p);
    });

    this.spikeAdvance += addAmt;
    this.spawnBounds -= addAmt;
  }
  public winsA: number = 0;
  public winsB: number = 0;

  public windmillTicks = 0;
  public spikeAdvance = 0;
  public spawnBounds = config.mapScale;
  public physBounds = [0, config.mapScale];

  public resizeMap(newSize: number) {
    config.mapScale = newSize;
    config.biomeSize = config.mapScale / 3;
    this.spawnBounds = config.mapScale;
    this.physBounds = [0, config.mapScale];

    this.state.players.forEach((plr) => {
      plr.client?.socket.send(
        PacketFactory.getInstance().serializePacket(
          new Packet(PacketType.MAP_SIZE, [newSize])
        )
      );
    });

    /*this.state.gameObjects.forEach((g) => {
      this.state.removeGameObject(g);
    });
    this.state.animals.forEach((a) => {
      this.state.animals.splice(this.state.animals.indexOf(a), 1);
    });
    generateStructures(this);
    this.spawnAnimals();*/
  }

  /**
   * Handles packets from the client
   * @param client the client sending the message
   * @param packet the packet sent
   */
  onMsg(client: Client, packet: Packet) {
    this.firePacketHandler(packet.type, client, packet);
  }
  public packetHandlers: [PacketHandler, PacketHandlerCallback][] = [];
  public addPacketHandler(handler: PacketHandler, cb: PacketHandlerCallback) {
    this.packetHandlers.push([handler, cb]);
  }
  public firePacketHandler(type: PacketType, client: Client, packet: Packet) {
    let handler = this.packetHandlers.find((p) => p[0].type == type);
    if (handler) handler[0].fire(client, packet, handler[1]);
  }
}

export function getGame() {
  return currentGame;
}
