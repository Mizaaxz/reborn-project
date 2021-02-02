import Discord, { Guild } from "discord.js";
import db from "./database";
import fs from "fs";
import * as config from "./config.json";

const startBot = function () {
  let token = String(fs.readFileSync("token"));
  let mainGuild;

  const bot = new Discord.Client();

  bot.on("ready", () => {
    mainGuild = bot.guilds.cache.get("802660392605843476");
    bot.user?.setPresence({
      activity: { name: `MooMoo Reborn with ${mainGuild?.memberCount} people!`, type: "PLAYING" },
      status: "idle",
    });
  });
  bot.on("message", (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(config.prefix)) {
      let args = message.content.substring(config.prefix.length).split(/ +/g);
      let cmd = require(`./commands/${args[0]}.js`);
      cmd.execute(bot, message, args);
    }
  });

  bot.login(token);
};
export default startBot;
