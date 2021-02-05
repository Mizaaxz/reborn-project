import Command from "../Command";
import Discord from "discord.js";
import fetch from "node-fetch";
import * as config from "../../config.json";
import { GetSessions } from "../../moomoo/util";

const cmd = new Command(
  "players",
  {
    description: "Shows who's online.",
    usage: "players",
    aliases: ["online"],
    adminOnly: false,
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    let clients = GetSessions() || [];

    let embed = new Discord.MessageEmbed();
    embed.setAuthor(
      `Listing ${clients.length} people online.`,
      message.guild?.iconURL() || undefined
    );
    message.channel.send(embed);
  }
);
module.exports = cmd;
