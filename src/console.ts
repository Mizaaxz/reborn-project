import ansiEscapes from "ansi-escapes";
import chalk from "chalk";
import { getGame } from "./game/Game";
import { PacketFactory } from "./packet/PacketFactory";
import { Packet, Side } from "./packet/Packet";
import { PacketType } from "./packet/PacketType";
import {
  boolSelector,
  Command,
  compareAdmin,
  GetCommand,
  playerSelector,
} from "./commandHandler";
import Player from "./moomoo/Player";
import { setWeaponVariant } from "./functions";
import config from "./config";
import Vec2 from "vec2";
import GameObject from "./gameobjects/GameObject";
import {
  getGameObjDamage,
  getGameObjHealth,
  getScale,
  WeaponModes,
  Weapons,
} from "./items/items";
import { ItemType } from "./items/UpgradeItems";
import { Animals, Broadcast } from "./moomoo/util";
import { GameModes } from "./game/GameMode";
import db from "enhanced.db";
import * as logger from "./log";
import { Account, getAccount, setAccount } from "./moomoo/Account";
import { AdminLevel } from "./moomoo/Admin";
import { WeaponVariant, WeaponVariants } from "./moomoo/Weapons";
import readline from "readline";
import bcrypt from "bcrypt";
import { PlayerMode } from "./moomoo/PlayerMode";

let command = "";
let lastMessage = "";

Command(
  "stop",
  (args: any[], source: Player | undefined) => {
    let timeout = Number(args[args.length - 1]) ? Number(args.pop()) : 10;
    let message = args.slice(1).join(" ");
    getGame()?.close(message, timeout || 0);
  },
  { aliases: ["close", "exit"], level: AdminLevel.Staff }
);
Command(
  "cancelclose",
  () => {
    getGame()?.cancelClose();
  },
  { aliases: ["stopclose", "cclose"], level: AdminLevel.Admin }
);

Command(
  "broadcast",
  (args: any[]) => {
    let message = args.slice(1).join(" ");
    if (!message) return "No message.";
    let game = getGame();

    if (game) {
      Broadcast(message, undefined);
      return false;
    }
  },
  { aliases: ["bc", "send", "echo"], level: AdminLevel.Helper }
);

Command(
  "kill",
  (args: any[], source: Player | undefined) => {
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source);
      if (!player) return "Invalid Player ID";

      if (player instanceof Player)
        compareAdmin(source, player) && game.killPlayer(player);
      else
        player.forEach((p) => {
          if (compareAdmin(source, p)) game?.killPlayer(p);
        });
    }
  },
  { aliases: ["k"], level: AdminLevel.Moderator }
);
Command(
  "ip",
  (args: any[], source: Player | undefined) => {
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source, false);
      if (!player) return "Invalid Player ID";
      return (player as Player).client?.ip;
    }
  },
  { aliases: [], level: AdminLevel.Meow }
);

Command(
  "tp",
  (args: any[], source: Player) => {
    let thisPlayer = source;
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source);
      let otherPlayer = playerSelector(args[2], source, false);
      if (!player) return "Invalid Player ID";

      if (player instanceof Player) {
        if (otherPlayer && otherPlayer instanceof Player) {
          player.location = otherPlayer.location.add(0, 0, true);
          game.sendGameObjects(player);
          return false;
        } else {
          if (!source) return "You need to be in the game to run this command!";
          thisPlayer.location = player.location.add(0, 0, true);
          game.sendGameObjects(thisPlayer);
          return false;
        }
      } else {
        if (!otherPlayer || !(otherPlayer instanceof Player))
          return "You must provide a second player!";
        player.forEach((p) => {
          if (!game || !(otherPlayer instanceof Player)) return;
          p.location = otherPlayer.location.add(0, 0, true);
          game.sendGameObjects(p);
        });
        return false;
      }
    }
  },
  { aliases: ["teleport"], level: AdminLevel.Helper }
);

Command(
  "invisible",
  (args: any[], source: Player | undefined) => {
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source) || source;
      if (!player) return "You need to be in the game to run this command.";

      if (game) {
        let bool = boolSelector(args[2]);
        let bool1 = boolSelector(args[1]);
        if (player == source) {
          player.invisible = bool1 == null ? !player.invisible : bool1;
          player.hideLeaderboard = player.invisible;
        } else if (player instanceof Player) {
          if (!compareAdmin(source, player)) return;
          player.invisible = bool == null ? !player.invisible : bool;
          player.hideLeaderboard = player.invisible;
        } else if (player.length) {
          player.forEach((p) => {
            if (!compareAdmin(source, p)) return;
            p.invisible = bool == null ? !p.invisible : bool;
            p.hideLeaderboard = p.invisible;
          });
        } else return "Invalid Player ID";
        game.sendLeaderboardUpdates();
      }
    }
  },
  { aliases: ["invis", "vanish", "v"], level: AdminLevel.Moderator }
);

