import Discord from "discord.js";
import db from "../../database";

let Levels = {
  1000: { name: "Food", emoji: "802944418671362138", role: "" },
  2500: { name: "Wood", emoji: "802944470719004702", role: "" },
  5000: { name: "Stone", emoji: "802944460031524874", role: "" },
  7500: { name: "Gold", emoji: "802944433704271913", role: "" },
  10000: { name: "Killer", emoji: "802944444370255882", role: "" },
  Infinity: { name: "GODLIKE", emoji: "802944408193597440", role: "" },
};

function levelUp(user: Discord.User) {
  let messages = db.get(`messages_${user.id}`);
  if (messages > 50000) {
  }
}

function handleMessage(message: Discord.Message) {
  if (message.author.bot) return;
  db.add(`messages_${message.author.id}`, 1);
  levelUp(message.author);
}

export { handleMessage, Levels };
