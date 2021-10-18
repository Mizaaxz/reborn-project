import { AdminLevel } from "./Admin";

type Account = {
  username: string;
  displayName: string;
  password: string;
  level?: number;
  admin?: boolean; // depreciated
  adminLevel?: AdminLevel;
  balance?: number;
  mootuber?: boolean;
};

export { Account };