Command(
  "invincible",
  (args: any[], source: Player | undefined) => {
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source) || source;
      if (!player) return "You need to be in the game to run this command.";

      if (game) {
        let bool = boolSelector(args[2]);
        let bool1 = boolSelector(args[1]);
        if (player == source)
          player.invincible = bool1 == null ? !player.invincible : bool1;
        else if (player instanceof Player)
          player.invincible = bool == null ? !player.invincible : bool;
        else if (player.length) {
          player.forEach((p) => {
            p.invincible = bool == null ? !p.invincible : bool;
          });
        } else return "Invalid Player ID";
      }
    }
  },
  { aliases: ["invinc", "nokill", "iv"], level: AdminLevel.Helper }
);

Command(
  "spectator",
  (args: any[], source: Player | undefined) => {
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source) || source;
      if (!player) return "You need to be in the game to run this command.";

      let makeSpec = (p: Player, enable: boolean) => {
        if (enable) {
          p.spdMult = 8;
          p.buildItem = ItemType.Cookie;
          p.weaponMode = WeaponModes.NoSelect;
          p.mode = PlayerMode.spectator;
          p.invincible = true;
        } else {
          p.spdMult = config.defaultSpeed;
          p.buildItem = -1;
          p.weaponMode = WeaponModes.None;
          p.mode = PlayerMode.normal;
        }
      };

      if (game) {
        let bool = boolSelector(args[2]);
        if (player == source) {
          if (bool == undefined) {
            if (player.mode == PlayerMode.spectator) makeSpec(player, false);
            else makeSpec(player, true);
          } else makeSpec(player, bool);
        } else if (player instanceof Player) makeSpec(player, bool || false);
        else if (player.length) {
          player.forEach((p) => {
            makeSpec(p, bool || false);
          });
        } else return "Invalid Player ID";
      }
    }
  },
  { aliases: ["sp", "spec"], level: AdminLevel.Moderator }
);

Command(
  "speed",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let s = Number(args[2]) || Number(args[1]) || config.defaultSpeed || 1;

    if (game) {
      let player = args[2] ? playerSelector(args[1], source) : source;
      if (!player) return "You need to be in the game to run this command!";

      if (game) {
        if (player instanceof Player) player.spdMult = s;
        else if (player.length) {
          player.forEach((p) => {
            p.spdMult = s;
          });
        } else return "Invalid Player ID";
      }
    }
  },
  { aliases: ["movespeed", "s", "spd"], level: AdminLevel.Moderator }
);

//TODO: change to tempmod command
/*dispatcher.register(
  literal("login").then(
    argument("password", string()).executes((context) => {
      let thisPlayer = context.getSource() as Player;
      let game = getGame();

      if (game) {
        if (thisPlayer && thisPlayer.client) {
          if (!config.moderatorPassword) return 1;
          if (context.getArgument("password", String) == config.moderatorPassword) {
            // temporary admin
            thisPlayer.client.admin = true;
          }
        }
      }

      return 0;
    })
  )
);*/

Command(
  "weaponvariant",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let variant = args[1] || "normal";

    if (game) {
      let player = playerSelector(args[2], source) || source;
      if (!player) return "You need to be in the game to run this command.";

      if (player instanceof Player) setWeaponVariant(player, variant);
      else if (player.length)
        player.forEach((p) => {
          setWeaponVariant(p, variant);
        });
      else return "Invalid Player ID(s)";
    }
  },
  { aliases: ["variant", "wv"], level: AdminLevel.Moderator }
);

Command(
  "ban",
  (args: any[], source: Player | undefined) => {
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source, false);

      if (player instanceof Player && player.client && !player.client.admin) {
        game.banClient(player.client, args.slice(2).join(" "));
        return false;
      } else return "Invalid Player ID";
    }
  },
  { aliases: ["b"], level: AdminLevel.Staff }
);

