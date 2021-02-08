import Command from "../Command";
import Discord from "discord.js";
import ms from "ms";

const cmd = new Command(
  "ping",
  {
    description: "Gets the bot's ping.",
    usage: "ping",
    aliases: ["botinfo", "bot"],
    required: (mem: Discord.GuildMember) => {
      return true;
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    let startup = require("../bot").startup;
    let trip = Date.now();

    let pingMessage = await message.channel.send("Pinging...");
    trip = Date.now() - trip;

    let embed = new Discord.MessageEmbed();
    embed.setAuthor(`${bot.user?.username} Ping`, bot.user?.displayAvatarURL());
    embed.addField("API Ping", ms(bot.ws.ping), true);
    embed.addField("Message Trip Time", ms(trip), true);
    embed.addField("Startup Time", ms(startup), true);
    embed.addField("Uptime", ms(bot.uptime || 0), true);

    pingMessage.edit("", { embed });
  }
);
module.exports = cmd;
