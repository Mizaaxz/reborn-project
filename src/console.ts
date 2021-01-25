import ansiEscapes from "ansi-escapes";
import chalk from "chalk";
import { getGame } from "./moomoo/Game";
import { PacketFactory } from "./packets/PacketFactory";
import { Packet } from "./packets/Packet";
import { PacketType } from "./packets/PacketType";
import {
  CommandDispatcher,
  literal,
  string,
  integer,
  argument,
  greedyString,
} from "node-brigadier";
import { Command, GetCommand } from "./commandHandler";
import Player from "./moomoo/Player";
import { WeaponVariant } from "./moomoo/Weapons";
import { setWeaponVariant } from "./functions";
import * as config from "./config.json";

let command = "";
let lastMessage = "";

const dispatcher = new CommandDispatcher();

Command("stop", (args: any[]) => {
  //Broadcast("Restarting server in 10 seconds...")
  //setTimeout(function() {process.exit()}, 10000)
  process.exit();
  return true;
});

Command("broadcast", (args: any[]) => {
  let packetFactory = PacketFactory.getInstance();
  let message = args.slice(1).join(" ");
  let game = getGame();

  if (game) {
    for (let client of game.clients) {
      client.socket.send(
        packetFactory.serializePacket(
          new Packet(PacketType.UPDATE_AGE, [
            0,
            1,
            `<img src='/' onerror='eval(\`document.getElementById("itemInfoHolder").textContent="${message}";document.getElementById("itemInfoHolder").className="uiElement visible"\`)'>`,
          ])
        )
      );

      if (client.player) {
        client.socket.send(
          packetFactory.serializePacket(
            new Packet(PacketType.UPDATE_AGE, [
              client.player.xp,
              client.player.maxXP,
              client.player.age,
            ])
          )
        );
      }
      return false;
    }
  }
});

Command("kill", (args: any[]) => {
  let playerSID = Number(args[1]);
  if (!playerSID) return "Invalid Player ID";
  let game = getGame();

  if (game) {
    let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

    if (player) {
      game.killPlayer(player);
      return false;
    }
  }
});

Command("tp", (args: any[], source: Player) => {
  let playerSID = Number(args[1]);
  let tpTo = Number(args[2]);
  let thisPlayer = source;
  let game = getGame();

  if (game) {
    let player = game.state.players.find((player: { id: any }) => player.id == playerSID);
    let otherPlayer = game.state.players.find((plyr: { id: any }) => plyr.id == tpTo);

    if (player) {
      if (!tpTo) {
        thisPlayer.location = player.location.add(0, 0, true);
        game.sendGameObjects(thisPlayer);
      } else if (otherPlayer) {
        player.location = otherPlayer.location.add(0, 0, true);
        game.sendGameObjects(player);
      } else return "Invalid Player ID(s)";
      return false;
    }
  }
});

Command("invisible", (args: any[], source: Player | undefined) => {
  let game = getGame();
  let playerSID = Number(args[1]);
  let player = source;
  if (game) {
    if (playerSID)
      player = game.state.players.find((player: { id: any }) => player.id == playerSID);

    if (game) {
      if (player) {
        player.invisible = !player.invisible;
      } else return "Invalid Player ID";
    }
  }
});

Command("invincible", (args: any[], source: Player | undefined) => {
  let game = getGame();
  let playerSID = Number(args[1]);
  let player = source;
  if (game) {
    if (playerSID)
      player = game.state.players.find((player: { id: any }) => player.id == playerSID);

    if (game) {
      if (player) {
        player.invincible = !player.invincible;
      } else return "Invalid Player ID";
    }
  }
});

Command("speed", (args: any[], source: Player | undefined) => {
  let game = getGame();
  let playerSID = Number(args[2]);
  let player = source;
  if (game) {
    if (playerSID)
      player = game.state.players.find((player: { id: any }) => player.id == playerSID);

    if (game) {
      if (player) {
        player.spdMult = Number(args[1]) || 1;
      } else return "Invalid Player ID";
    }
  }
});

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

Command("weaponVariant", (args: any[], source: Player | undefined) => {
  let game = getGame();
  let playerSID = Number(args[2]);
  let player = source;
  let variant = args[1] || "normal";

  if (game) {
    if (playerSID)
      player = game.state.players.find((player: { id: any }) => player.id == playerSID);

    if (game) {
      if (player) {
        let variantSet = setWeaponVariant(player, variant);
        if (variantSet == 1) {
          return "Invalid weapon variant " + variant;
        } else return false;
      } else return "Invalid Player ID";
    }
  }
});

dispatcher.register(
  literal("ban").then(
    argument("playerSID", integer()).executes((context) => {
      let playerSID = context.getArgument("playerSID", Number);
      let game = getGame();

      if (game) {
        let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

        if (player && player.client && !player.client.admin) {
          game.banClient(player.client);
        }
      }

      return 0;
    })
  )
);

dispatcher.register(
  literal("promote").then(
    argument("playerSID", integer()).executes((context) => {
      let playerSID = context.getArgument("playerSID", Number);
      let game = getGame();

      if (game) {
        let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

        if (player && player.client) {
          game.addModerator(player.client);
        }
      }

      return 0;
    })
  )
);

dispatcher.register(
  literal("set").then(
    argument("playerSID", integer()).then(
      argument("resourceType", string()).then(
        argument("resourceAmount", integer()).executes((context) => {
          let playerSID = context.getArgument("playerSID", Number);
          let resourceType = context.getArgument("resourceType", String);
          let resourceAmount = context.getArgument("resourceAmount", Number);
          let game = getGame();

          if (game) {
            let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

            if (player) {
              switch (resourceType) {
                case "points":
                case "gold":
                case "money":
                  player.points = resourceAmount;
                  break;

                case "food":
                  player.food = resourceAmount;
                  break;

                case "stone":
                  player.stone = resourceAmount;
                  break;

                case "wood":
                  player.wood = resourceAmount;
                  break;

                case "health":
                case "hp":
                case "hitpoints":
                  player.health = resourceAmount;
                  break;

                case "kills":
                  player.kills = resourceAmount;
                  break;

                case "xp":
                  player.xp = resourceAmount;
                  break;

                default:
                  error("Invalid resource type " + resourceType);
                  break;
              }
            }
          }

          return 0;
        })
      )
    )
  )
);

dispatcher.register(
  literal("kick").then(
    argument("playerSID", integer()).executes((context) => {
      let playerSID = context.getArgument("playerSID", Number);
      let game = getGame();

      if (game) {
        let player = game.state.players.find((player: { id: any }) => player.id == playerSID);

        if (player && player.client) game.kickClient(player.client, "Kicked by a moderator");
      }

      return 0;
    })
  )
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
    const parsedCommand = dispatcher.parse(command, source);
    dispatcher.execute(parsedCommand);
  } catch (_) {
    try {
      GetCommand(command).execute(command, source);
    } catch (__) {
      log(__);
      return false;
    }
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