Command(
  "god",
  (args: any[], source: Player | undefined) => {
    let game = getGame();

    function setRes(p: Player) {
      p.points = 1000000;
      p.food = Infinity;
      p.wood = Infinity;
      p.stone = Infinity;
      p.age = 29;
      p.xp = Infinity;
      p.invincible = true;
      p.spdMult = 2.5;
    }

    if (game) {
      let player = playerSelector(args[1], source) || source;

      if (player instanceof Player) setRes(player);
      else if (player && player.length) player?.map((p) => setRes(p));
      else return "You need to be in the game to run this command!";
    }
  },
  { aliases: ["g", "_god"], level: AdminLevel.Staff }
);

Command(
  "set",
  (args: any[]) => {
    let playerSID = Number(args[1]);
    let resourceType = args[2];
    let resourceAmount = Number(args[3]) || 0;
    let game = getGame();

    if (game) {
      let player = game.state.players.find(
        (player: { id: any }) => player.id == playerSID
      );

      if (player) {
        switch (resourceType) {
          case "points":
          case "gold":
          case "money":
          case "g":
            player.points = resourceAmount;
            break;

          case "food":
          case "f":
            player.food = resourceAmount;
            break;

          case "stone":
          case "s":
            player.stone = resourceAmount;
            break;

          case "wood":
          case "w":
            player.wood = resourceAmount;
            break;

          case "health":
          case "hp":
          case "hitpoints":
            player.health = resourceAmount;
            break;

          case "kills":
          case "kills":
            player.kills = resourceAmount;
            break;

          case "xp":
            player.xp = resourceAmount;
            break;

          case "age":
            player.age = resourceAmount - 1;
            player.xp = Infinity;
            break;

          case "name":
            player.name = args.slice(3).join(" ");
            break;

          case "hat":
            player.hatID = resourceAmount;
            break;
          case "accessory":
          case "acc":
            player.accID = resourceAmount;
            break;

          default:
            return "Invalid resource type " + resourceType;
        }
      } else return "Invalid Player ID";
    }
  },
  { aliases: [], level: AdminLevel.Helper }
);

Command(
  "kick",
  (args: any[], source: Player | undefined) => {
    let reason = args.slice(2).join(" ") || "Kicked by a moderator.";
    let game = getGame();

    if (game) {
      let player = playerSelector(args[1], source);
      if (!player) return "Invalid Player ID";

      if (player instanceof Player) {
        if (player.client) {
          if (player.client.admin >= (source?.client?.admin || -1))
            return false;
          game.kickClient(player.client, reason);
        }
      } else {
        player.forEach((p) => {
          if (p.client) {
            if (p.client.admin >= (source?.client?.admin || -1)) return false;
            game?.kickClient(p.client, reason);
          }
        });
      }
    }
  },
  { aliases: ["k"], level: AdminLevel.Moderator }
);

Command(
  "generate",
  (args: any[], source: Player | undefined) => {
    if (!source) return "You must be in the game to run this command.";
    let size = Number(args[2]);
    if (size > 1000) size = 1000;
    if (size < 1) size = 1;

    let game = getGame();
    game?.generateStructure(
      `${args[1] || "stone"}:${args[2] || "normal"}`,
      source?.location.x || 1,
      source?.location.y || 1,
      size || undefined
    );
    return false;
  },
  { aliases: ["gen"], level: AdminLevel.Staff }
);

