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
  scores?: number[];
  createdAt?: number;
};

let AccountCache: Account[] = [];

export function getAccount(username: string): Account {
  let found = AccountCache.find((a) => a.username == username);
  if (found) return found;
  let acc = db.get(`account_${username.replace(/ /g, "+")}`) as Account;
  AccountCache.push(acc);
  return getAccount(username);
}
export function setAccount(username: string, acc: Account) {
  return db.set(`account_${username.replace(/ /g, "+")}`, acc);
}

export { Account };
