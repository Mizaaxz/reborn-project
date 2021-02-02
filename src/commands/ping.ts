import Command from "../classes/Command";
import Discord from "discord.js";

const cmd = new Command(
  "ping",
  {
    description: "Gets the bot's ping.",
    usage: "ping",
    aliases: ["botinfo", "bot"],
    adminOnly: false,
  },
  function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    message.channel.send("P0nG");
  }
);
module.exports = cmd;