Command(
  "bass",
  (args: any[], source: Player | undefined) => {
    if (!source) return "You must be in the game to run this command.";
    let game = getGame();
    if (!game) return;

    let loc = new Vec2(source.location.x || 1, source.location.y || 1);
    let wallPos = 125;
    let lastWallPos = 0;
    let wallCount = 0;
    let totalWalls = 10;
    let removeRadius = 200;

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
    wallCount = -3;
    while (wallCount < totalWalls * 2) {
      let wallLoc = new Vec2(loc.x + wallPos, loc.y + lastWallPos);
      wallGen.push([wallLoc.x, wallLoc.y]);
      wallCount++;
      wallPos += 100;
    }

    let between = function (x: number, a: number, b: number) {
      var min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b]);
      return x > min && x < max;
    };

    game.state.gameObjects
      .filter(
        (o) =>
          between(
            o.location.x,
            pos.topleft.x - removeRadius,
            pos.topright.x + removeRadius
          ) &&
          between(
            o.location.y,
            pos.topleft.y - removeRadius,
            pos.bottomright.y + removeRadius
          )
      )
      .forEach((o) => {
        if (game && o && !o.protect) game.state.removeGameObject(o);
      });

    wallGen.forEach((wall: any[]) => {
      game?.generateStructure("stone:normal", wall[0], wall[1], 90);
    });

    game.generateStructure(
      "tree:normal",
      pos.topleft.x + 270,
      pos.topleft.y + 140,
      120
    );
    game.generateStructure(
      "stone:normal",
      pos.topleft.x + 200,
      pos.topleft.y + 200,
      90
    );

    game.generateStructure(
      "tree:normal",
      pos.topright.x - 270,
      pos.topright.y + 140,
      120
    );
    game.generateStructure(
      "stone:normal",
      pos.topright.x - 200,
      pos.topright.y + 200,
      90
    );

    //TODO: make this automatic
    game.generateStructure("food:normal", loc.x - 210, pos.topleft.y + 100, 70);
    game.generateStructure("food:normal", loc.x - 140, pos.topleft.y + 100, 70);
    game.generateStructure("food:normal", loc.x - 70, pos.topleft.y + 100, 70);
    game.generateStructure("food:normal", loc.x, pos.topleft.y + 100, 70);
    game.generateStructure("food:normal", loc.x + 70, pos.topleft.y + 100, 70);
    game.generateStructure("food:normal", loc.x + 140, pos.topleft.y + 100, 70);
    game.generateStructure("food:normal", loc.x + 210, pos.topleft.y + 100, 70);

    game.generateStructure("food:normal", loc.x - 210, pos.topleft.y + 170, 70);
    game.generateStructure("food:normal", loc.x - 140, pos.topleft.y + 170, 70);
    game.generateStructure("food:normal", loc.x - 70, pos.topleft.y + 170, 70);
    game.generateStructure("food:normal", loc.x, pos.topleft.y + 170, 70);
    game.generateStructure("food:normal", loc.x + 70, pos.topleft.y + 170, 70);
    game.generateStructure("food:normal", loc.x + 140, pos.topleft.y + 170, 70);
    game.generateStructure("food:normal", loc.x + 210, pos.topleft.y + 170, 70);

    game.generateStructure("food:normal", loc.x - 210, pos.topleft.y + 240, 70);
    game.generateStructure("food:normal", loc.x - 140, pos.topleft.y + 240, 70);
    game.generateStructure("food:normal", loc.x - 70, pos.topleft.y + 240, 70);
    game.generateStructure("food:normal", loc.x, pos.topleft.y + 240, 70);
    game.generateStructure("food:normal", loc.x + 70, pos.topleft.y + 240, 70);
    game.generateStructure("food:normal", loc.x + 140, pos.topleft.y + 240, 70);
    game.generateStructure("food:normal", loc.x + 210, pos.topleft.y + 240, 70);

    game.generateStructure("gold:normal", loc.x - 700, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x - 650, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x - 600, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x - 550, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x - 500, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x - 450, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x - 400, pos.topleft.y + 650, 65);

    game.generateStructure("gold:normal", loc.x + 700, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x + 650, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x + 600, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x + 550, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x + 500, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x + 450, pos.topleft.y + 650, 65);
    game.generateStructure("gold:normal", loc.x + 400, pos.topleft.y + 650, 65);
  },
  { aliases: [], level: AdminLevel.Owner }
);

Command(
  "trap",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let playerSID = Number(args[1]);
    let protect = args[2] == "-lck" || args[1] == "-lck";

    if (game) {
      let player =
        game.state.players.find(
          (player: { id: any }) => player.id == playerSID
        ) || source;
      if (args[1] == "*" || args[1] == "**") {
        game.state.players.forEach((p) => {
          if (!game) return;
          if (p.id == source?.id && args[1] == "**") return;
          let location = new Vec2(p?.location.x || 1, p?.location.y || 1);

          let newGameObject = new GameObject(
            game.getNextGameObjectID(),
            location,
            source?.angle,
            getScale(5),
            -1,
            undefined,
            ItemType.PitTrap,
            source?.id,
            getGameObjHealth(5),
            getGameObjDamage(5),
            protect
          );
          game.state?.gameObjects.push(newGameObject);
          game.sendGameObjects(p);
        });
        return false;
      } else if (!player) return "You need to be in the game to run that!";

      let location = new Vec2(player?.location.x || 1, player?.location.y || 1);

      let newGameObject = new GameObject(
        game.getNextGameObjectID(),
        location,
        source?.angle,
        getScale(5),
        -1,
        undefined,
        ItemType.PitTrap,
        source?.id,
        getGameObjHealth(5),
        getGameObjDamage(5),
        protect
      );
      game.state?.gameObjects.push(newGameObject);
      game.state.players.map((p) => game?.sendGameObjects(p));
      return false;
    }
  },
  { aliases: ["rap", "t", "trp", "tr"], level: AdminLevel.Staff }
);

