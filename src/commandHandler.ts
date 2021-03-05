import { getGame } from "./moomoo/Game";
import Player from "./moomoo/Player";

interface cmdIndex {
  [key: string]: any | undefined;
}
const commandIndex: cmdIndex = {};

const Command = function (name: string, callback: Function, aliases: any[]) {
  let cmd = {
    name,
    callback,
    aliases,
    execute: (text: string, source: any) => {
      if (text.startsWith("/")) text = text.replace("/", "");
      let parsed = text.split(/ +/g);

      return callback(parsed, source);
    },
  };
  commandIndex[name.toLowerCase()] = cmd;
  aliases.forEach((a) => {
    commandIndex[a.toLowerCase()] = cmd;
  });
  return cmd;
};
const GetCommand = function (name: string) {
  name = name.split(/ +/)[0];
  return commandIndex[name.toLowerCase()];
};

const playerSelector = function (plr: string, source: Player | undefined) {
  let game = getGame();
  if (!game) process.exit();

  let player: Player | Player[] | undefined;

  player =
    game.state.players.find((p) => p.id == Number(plr)) ||
    game.state.players.filter((p) => p.name.toLowerCase() == plr.toLowerCase());
  if (player) return player;

  if (plr == "*") return game.state.players;
  if (plr == "**" && source) return game.state.players.filter((p) => p.id != source.id);

  return null;
};

export { Command, GetCommand, playerSelector };
