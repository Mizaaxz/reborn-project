import Command from "../Command";
import Discord from "discord.js";
import ms from "ms";
import { isAdmin } from "../modules/permissionTests";

const cmd = new Command(
  "eval",
  {
    description: "Evaluates JS code.",
    usage: "eval [code] <--silent>",
    aliases: [],
    required: (mem: Discord.GuildMember) => {
      return isAdmin(mem);
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    let silent = false;
    if (args[args.length - 1] == "--silent") {
      args.pop();
      silent = true;
    }

    let code = args.slice(1).join(" ");
    if (!code) return message.channel.send("bruh");
    let done = "You fucked it up.";

    try {
      done = eval(code);
    } catch (err) {
      done = err;
    }

    let evalEmbed = new Discord.MessageEmbed();
    evalEmbed.setAuthor(
      `Code Eval by ${message.member?.nickname || message.author.username}`,
      message.author.displayAvatarURL()
    );
    evalEmbed.addField("Input", "```js\n" + code + "```");
    evalEmbed.addField("Output", "```js\n" + done + "```");
    evalEmbed.setTimestamp();

    if (!silent) message.channel.send(evalEmbed);
  }
);
module.exports = cmd;
