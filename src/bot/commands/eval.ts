import Command from "../Command";
import Discord from "discord.js";
import ms from "ms";
import { isAdmin } from "../modules/permissionTests";

const cmd = new Command(
  "eval",
  {
    description: "Evaluates JS code.",
    usage: "eval [code]",
    aliases: [],
    required: (mem: Discord.GuildMember) => {
      return isAdmin(mem);
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    message.channel.send("hi");
  }
);
module.exports = cmd;
