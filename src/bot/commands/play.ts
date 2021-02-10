import Command from "../Command";
import Discord from "discord.js";
import { getSpecials, isStaff } from "../modules/permissionTests";
import ytdl from "ytdl-core";
import discs from "../modules/discs";
import ms from "ms";

const cmd = new Command(
  "play",
  {
    description: "Plays a song in your voice channel.",
    usage: "play [song] --silent",
    aliases: [],
    required: (mem: Discord.GuildMember) => {
      return isStaff(mem) || getSpecials(mem).dj;
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    let silent = false;
    if (args[args.length - 1] == "--silent") {
      args.pop();
      silent = true;
      message.delete();
    }

    function play(song: string) {
      if (message.member && message.member.voice.channel)
        message.member.voice.channel
          .join()
          .then((connection) => {
            try {
              connection.play(ytdl(song, { quality: "highestaudio" }));
            } catch (e) {
              message.channel.send("Invalid Song URL");
            }
          })
          .catch(console.error);
      else {
        message.channel.send("Join a VC!");
        silent = true;
      }
    }

    let song = args.slice(1).join(" ");
    if (!song) return message.channel.send("Something to play?");

    if (song.toLowerCase() == "-list")
      return message.channel.send(
        `There are ${Object.keys(discs).length} discs: \`${Object.keys(discs).join("`, `")}\``
      );

    Object.keys(discs).forEach((d) => {
      if (song.toLowerCase() == d.toLowerCase()) song = discs[d];
    });

    play(song);

    ytdl
      .getBasicInfo(song)
      .then((info) => {
        let dt = info.videoDetails;
        let len = ms(Number(dt.lengthSeconds) * 1000);
        if (len == "0ms") len = "Live";

        let playing = new Discord.MessageEmbed();
        playing.setAuthor(
          `Song Requested by ${message.member?.nickname || message.author.username}`,
          message.author.displayAvatarURL()
        );
        playing.setTitle(info.videoDetails.title || "Unknown Video");
        playing.setURL(info.videoDetails.video_url);
        playing.addField(
          "Details",
          `**Length:** ${len}
**Posted By:** [${dt.author.name}](${dt.author.channel_url})
👍 ${dt.likes?.toLocaleString()} / 👎 ${dt.dislikes?.toLocaleString()}
👁 ${Number(dt.viewCount).toLocaleString()}`
        );
        playing.setThumbnail(dt.thumbnails[0].url);
        playing.setTimestamp();

        if (!silent) message.channel.send(playing);
      })
      .catch(console.error);
  }
);
module.exports = cmd;
