import Command from "../Command";
import Discord from "discord.js";
import { isAdmin, isStaff, isModerator, getSpecials, isMuted } from "../modules/permissionTests";
import ytdl from "ytdl-core";

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
      message.delete();
    }

    function playIt() {
      if (message.member && message.member.voice.channel)
        message.member.voice.channel
          .join()
          .then((connection) => {
            connection
              .play(
                ytdl("https://www.youtube.com/watch?v=0avFvn3Chyg", { quality: "highestaudio" })
              )
              .on("end", () => {
                connection.channel.leave();
              });
          })
          .catch(console.error);
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
