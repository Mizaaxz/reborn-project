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
    let commands = fs.readdirSync(__dirname);
    message.channel.send(JSON.stringify(commands));
  }
);
module.exports = cmd;
