import Command from "../classes/Command";
import Discord from "discord.js";
import ms from "ms";

const cmd = new Command(
  "ping",
  {
    description: "Gets the bot's ping.",
    usage: "ping",
    aliases: ["botinfo", "bot"],
    adminOnly: false,
  },
  function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(`${bot.user?.username} Ping`, bot.user?.displayAvatarURL());
    embed.addField("API Ping", ms(bot.ws.ping), true);
    message.channel.send(embed);
  }
);
module.exports = cmd;
