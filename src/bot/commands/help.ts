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
    let commands = fs.readdirSync(__dirname).map((cmd) => cmd.split(".")[0]);
    let command = args[1];

    let helpEmbed = new Discord.MessageEmbed();

    if (!command) {
      helpEmbed.setAuthor(`${bot.user?.username} Help`, bot.user?.displayAvatarURL());
      message.channel.send(helpEmbed);
    } else {
      helpEmbed.setAuthor(`${bot.user?.username} Help | ${command}`, bot.user?.displayAvatarURL());
      message.channel.send(helpEmbed);
    }

    message.channel.send(JSON.stringify(commands));
  }
);
module.exports = cmd;
