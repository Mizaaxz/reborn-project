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
  },
};
export default errCodes;
