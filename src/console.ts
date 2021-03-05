import ansiEscapes from "ansi-escapes";
import chalk from "chalk";
import { getGame } from "./moomoo/Game";
import { PacketFactory } from "./packets/PacketFactory";
import { Command, GetCommand } from "./commandHandler";
import Player from "./moomoo/Player";
import { setWeaponVariant } from "./functions";
import config from "./config";
import Vec2 from "vec2";
import GameObject from "./gameobjects/GameObject";
import { getGameObjDamage, getGameObjHealth, getScale } from "./items/items";
import { ItemType } from "./items/UpgradeItems";
import { Broadcast } from "./moomoo/util";
import { GameModes } from "./moomoo/GameMode";
import { gameObjectSizes, GameObjectType } from "./gameobjects/gameobjects";

let command = "";
let lastMessage = "";

Command(
  "stop",
  (args: any[], source: Player | undefined) => {
    Broadcast("no", source?.client);
    //Broadcast("Restarting server in 10 seconds...")
    //setTimeout(function() {process.exit()}, 10000)
    //process.exit();
  },
  []
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
  ["bc", "send", "echo"]
);

Command(
  "kill",
  (args: any[]) => {
    let playerSID = Number(args[1]);
    if (!playerSID) return "Invalid Player ID";
    let game = getGame();

    if (game) {
      let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

      if (player) {
        game.killPlayer(player);
        return false;
      } else return "Invalid Player ID";
    }
  },
  ["k"]
);

Command(
  "tp",
  (args: any[], source: Player) => {
    let playerSID = Number(args[1]);
    let tpTo = Number(args[2]);
    let thisPlayer = source;
    let game = getGame();

    if (game) {
      let player = game.state.players.find((player: { id: any }) => player.id == playerSID);
      let otherPlayer = game.state.players.find((plyr: { id: any }) => plyr.id == tpTo);

      if (player) {
        if (!tpTo) {
          if (!source) return "You need to be in the game to run this command!";
          thisPlayer.location = player.location.add(0, 0, true);
          game.sendGameObjects(thisPlayer);
          return false;
        } else if (otherPlayer) {
          player.location = otherPlayer.location.add(0, 0, true);
          game.sendGameObjects(player);
          return false;
        } else return "Invalid Player ID(s)";
      } else if (args[1] == "*" || args[1] == "**") {
        if (!tpTo) return "You can not use the */** selector without a second argument.";
        else if (otherPlayer) {
          game.state.players.forEach((p) => {
            if (!game || !otherPlayer) return;
            if (args[1] == "**" && p.id == source.id) return;
            p.location = otherPlayer.location.add(0, 0, true);
            game.sendGameObjects(p);
          });
          return false;
        } else return "Invalid Player ID(s)";
      }
    }
  },
  ["teleport"]
);

Command(
  "invisible",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let playerSID = Number(args[1]);
    let player = source;
    if (game) {
      if (playerSID)
        player = game.state.players.find((player: { id: any }) => player.id == playerSID);
      if (!player && !source) return "You need to be in the game to run this command.";

      if (game) {
        if (player) {
          player.invisible = !player.invisible;
          return false;
        } else return "Invalid Player ID";
      }
    }
  },
  ["invis", "vanish"]
);

Command(
  "invincible",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let playerSID = Number(args[1]);
    let player = source;
    if (game) {
      if (playerSID)
        player = game.state.players.find((player: { id: any }) => player.id == playerSID);
      if (!player && !source) return "You need to be in the game to run this command.";

      if (game) {
        if (player) {
          player.invincible = !player.invincible;
          return false;
        } else return "Invalid Player ID";
      }
    }
  },
  ["invinc", "nokill"]
);

Command(
  "speed",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let playerSID = Number(args[2]);
    let player = source;
    if (game) {
      if (playerSID)
        player = game.state.players.find((player: { id: any }) => player.id == playerSID);

      if (!player && !source) return "You need to be in the game to run this command!";

      if (game) {
        if (player) {
          player.spdMult = Number(args[1]) || config.defaultSpeed || 1;
          return false;
        } else return "Invalid Player ID";
      }
    }
  },
  ["movespeed", "s", "spd"]
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
    let playerSID = Number(args[2]);
    let player = source;
    let variant = args[1] || "normal";

    if (game) {
      if (playerSID)
        player = game.state.players.find((player: { id: any }) => player.id == playerSID);

      if (!player || !source) return "You need to be in the game to run this command.";

      if (game) {
        if (player) {
          let variantSet = setWeaponVariant(player, variant);
          if (variantSet == 1) {
            return "Invalid weapon variant " + variant;
          } else return false;
        } else return "Invalid Player ID";
      }
    }
  },
  ["variant", "wv"]
);

Command(
  "ban",
  (args: any[]) => {
    let playerSID = Number(args[1]);
    let game = getGame();

    if (game) {
      let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

      if (player && player.client && !player.client.admin) {
        game.banClient(player.client);
        return false;
      } else return "Invalid Player ID";
    }
  },
  ["b"]
);

Command(
  "promote",
  (args: any[]) => {
    let playerSID = Number(args[1]);
    let game = getGame();

    if (game) {
      let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

      if (player && player.client) {
        game.addModerator(player.client);
        return false;
      } else return "Invalid Player ID";
    }
  },
  ["mod", "admin"]
);
Command(
  "rmadmin",
  (args: any[]) => {
    let playerSID = Number(args[1]);
    let game = getGame();

    if (game) {
      let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

      if (player && player.client) {
        game.remModerator(player.client);
        return false;
      } else return "Invalid Player ID";
    }
  },
  ["mod", "admin"]
);

