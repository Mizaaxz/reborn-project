import Command from "../Command";
import Discord from "discord.js";
import fs from "fs";

const cmd = new Command(
  "help",
  {
    description: "Displays this menu!",
    usage: "help <command>",
    aliases: ["commands", "cmds"],
    required: (mem: Discord.GuildMember) => {
      return true;
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    message.channel.send(__dirname);
    let commands = fs.readdirSync("./");
    message.channel.send(JSON.stringify(commands));
  }
);
module.exports = cmd;
