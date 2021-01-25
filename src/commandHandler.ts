interface cmdIndex {
  [key: string]: any | undefined;
}
const commandIndex: cmdIndex = {};

const Command = function (name: string, callback: Function) {
  let cmd = {
    name,
    callback,
    execute: (text: string, source: any) => {
      if (text.startsWith("/")) text = text.replace("/", "");
      let parsed = text.split(/ +/g);

      callback(parsed, source);
    },
  };
  commandIndex[name.toLowerCase()] = cmd;
  return cmd;
};
const GetCommand = function (name: string) {
  name = name.split(/ +/)[0];
  return commandIndex[name.toLowerCase()];
};

export { Command, GetCommand };