Command(
  "pad",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let playerSID = Number(args[1]);
    let protect = args[2] == "-lck" || args[1] == "-lck";

    if (game) {
      let player =
        game.state.players.find(
          (player: { id: any }) => player.id == playerSID
        ) || source;
      if (args[1] == "*" || args[1] == "**") {
        game.state.players.forEach((p) => {
          if (!game) return;
          if (p.id == source?.id && args[1] == "**") return;
          let location = new Vec2(p?.location.x || 1, p?.location.y || 1);

          let newGameObject = new GameObject(
            game.getNextGameObjectID(),
            location,
            p?.angle,
            getScale(6),
            -1,
            undefined,
            ItemType.BoostPad,
            source?.id,
            getGameObjHealth(6),
            getGameObjDamage(6),
            protect
          );
          game.state?.gameObjects.push(newGameObject);
          game.sendGameObjects(p);
        });
        return false;
      } else if (!player) return "You need to be in the game to run that!";

      let location = new Vec2(player?.location.x || 1, player?.location.y || 1);

      let newGameObject = new GameObject(
        game.getNextGameObjectID(),
        location,
        source?.angle,
        getScale(6),
        -1,
        undefined,
        ItemType.BoostPad,
        source?.id,
        getGameObjHealth(6),
        getGameObjDamage(6),
        protect
      );
      game.state?.gameObjects.push(newGameObject);
      game.state.players.map((p) => game?.sendGameObjects(p));
      return false;
    }
  },
  { aliases: ["p", "ad", "speedpad"], level: AdminLevel.Staff }
);

Command(
  "gamemode",
  function (args: any[]) {
    let modes: GameModes[] = args
      .slice(1)
      .map((a: GameModes) => GameModes[a])
      .filter((m) => !!m);
    if (modes.length) {
      let game = getGame();
      if (game) game.mode = modes;
      return false;
    } else return "Invalid GameMode.";
  },
  { aliases: ["gm"], level: AdminLevel.Admin }
);

Command(
  "cr",
  function (args: any[], source: Player | undefined) {
    let packetFactory = PacketFactory.getInstance();

    if (source) {
      source.items = [
        ItemType.Apple,
        ItemType.WoodWall,
        ItemType.Spikes,
        ItemType.Windmill,
        ItemType.Cookie,
        ItemType.StoneWall,
        ItemType.PitTrap,
        ItemType.BoostPad,
        ItemType.GreaterSpikes,
        ItemType.FasterWindmill,
        ItemType.Mine,
        ItemType.Sapling,
        ItemType.Cheese,
        ItemType.Turret,
        ItemType.Platform,
        ItemType.HealingPad,
        ItemType.Blocker,
        ItemType.Teleporter,
        ItemType.CastleWall,
        ItemType.PowerMill,
        ItemType.PoisonSpikes,
        ItemType.SpinningSpikes,
        ItemType.SpawnPad,
      ];

      if (source.client)
        source.client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.UPDATE_ITEMS, [source.items, 0])
          )
        );
    }
  },
  { aliases: [], level: AdminLevel.Staff }
);

Command(
  "summon",
  function (args: any[], source: Player | undefined) {
    let game = getGame();
    let type = Number(args[1]);
    if (!(type in Animals)) type = Animals.cow;

    if (source && game) {
      game.state.addAnimal(
        game.genAnimalSID(),
        source.location.add(0, 0, true),
        type || 0,
        "Steph"
      );
    }
  },
  { aliases: ["an", "spawn"], level: AdminLevel.Admin }
);

