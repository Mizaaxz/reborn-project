const config = {
  allowedMax:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890 !@#$%^&*()_+-=[]|:;\\\"',<.>/?`~{}",
  allowedPassword:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_=+`~,<.>;?/|[]{}' ",
  allowedUsername: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_ ",
  alphabet:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_-+={}[]|\\\"':;,<.>/?`~",
  badWords: ["fag", "faggot", "nigger", "nigga"],
  defaultSpeed: 1.5,
  featuredYT: [
    { name: "Meow", link: "https://www.youtube.com/channel/UCWANi1TTqUP1ar4VTlOrqDA" },
    { name: "Riseking", link: "https://www.youtube.com/channel/UCe3BeaOhhFLYEWPq62Anaxw" },
	{ name: "AppleTacoYT", link: "https://www.youtube.com/channel/UCXd0WfGLoHVyx82AKB4ZSHQ" },
	{ name: "21st - Your Local Idiot", link: "https://www.youtube.com/channel/UCPtSORLvl44enwpHHXHpreQ" },
	{ name: "123SMG", link: "https://www.youtube.com/channel/UCt96Ef3O4OhzWk2LLYb7ShA" }
  ],
  gameObjectNearbyRadius: 1250,
  maxCPS: "25",
  moderatorPassword: "",
  passwordLength: { min: 8, max: 30 },
  playerNearbyRadius: 1250,
  animalNearbyRadius: 1250,
  port: 80,
  prefix: "!",
  usernameLength: { min: 4, max: 16 },
  maxAge: 100,
};
export default config;
