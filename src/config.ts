const config = {
  allowedMax:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890 !@#$%^&*()_+-=[]|:;\\\"',<.>/?`~{}",
  allowedPassword:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_=+`~,<.>;?/|[]{}' ",
  allowedUsername: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_ ",
  alphabet:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_-+={}[]|\\\"':;,<.>/?`~",
  badWords: ["fag", "faggot", "nigger", "nigga"],
  defaultSpeed: 1.2,
  featuredYT: [
    { name: "Meow", link: "https://www.youtube.com/channel/UCWANi1TTqUP1ar4VTlOrqDA" },
    { name: "Riseking", link: "https://www.youtube.com/channel/UCe3BeaOhhFLYEWPq62Anaxw" },
  ],
  gameObjectNearbyRadius: 1250,
  maxCPS: "25",
  moderatorPassword: "",
  passwordLength: { min: 8, max: 30 },
  playerNearbyRadius: 1250,
  port: 4559,
  prefix: "!",
  usernameLength: { min: 4, max: 16 },
};
export default config;
