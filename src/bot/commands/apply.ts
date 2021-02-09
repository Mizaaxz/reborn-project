import Command from "../Command";
import Discord from "discord.js";
import { isAdmin, isModerator } from "../modules/permissionTests";
import { sendApp } from "../modules/startModApp";

const cmd = new Command(
  "apply",
  {
    description: "Apply to be a `moderator`.",
    usage: "apply [type]",
    aliases: [],
    required: (mem: Discord.GuildMember) => {
      return isAdmin(mem) || !isModerator(mem);
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    let type = args[1];
    if (!type) return message.channel.send("You need to reply with a valid application type.");

    switch (type) {
      case "moderator":
        sendApp(message.author, "moderator").then((responses) => {
          let res = new Array(responses);
          message.channel.send(res.join(" "));
        });
        break;
      default:
        message.channel.send("That is not a valid application type.");
        break;
    }
  }
);
module.exports = cmd;