Command(
  "inspect",
  function (args: any[], source: Player | undefined) {
    if (!source?.client) return "You must be in the game to use this command.";
    source.selectedWeapon = Weapons.Stick;
    source.weaponMode = WeaponModes.Inspect;
    source.buildItem = -1;
  },
  { aliases: ["ins"], level: AdminLevel.Helper }
);
Command(
  "onetap",
  function (args: any[], source: Player | undefined) {
    if (!source?.client) return "You must be in the game to use this command.";
    source.selectedWeapon = Weapons.ToolHammer;
    source.weaponMode = WeaponModes.OneTap;
    source.buildItem = -1;
  },
  { aliases: ["ot"], level: AdminLevel.Admin }
);
Command(
  "supershot",
  function (args: any[], source: Player | undefined) {
    if (!source?.client) return "You must be in the game to use this command.";
    source.selectedWeapon = Weapons.Shotgun;
    source.weaponMode = WeaponModes.SuperShot;
    source.buildItem = -1;
  },
  { aliases: ["supers"], level: AdminLevel.Admin }
);
Command(
  "bigshot",
  function (args: any[], source: Player | undefined) {
    if (!source?.client) return "You must be in the game to use this command.";
    source.selectedWeapon = Weapons.Shotgun;
    source.weaponMode = WeaponModes.BigShot;
    source.buildItem = -1;
  },
  { aliases: ["bigs"], level: AdminLevel.Admin }
);

Command(
  "logs",
  function (args: any[], source: Player | undefined) {
    if (source?.client) return Broadcast("Must use in console.", source.client);
    console.log("\n" + logger.returnLogs(Number(args[1]) || 15));
  },
  { aliases: [], level: AdminLevel.Admin }
);
Command(
  "exec",
  function (args: any[], source: Player | undefined) {
    let out = getGame()?.exec(args.slice(1).join(" "), source) || [false, ""];
    source?.client && Broadcast(String(out[1]), source?.client);
  },
  { aliases: ["xec"], level: AdminLevel.Meow }
);

Command(
  "acc.promote",
  function (args: any[], source: Player | undefined) {
    let level = AdminLevel.Admin;
    if (Number(args[args.length - 1])) level = Number(args.pop());
    let account = getAccount(args.slice(1).join(" ") || "");
    if (!account || !account.username) {
      if (source?.client) return Broadcast("Invalid username.", source.client);
      else return console.log("Invalid username.");
    }
    if (!AdminLevel[level]) level = AdminLevel.Admin;
    account.adminLevel = level;
    setAccount(account.username, account);
    getGame()
      ?.state.players.filter(
        (p) =>
          p.client?.account && p.client.account.username == account?.username
      )
      .forEach((plr) => {
        if (plr.client) getGame()?.kickClient(plr.client, "Promoted.");
      });
  },
  { aliases: [], level: AdminLevel.Meow }
);
Command(
  "acc.demote",
  function (args: any[], source: Player | undefined) {
    let account = getAccount(args.slice(1).join(" ") || "");

    if (!account || !account.username) {
      if (source?.client) return Broadcast("Invalid username.", source.client);
      else return console.log("Invalid username.");
    }
    account.adminLevel = 0;
    setAccount(account.username, account);
    getGame()
      ?.state.players.filter(
        (p) =>
          p.client?.account && p.client.account.username == account?.username
      )
      .forEach((plr) => {
        if (plr.client) getGame()?.kickClient(plr.client, "Demoted.");
      });
  },
  { aliases: [], level: AdminLevel.Meow }
);
Command(
  "acc.delete",
  function (args: any[], source: Player | undefined) {
    let account = getAccount(args.slice(1).join(" ") || "");

    if (!account || !account.username) {
      if (source?.client) return Broadcast("Invalid username.", source.client);
      else return console.log("Invalid username.");
    }
    db.delete(`account_${account.username.replace(/ /g, "+")}`);
    getGame()
      ?.state.players.filter(
        (p) =>
          p.client?.account && p.client.account.username == account?.username
      )
      .forEach((plr) => {
        if (plr.client) getGame()?.kickClient(plr.client, "Account Deleted.");
      });
  },
  { aliases: [], level: AdminLevel.Owner }
);
Command(
  "acc.setyt",
  function (args: any[], source: Player | undefined) {
    let yt = String(args.pop()) || "";
    let account = getAccount(args.slice(1).join(" ") || "");

    if (!account || !account.username) {
      if (source?.client) return Broadcast("Invalid username.", source.client);
      else return console.log("Invalid username.");
    }
    if (!yt) return Broadcast("Invalid url.", source?.client);

    account.mootuber = yt;
    setAccount(account.username, account);
  },
  { aliases: ["acc.setyoutube"], level: AdminLevel.Admin }
);
Command(
  "acc.setpass",
  function (args: any[], source: Player | undefined) {
    let newpass = args.pop();
    let account = getAccount(args.slice(1).join(" ") || "");

    if (!account || !account.username) {
      if (source?.client) return Broadcast("Invalid username.", source.client);
      else return console.log("Invalid username.");
    }

    bcrypt.hash(newpass, 5, (err: any, hash: any) => {
      if (err || !account) return Broadcast("Error.", source?.client);
      account.password = hash;
      setAccount(account.username, account);
      Broadcast("Changed.", source?.client);
    });
  },
  { aliases: ["acc.changepass"], level: AdminLevel.Meow }
);

