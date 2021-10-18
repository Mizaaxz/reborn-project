import { AdminLevel } from "./Admin";
import db from "enhanced.db";

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

export function getAccount(username: string) {
  return db.get(`account_${username.replace(/ /g, "+")}`) as Account;
}
export function setAccount(username: string, acc: Account) {
  return db.set(`account_${username.replace(/ /g, "+")}`, acc);
}

export { Account };
