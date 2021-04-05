import { AdminLevel } from "./Admin";

type Account = {
  username?: string;
  password?: string;
  level?: number;
  admin?: boolean; // depreciated
  adminLevel?: AdminLevel;
  balance?: number;
};

export { Account };
