import config from "../config.json";
const errCodes = {
  login: {
    NO_USERNAME: "Please enter a username.",
    NO_PASSWORD: "Please enter a password.",
    INVALID_USERNAME: "That username was not found.",
    INCORRECT_PASSWORD: "Incorrect password.",
  },
  create: {
    NO_USERNAME: "Please enter a username.",
    NO_PASSWORD: "Please enter a password.",
    USERNAME_FOUND: "That username already exists",
    INVALID_USERNAME: "The username uses invalid characters.",
    INVALID_PASSWORD: "The password uses invalid characters.",
    USERNAME_TOO_LONG: `Your username is too long! Try using less than ${config.usernameLength.max} characters.`,
    USERNAME_TOO_SHORT: `Your username is too short! Try using more than ${config.usernameLength.min} characters.`,
    PASSWORD_TOO_LONG: `Your password is too long! Try using less than ${config.passwordLength.max} characters.`,
    PASSWORD_TOO_SHORT: `Your password is too short! Try using more than ${config.passwordLength.min} characters.`,
    HASH_ERROR: "Error when hashing your password.",
  },
};
export default errCodes;
