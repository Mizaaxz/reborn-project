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

export { Command, GetCommand };