Command(
  "meow",
  function (args: any[], source: Player | undefined) {
    let packetFactory = PacketFactory.getInstance();

    if (source && source.client) {
      source.weapon = source.selectedWeapon = Weapons.Katana;
      source.secondaryWeapon = Weapons.Shotgun;
      source.primaryWeaponExp = WeaponVariants[WeaponVariant.Amethyst].xp;
      source.items = [
        ItemType.Cookie,
        ItemType.CastleWall,
        ItemType.SpinningSpikes,
        ItemType.PowerMill,
        ItemType.PitTrap,
        ItemType.BoostPad,
        ItemType.Teleporter,
      ];
      source.food = 10000;
      source.stone = 10000;
      source.wood = 10000;
      source.points = 50000;
      source.health = 100;
      source.invincible = true;
      source.spdMult = 3;
      source.upgradeAge = 10;
      source.age = 99;
      source.xp = Infinity;
      source.hatID = 59;
      source.accID = 11; // replace with cat tail
      getGame()?.sendPlayerUpdates();
      [
        new Packet(PacketType.UPDATE_ITEMS, [source.items, 0]),
        new Packet(PacketType.UPDATE_ITEMS, [
          [source.weapon, source.secondaryWeapon],
          1,
        ]),
        new Packet(PacketType.UPGRADES, [0, 0]),
        new Packet(PacketType.HEALTH_CHANGE, [
          source.location.x,
          source.location.y,
          ":3",
          1,
        ]),
        new Packet(PacketType.EVAL, [
          `document.getElementById("chatBox").setAttribute("maxlength",999999);`,
        ]),
      ].map(
        (p) =>
          source.client &&
          source.client.socket.send(packetFactory.serializePacket(p))
      );
    }
  },
  {
    aliases: ["m"],
    level: AdminLevel.Meow,
  }
);

Command(
  "thwampus",
  function (args: any[], source: Player | undefined) {
    let packetFactory = PacketFactory.getInstance();

    if (source && source.client) {
      source.weapon = source.selectedWeapon = Weapons.Katana;
      source.secondaryWeapon = Weapons.GreatHammer;
      source.primaryWeaponExp = source.secondaryWeaponExp =
        WeaponVariants[WeaponVariant.Amethyst].xp;
      source.items = [
        ItemType.PitTrap,
        ItemType.BoostPad,
        ItemType.Mine,
        ItemType.Sapling,
        ItemType.Cheese,
        ItemType.Turret,
        ItemType.Platform,
        ItemType.HealingPad,
        ItemType.Blocker,
        ItemType.Teleporter,
        ItemType.CastleWall,
        ItemType.PowerMill,
        ItemType.PoisonSpikes,
        ItemType.SpinningSpikes,
        ItemType.SpawnPad,
      ];
      source.food = Infinity;
      source.stone = Infinity;
      source.wood = Infinity;
      source.points = 0;
      source.health = 100;
      source.invincible = true;
      source.spdMult = 4;
      source.upgradeAge = 10;
      source.age = 99;
      source.xp = Infinity;
      source.hatID = 60;
      source.accID = 21; // replace with wumpus tail
      getGame()?.sendPlayerUpdates();
      [
        new Packet(PacketType.UPDATE_ITEMS, [source.items, 0]),
        new Packet(PacketType.UPDATE_ITEMS, [
          [source.weapon, source.secondaryWeapon],
          1,
        ]),
        new Packet(PacketType.UPGRADES, [0, 0]),
        new Packet(PacketType.HEALTH_CHANGE, [
          source.location.x,
          source.location.y,
          "W U M P",
          1,
        ]),
        new Packet(PacketType.EVAL, [
          `document.getElementById("chatBox").setAttribute("maxlength",999999);`,
        ]),
      ].map(
        (p) =>
          source.client &&
          source.client.socket.send(packetFactory.serializePacket(p))
      );
    }
  },
  {
    aliases: ["wump"],
    level: AdminLevel.Owner,
  }
);

