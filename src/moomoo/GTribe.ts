import db from "enhanced.db";
import { getAccount, setAccount } from "./Account";

export interface GTribe {
  id: string;
  name: string;
  leader: string;
  members: string[];
  description: string;
  discord: string;
}

export function getGTribe(id: string) {
  let tribe = db.get(`gtribe_${id.toLowerCase()}`);
  if (tribe) return tribe as GTribe;
  else return null;
}
export function setGTribe(id: string, tribe: GTribe) {
  db.set(`gtribe_${id.toLowerCase()}`, tribe);
}
export function delGTribe(tribe: GTribe) {
  db.delete(`gtribe_${tribe.id.toLowerCase()}`);
  let accounts = [
    getAccount(tribe.leader),
    ...tribe.members.map((m) => getAccount(m)),
  ];
  accounts.forEach((acc) => {
    if (!acc) return;
    acc.gTribe = "";
    setAccount(acc.username, acc);
  });
}

export function getGTribeByOwner(owner: string) {
  let gotten = db
    .all()
    .filter((i) => i.key.startsWith("gtribe_"))
    .find((t) => (t.value as GTribe).leader == owner);
  return gotten ? (gotten.value as GTribe) : null;
}
