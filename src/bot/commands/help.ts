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
    let command = (args[1] || "").toLowerCase();

    let helpEmbed = new Discord.MessageEmbed();

    if (!command) {
      helpEmbed.setAuthor(`${bot.user?.username} Help`, bot.user?.displayAvatarURL());
      helpEmbed.setDescription(`\`${commands.join("`, `")}\``);
      helpEmbed.setFooter(`Listing ${commands.length} commands.`);
      helpEmbed.setTimestamp();
      message.channel.send(helpEmbed);
    } else if (commands.includes(command)) {
      let cmd = require(`${__dirname}\\${commands[command]}`);
      helpEmbed.setAuthor(`${bot.user?.username} Help | ${command}`, bot.user?.displayAvatarURL());
      helpEmbed.setDescription(cmd.description);
      message.channel.send(helpEmbed);
    } else {
      message.channel.send("That command was not found.");
    }
  }
);
module.exports = cmd;