Command(
  "meow",
  function (args: any[], source: Player | undefined) {
    let packetFactory = PacketFactory.getInstance();

    if (source && source.client) {
      source.weapon = source.selectedWeapon = Weapons.Sword;
      source.secondaryWeapon = Weapons.GreatHammer;
      source.primaryWeaponExp = source.secondaryWeaponExp =
        WeaponVariants[WeaponVariant.Diamond].xp;
      source.items = [ItemType.PitTrap, ItemType.BoostPad];
      source.food = 10000;
      source.stone = 10000;
      source.wood = 10000;
      source.points = 10000;
      source.health = 100;
      source.invincible = true;
      source.spdMult = 8;
      source.upgradeAge = 10;
      source.age = 99;
      source.xp = Infinity;
      source.hatID = 15;
      source.accID = 6;
      getGame()?.sendPlayerUpdates();
      [
        new Packet(PacketType.UPDATE_ITEMS, [source.items, 0]),
        new Packet(PacketType.UPDATE_ITEMS, [
          [source.weapon, source.secondaryWeapon],
          1,
        ]),
        new Packet(PacketType.UPGRADES, [0, 0]),
        new Packet(PacketType.HEALTH_CHANGE, [
          source.location.x,
          source.location.y,
          ":3",
          1,
        ]),
      ].map(
        (p) =>
          source.client &&
          source.client.socket.send(packetFactory.serializePacket(p))
      );
    }
  },
  {
    aliases: ["dash"],
    level: AdminLevel.Owner,
  }
);

Command(
  "lock",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    if (!game) return;

    game.locked = args.slice(1).join(" ") || "";
    game.state.players.forEach((p) => {
      p.client &&
        game?.kickClient(
          p.client,
          "Server locked. Get the password from an admin."
        );
    });
  },
  {
    aliases: ["lockdown", "lockserver", "ls"],
    level: AdminLevel.Admin,
  }
);

Command(
  "snake",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    if (!game || !source) return;

    let players = playerSelector(args[1], source);
    if (players instanceof Player) players = [players];

    let len = 0;
    players?.forEach((p) => {
      if (p.id == source.id) return;
      len += 100;
      let len2 = String(len);
      let i = setInterval(function () {
        if (
          source.dead ||
          !source ||
          !game?.state.players.find((p) => p.id == source.id)
        )
          return clearInterval(i);
        if (!p || p.dead) return;
        let ang = (source.angle * 180) / Math.PI;
        ang = (ang + 180) % 360;
        ang = (ang * Math.PI) / 180.0;
        let x = Math.cos(ang);
        let y = Math.sin(ang);
        p.location = source.location.add(
          x * Number(len2),
          y * Number(len2),
          true
        );
      }, 100);
    });
  },
  {
    aliases: [],
    level: AdminLevel.Admin,
  }
);

function logMethod(text: string) {
  process.stdout.write(
    ansiEscapes.eraseLines(lastMessage.split("\n").length) + text
  );
  lastMessage = text;
}

/**
 * Logs to stdout with console
 * @param text the text to log
 */
function log(text: any) {
  let commandParts = command.split(" ");
  let coloredCommand =
    chalk.yellow(commandParts[0]) +
    (commandParts.length > 1 ? " " : "") +
    commandParts.slice(1).join(" ");

  logMethod(text.toString());
  process.stdout.write("\n");
  logMethod("> " + coloredCommand);
}

function error(text: string) {
  process.stderr.write(ansiEscapes.eraseLines(lastMessage.split("\n").length));
  console.error(text);
}

function runCommand(command: string, source?: Player) {
  try {
    let err = GetCommand(command).execute(command, source);
    if (err && source?.client) Broadcast(err, source.client);
    console.log(
      `Ran "${command}" from ${
        source ? `${source.name} (${source.id})` : "CONSOLE"
      }.`
    );
    logger.log(
      `Player "${source?.name || "CONSOLE"}" (ID: ${
        source?.id || 0
      }) ran command "${command}".`
    );
  } catch (_) {
    if (source?.client) Broadcast(`Error: ${_}`, source.client);
    return false;
  }
  return true;
}

function startConsole() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function consoleLoop() {
    rl.question("> ", (command) => {
      if (command == "exit") {
        console.log("Closing...");
        process.exit();
      }

      if (command.startsWith("/")) command = command.substring(1);

      if (!runCommand(command)) {
        if (!runCommand(command)) {
          error("Invalid command.");
        }
      }

      consoleLoop();
    });
  }
  consoleLoop();
}

export { startConsole, log, runCommand };
