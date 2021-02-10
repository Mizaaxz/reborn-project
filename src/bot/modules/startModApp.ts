import Discord from "discord.js";

type Application = "moderator";

let Applications = {
  moderator: {
    name: "Moderator Application",
    start: "Please answer all questions truthfully.",
    finish: "Thank you for applying! Your application has been sent off for review!",
    questions: [
      "Why do you want to be a moderator?",
      "What is your age? (theres an age requirement)",
      "What will you do as a moderator?",
      "What is your moderating experience?",
      "What is your timezone?",
      'If someone is spamming "{username} is a hoe" in chat, what would you do?',
      "There's a report of someone hacking. There's no proof of it. What do you do?",
      "There's proof of someone hacking in-game. What do you do?",
      "Someone keeps joining and leaving the server. (therefore spamming the chat with welcome messages) What do you do?",
      "Lets say someone is impersonating Meow. What do you do?",
    ],
  },
};

function sendApp(user: Discord.User, type: Application) {
  return new Promise(async (resolve, reject) => {
    let app = Applications[type];

    let appEmbed = new Discord.MessageEmbed();
    appEmbed.setAuthor(`${app.name} - ${user.username}`, user.displayAvatarURL());
    appEmbed.setDescription(app.start);
    appEmbed.setFooter("Say `cancel` at any time to cancel the application.");
    await user.send(appEmbed);

    let current = 0;
    let responses: any[] = [];
    function sendNext(q: string) {
      user.dmChannel
        ?.awaitMessages((m) => m, { max: 1 })
        .then(async (m) => {
          let message = m.first();
          if (!message || !message.content) {
            await user.send("You need to answer the question!");
            sendNext(app.questions[current]);
            return;
          }
          responses.push(message.content);
          appEmbed.setDescription(q);
          await user.send(appEmbed);
          current++;
          if (current >= app.questions.length) {
            appEmbed.setDescription(app.finish);
            user.send(appEmbed);
            resolve(responses);
          } else sendNext(app.questions[current]);
        });
    }
    appEmbed.setDescription(app.questions[current]);
    await user.send(appEmbed);
    current++;
    sendNext(app.questions[current]);
  });
}

export { Application, Applications, sendApp };
