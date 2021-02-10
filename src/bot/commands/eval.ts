import Command from "../Command";
import Discord from "discord.js";
import { isAdmin, isStaff, isModerator, getSpecials, isMuted } from "../modules/permissionTests";
import ytdl from "ytdl-core";
import speech from "@google-cloud/speech";

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

    function doTheThing() {
      bot.on("message", (m) => {
        if (m.channel.id == message.channel.id) {
          try {
            m.react("809060469906079784");
          } catch (e) {}
        }
      });
    }

    function playIt(song: string = "https://www.youtube.com/watch?v=0avFvn3Chyg") {
      if (song.toLowerCase() == "lofi") song = "https://www.youtube.com/watch?v=5qap5aO4i9A";

      if (message.member && message.member.voice.channel)
        message.member.voice.channel
          .join()
          .then((connection) => {
            connection.play(ytdl(song, { quality: "highestaudio" })).on("end", () => {
              connection.channel.leave();
            });
          })
          .catch(console.error);
    }
    /*function vcmd() {
      const client = new speech.SpeechClient();

      const recognizeStream = client
        .streamingRecognize({
          config: {
            encoding: "OGG_OPUS",
            sampleRateHertz: 16000,
            languageCode: "BCP-47 language code, e.g. en-US",
          },
          interimResults: false,
        })
        .on("error", console.error)
        .on("data", (data) => {
          message.channel.send(
            data.results[0] && data.results[0].alternatives[0]
              ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
              : "\n\nReached transcription time limit, press Ctrl+C\n"
          );
        });

      if (message.member && message.member.voice.channel)
        message.member.voice.channel
          .join()
          .then((connection) => {
            connection.receiver.createStream(message.author).pipe(recognizeStream);
          })
          .catch(console.error);
    }*/

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