Command(
  "god",
  (args: any[], source: Player | undefined) => {
    let playerSID = Number(args[1]);
    let game = getGame();

    if (game) {
      let player =
        game.state.players.find((player: { id: any }) => player.id == playerSID) || source;

      if (player) {
        player.points = 1000000;
        player.food = Infinity;
        player.wood = Infinity;
        player.stone = Infinity;
        player.age = 29;
        player.xp = Infinity;
        player.invincible = true;
        player.spdMult = 2.5;
        return false;
      } else return "You need to be in the game to run this command!";
    }
  },
  []
);

Command(
  "set",
  (args: any[]) => {
    let playerSID = Number(args[1]);
    let resourceType = args[2];
    let resourceAmount = Number(args[3]) || 0;
    let game = getGame();

    if (game) {
      let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

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

          case "tribe":
            let tribe = game.state.tribes.filter(
              (t) => t.name.toLowerCase() == args.slice(3).join(" ")
            )[0];
            if (tribe) {
              let tribeIndex = game.state.tribes.findIndex((t) =>
                t.membersSIDs.includes(player?.id as number)
              );
              let inTribe = game.state.tribes[tribeIndex];

              if (inTribe && inTribe.ownerSID == player.id) {
                game.state.removeTribe(tribeIndex);
                if (player.client) player.client.tribeJoinQueue = [];
              } else {
                game.state.leaveClan(player, tribeIndex);
              }
              game.state.joinClan(player, tribe);
            } else player.clanName = args.slice(3).join(" ");
            break;

          default:
            return "Invalid resource type " + resourceType;
        }
      } else return "Invalid Player ID";
    }
  },
  []
);

Command(
  "kick",
  (args: any[], source: Player | undefined) => {
    let playerSID = Number(args[1]);
    let reason = args.slice(2).join(" ") || "Kicked by a moderator.";
    let game = getGame();

    if (game) {
      let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

      if (player && player.client) game.kickClient(player.client, reason);
      else if (args[1] == "*" || args[1] == "**") {
        game.state.players.forEach((p) => {
          if (source && p.id == source.id && args[1] == "**") return;
          if (p && p.client) game?.kickClient(p.client, reason);
        });
      } else return "Invalid Player ID";
    }
  },
  ["k"]
);

Command(
  "generate",
  (args: any[], source: Player | undefined) => {
    if (!source) return "You must be in the game to run this command.";
    let size = Number(args[2]);
    if (size > 3000) size = 3000;
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
  ["create", "createnode", "gen"]
);

Command(
  "generatebase",
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
          between(o.location.x, pos.topleft.x - removeRadius, pos.topright.x + removeRadius) &&
          between(o.location.y, pos.topleft.y - removeRadius, pos.bottomright.y + removeRadius)
      )
      .forEach((o) => {
        if (game && o && !o.protect) game.state.removeGameObject(o);
      });

    wallGen.forEach((wall: any[]) => {
      game?.generateStructure("stone:normal", wall[0], wall[1], 90);
    });

    game.generateStructure("tree:normal", pos.topleft.x + 270, pos.topleft.y + 140, 120);
    game.generateStructure("stone:normal", pos.topleft.x + 200, pos.topleft.y + 200, 90);

    game.generateStructure("tree:normal", pos.topright.x - 270, pos.topright.y + 140, 120);
    game.generateStructure("stone:normal", pos.topright.x - 200, pos.topright.y + 200, 90);

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
  ["genbase", "base"]
);

Command(
  "trap",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let playerSID = Number(args[1]);
    let protect = args[2] == "-p" || args[1] == "-p";

    if (game) {
      let player =
        game.state.players.find((player: { id: any }) => player.id == playerSID) || source;
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
  ["rap", "t", "trp", "tr"]
);

Command(
  "pad",
  (args: any[], source: Player | undefined) => {
    let game = getGame();
    let playerSID = Number(args[1]);
    let protect = args[2] == "-p" || args[1] == "-p";

    if (game) {
      let player =
        game.state.players.find((player: { id: any }) => player.id == playerSID) || source;
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
  ["p", "ad", "speedpad"]
);

Command(
  "gamemode",
  function (args: any[]) {
    let mode: GameModes = args[1].toLowerCase();
    if (mode && GameModes[mode]) {
      let game = getGame();
      if (game) game.mode = mode;
      return false;
    } else return "Invalid GameMode.";
  },
  ["gm"]
);

function logMethod(text: string) {
  process.stdout.write(ansiEscapes.eraseLines(lastMessage.split("\n").length) + text);
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

let specialChars = ["\b", "\n", "\r"];

function runCommand(command: string, source?: Player) {
  try {
    let err = GetCommand(command).execute(command, source);
    if (err && source?.client) Broadcast(err, source.client);
    console.log(`Ran "${command}" from ${source?.name} (${source?.id}).`);
  } catch (_) {
    if (source?.client) Broadcast(`Error: ${_}`, source.client);
    return false;
  }
  return true;
}

function startConsole() {
  if (!process.stdin.setRawMode) return;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (key) => {
    let char = key.toString("utf8");

    if (char === "\u0003") {
      process.exit();
    }

    if (!specialChars.includes(char) && char.length === 1) {
      command += char;
    }

    if ((char === "\b" || char === "\u007F") && command.length > 0) {
      command = command.substr(0, command.length - 1);
    } else if (char === "\x0D") {
      if (!runCommand(command)) {
        if (!runCommand(command)) {
          error("Invalid command.");
        }
      }

      command = "";
    }

    let commandParts = command.split(" ");
    let coloredCommand =
      chalk.yellow(commandParts[0]) +
      (commandParts.length > 1 ? " " : "") +
      commandParts.slice(1).join(" ");

    logMethod("> " + coloredCommand);
  });
}

export { startConsole, log, runCommand };
