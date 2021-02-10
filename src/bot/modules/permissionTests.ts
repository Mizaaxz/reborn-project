import { GuildMember } from "discord.js";

function isAdmin(mem: GuildMember) {
  return mem.roles.cache.has("802660889525616674") || mem.hasPermission("ADMINISTRATOR");
}
function isStaff(mem: GuildMember) {
  return mem.roles.cache.has("807261114274283520") || isAdmin(mem);
}
function isModerator(mem: GuildMember) {
  return (
    mem.roles.cache.has("802676670854856766") || mem.hasPermission("MANAGE_GUILD") || isStaff(mem)
  );
}
function isMuted(mem: GuildMember) {
  if (isModerator(mem)) return false;
  return mem.roles.cache.has("803481377920122880");
}

function getSpecials(mem: GuildMember) {
  return {
    artist: mem.roles.cache.has("802909523438207025"),
    sanctuary: mem.roles.cache.has("803395927297228802"),
    mootuber: mem.roles.cache.has("807053096831287337"),
    first: mem.roles.cache.has("803384274744639508"),
    smallpp: mem.roles.cache.has("807685559346528276"),
    beta: mem.roles.cache.has("806250186401120337"),
    secret: mem.roles.cache.has("805629613803307018"),
    est: mem.roles.cache.has("809055141630050334"),
    dj: mem.roles.cache.has("809093332797358101"),
  };
}

export { isAdmin, isStaff, isModerator, isMuted, getSpecials };
