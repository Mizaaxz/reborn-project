import Discord from "discord.js";
import db from "../database";
import fs from "fs";
import * as config from "../config.json";
import { handleMessage } from "./modules/xp";

const startBot = function () {
  let startup = Date.now();
  let token = String(fs.readFileSync("token"));
  let mainGuild;

  const bot = new Discord.Client();

  bot.on("ready", () => {
    module.exports.startup = Date.now() - startup;
    mainGuild = bot.guilds.cache.get("802660392605843476");
    bot.user?.setPresence({
      activity: { name: `MooMoo Reborn with ${mainGuild?.memberCount} people!`, type: "PLAYING" },
      status: "idle",
    });
  });
  bot.on("message", (message) => {
    handleMessage(message);
    if (message.author.bot) return;
    if (message.content.startsWith(config.prefix)) {
      let args = message.content.substring(config.prefix.length).split(/ +/g);
      let cmd;
      try {
        cmd = require(`./commands/${args[0]}.js`);
      } catch (e) {
        return;
      }
      try {
        if (cmd.required(message.member)) cmd.execute(bot, message, args);
        else message.channel.send("You do not have sufficient permissions to run this command!");
      } catch (e) {}
    }
  });

  if (token) bot.login(token);
};
export default startBot;
