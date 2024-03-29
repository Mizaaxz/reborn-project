import { AdminLevel } from "./sanctuary/Admin";
import { getGame } from "./game/Game";
import Player from "./sanctuary/Player";

interface cmdIndex {
  [key: string]: any | undefined;
}
const commandIndex: cmdIndex = {};

const Command = function (
  name: string,
  callback: Function,
  options: { aliases: string[]; level: AdminLevel }
) {
  let cmd = {
    name,
    callback,
    options,
    execute: (text: string, source: Player | undefined) => {
      let permLevel = AdminLevel.None;
      if (!source?.client) permLevel = AdminLevel.Meow;
      else permLevel = source.client.admin;

      if (text.startsWith("/")) text = text.replace("/", "");
      let parsed = text.split(/ +/g);
      if (permLevel < options.level)
        return "You do not have permission to run this command.";

      return callback(parsed, source);
    },
  };
  commandIndex[name.toLowerCase()] = cmd;
  options.aliases.forEach((a) => {
    commandIndex[a.toLowerCase()] = cmd;
  });
  return cmd;
};
const GetCommand = function (name: string) {
  name = name.split(/ +/)[0];
  return commandIndex[name.toLowerCase()];
};

const playerSelector = function (
  plr: string,
  source: Player | undefined,
  allowMultiple: boolean = true
) {
  let game = getGame();
  if (!game) process.exit();
  if (!plr) return null;

  let player: Player | Player[] | undefined;

  player = game.state.players.find((p) => p.id == Number(plr));
  if (player) return player;

  if (plr == "*" && allowMultiple) return game.state.players;
  if (plr == "**" && source && allowMultiple)
    return game.state.players.filter((p) => p.id != source.id);

  if (plr.startsWith("[") && plr.endsWith("]") && allowMultiple)
    return game.state.players.filter(
      (p) =>
        p.tribe?.name.toLowerCase() ==
        plr
          .substr(1, plr.length - 2)
          .toLowerCase()
          .replace(/\+/g, " ")
    );

  if (Number(plr.replace(/\,/g, "")) && allowMultiple) {
    let IDs = plr.split(",").map(Number);
    return game.state.players.filter((p) => IDs.includes(p.id));
  }

  player = game.state.players.filter(
    (p) =>
      p.name.toLowerCase() == plr.toLowerCase() ||
      p.name.toLowerCase() == plr.toLowerCase().replace(/\+/g, " ")
  );
  if (player.length == 1 || !allowMultiple) return player[0] || null;
  if (player.length) return player;

  return null;
};

function boolSelector(bool: string | undefined) {
  switch (bool?.toLowerCase()) {
    case "true":
    case "yes":
    case "on":
      return true;

    case "false":
    case "no":
    case "off":
      return false;

    default:
      return null;
  }
}

function compareAdmin(plr?: Player, receiver?: Player) {
  if (plr == receiver) return true;
  else
    return (
      (plr?.client?.account?.adminLevel || 0) >
      (receiver?.client?.account?.adminLevel || 0)
    );
}

export { Command, GetCommand, playerSelector, boolSelector, compareAdmin };
