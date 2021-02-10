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
    usage: "play [song/-list/-random] <--silent>",
    aliases: [],
    required: (mem: Discord.GuildMember) => {
      return isStaff(mem) || getSpecials(mem).dj;
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    message.delete();
    let silent = false;
    if (args[args.length - 1] == "--silent") {
      args.pop();
      silent = true;
    }

    let alldiscs = Object.keys(discs);

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

    function listTracks() {
      new Promise((res, rej) => {
        let discData: any = [];
        alldiscs.forEach((d) => {
          ytdl
            .getBasicInfo(discs[d])
            .then((dd) => {
              discData.push({ disc: d, data: dd.videoDetails });
              if (discData.length == alldiscs.length) res(discData);
            })
            .catch(console.error);
        });
      }).then((discData: any) => {
        discData = discData.sort((d1: any, d2: any) => {
          return d1.disc.toLowerCase() > d2.disc.toLowerCase() ? 1 : -1;
        });

        let discText: any = [];
        discData.forEach((d: any) => {
          let len = ms(Number(d.data.lengthSeconds) * 1000);
          if (len == "0ms") len = "Live";

          discText.push([`> ${d.data.title} - \`${d.disc}\``, `**Length:** ${len}\n`]);
        });
        discText = discText.slice(0, 24);

        let discDataEmbed = new Discord.MessageEmbed();
        discDataEmbed.setAuthor(
          `Disc List Requested by ${message.member?.nickname || message.author.username}`
        );
        discText.forEach((dt: any) => {
          discDataEmbed.addField(dt[0], dt[1]);
        });
        discDataEmbed.setFooter(
          `Listing ${alldiscs.length} discs.`,
          "https://i.imgur.com/zMunRBI.gif"
        );
        message.channel.send(discDataEmbed);
      });
    }

    let song = args.slice(1).join(" ");
    if (!song) return message.channel.send("Something to play?");

    if (song.toLowerCase() == "-list") return listTracks();
    if (song.toLowerCase() == "-random")
      song = alldiscs[Math.floor(Math.random() * alldiscs.length)];

    alldiscs.forEach((d) => {
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
        playing.setTitle(dt.title || "Unknown Video");
        playing.setURL(dt.video_url);
        playing.addField(
          "Details",
          `**Length:** ${len}
**Posted By:** [${dt.author.name}](${dt.author.channel_url})
👍 ${dt.likes?.toLocaleString()} / 👎 ${dt.dislikes?.toLocaleString()}
👁 ${Number(dt.viewCount).toLocaleString()}`
        );
        playing.setThumbnail(dt.thumbnails[0].url);
        playing.setFooter(`${bot.user?.username} Music`, "https://i.imgur.com/zMunRBI.gif");
        playing.setTimestamp();

        if (!silent) message.channel.send(playing);
      })
      .catch(console.error);
  }
);
module.exports = cmd;
