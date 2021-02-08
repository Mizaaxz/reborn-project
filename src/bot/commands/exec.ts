import Command from "../Command";
import Discord from "discord.js";
import { isStaff } from "../modules/permissionTests";
import { GetCommand } from "../../commandHandler";

const cmd = new Command(
  "exec",
  {
    description: "Executes an in-game command.",
    usage: "exec [command] <--silent>",
    aliases: ["cmd"],
    required: (mem: Discord.GuildMember) => {
      return isStaff(mem);
    },
  },
  async function (bot: Discord.Client, message: Discord.Message, args: any[]) {
    let silent = false;
    if (args[args.length - 1] == "--silent") {
      args.pop();
      silent = true;
      message.delete();
    }

    let command = args.slice(1).join(" ");
    if (!command) return message.channel.send("bruh");
    let done = "No Output";

    let run = GetCommand(command);
    if (!run) return message.channel.send("Command not found.");

    try {
      let done = run.execute(command) || "Command executed successfully.";
    } catch (e) {
      done = e;
    }

    let evalEmbed = new Discord.MessageEmbed();
    evalEmbed.setAuthor(
      `In-Game Command Execution by ${message.member?.nickname || message.author.username}`,
      message.author.displayAvatarURL()
    );
    evalEmbed.addField("Input", "```\n" + command + "```");
    evalEmbed.addField("Output", "```\n" + done + "```");
    evalEmbed.setTimestamp();

    if (!silent) message.channel.send(evalEmbed);
  }
);
module.exports = cmd;
